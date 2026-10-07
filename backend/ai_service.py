"""
AI inference service - orchestrates the multi-stage ML pipeline.

    photo ──► [1] CNN road classifier (gate)
          └─► [2] YOLOv8 pothole detector / segmenter
          └─► [3] MiDaS depth estimation (optional)
          └─► [4] Severity score = f(area, depth, count)
          └─► [5] Grad-CAM heat-map + annotated image

main.py only calls `ai_service.detect(image_bytes)`; everything else is hidden
here. The returned dict matches models.DetectionResult (new fields are optional).
Detailed explanation: docs/02_ML_PIPELINE.md
"""
import base64
import os
import time
from typing import Any, Dict, List

import cv2
import numpy as np
import torch

from .ml.classifier import RoadClassifier
from .ml.depth import DepthEstimator
from .ml.gradcam import grad_cam
from .ml.segmenter import PotholeSegmenter
from .ml.severity import compute_severity

WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "weights")
# If the classifier is at least this sure the photo is NOT a road, we reject it.
NOT_ROAD_REJECT_CONF = 0.85

SEVERITY_COLORS_BGR = {"HIGH": (30, 40, 220), "MEDIUM": (20, 140, 240), "LOW": (30, 180, 50)}


def _to_data_uri(img_bgr: np.ndarray, quality: int = 88) -> str:
    """Encode an OpenCV image as a base64 JPEG data-URI the frontend can show directly."""
    _, buf = cv2.imencode(".jpg", img_bgr, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return "data:image/jpeg;base64," + base64.b64encode(buf).decode("utf-8")


class PotholeDetectionService:
    def __init__(self):
        self.device = os.getenv("YOLO_DEVICE", "cuda:0") if torch.cuda.is_available() else "cpu"
        self.classifier = RoadClassifier(os.path.join(WEIGHTS_DIR, "road_classifier.pt"), "cpu")
        self.segmenter = PotholeSegmenter(device=self.device)
        self.depth = DepthEstimator(device="cpu")

    @property
    def model(self):
        """Kept for backwards compatibility (/health endpoint checks it)."""
        return self.segmenter.model

    # ------------------------------------------------------------------ helpers
    def _annotate(self, img_bgr: np.ndarray, dets: List[Dict[str, Any]], severity: str) -> np.ndarray:
        """Draw translucent masks, boxes and labels."""
        out = img_bgr.copy()
        color = SEVERITY_COLORS_BGR[severity]
        overlay = out.copy()
        for d in dets:
            if d["has_true_mask"]:
                overlay[d["mask"]] = color
        out = cv2.addWeighted(overlay, 0.35, out, 0.65, 0)

        for i, d in enumerate(dets):
            x1, y1, x2, y2 = d["bbox"]
            cv2.rectangle(out, (x1, y1), (x2, y2), color, 3)
            text = f"Pothole #{i + 1} ({int(d['confidence'] * 100)}%) - {severity}"
            (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
            cv2.rectangle(out, (x1, max(0, y1 - th - 10)), (x1 + tw + 12, y1), color, -1)
            cv2.putText(out, text, (x1 + 6, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
        return out

    def _empty_result(self, img_bgr: np.ndarray, summary: str, start: float, **extra) -> Dict[str, Any]:
        uri = _to_data_uri(img_bgr, 85)
        return {
            "detected": False, "pothole_count": 0, "confidence": 0.0, "severity": "LOW",
            "detections": [], "summary": summary, "annotated_image": uri, "original_image": uri,
            "duration_ms": round((time.perf_counter() - start) * 1000, 1),
            "model_provenance": self._provenance(), **extra,
        }

    def _provenance(self) -> str:
        parts = [f"Detector: {os.path.basename(self.segmenter.model_path)}"]
        if self.classifier.is_available:
            parts.append("Road gate: MobileNetV3-Small")
        if self.depth.is_available:
            parts.append("Depth: MiDaS-small")
        return " | ".join(parts)

    # --------------------------------------------------------------------- main
    def detect(self, image_bytes: bytes) -> Dict[str, Any]:
        start = time.perf_counter()
        img_bgr = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Invalid or unreadable image file.")
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        # ---- Stage 1: CNN road gate + Grad-CAM -------------------------------
        road_info, gradcam_uri = None, None
        if self.classifier.is_available:
            road_info = self.classifier.predict(img_rgb)
            if road_info["label"] == "not_road" and road_info["confidence"] >= NOT_ROAD_REJECT_CONF:
                return self._empty_result(
                    img_bgr, "This does not look like a road photo. Please upload a clear photo of the road surface.",
                    start, road_check=road_info)
            target = ["not_road", "road_clean", "road_pothole"].index(road_info["label"])
            try:
                gradcam_uri = _to_data_uri(cv2.cvtColor(grad_cam(self.classifier, img_rgb, target), cv2.COLOR_RGB2BGR))
            except Exception as e:
                print(f"[AI Service] Grad-CAM skipped: {e}")

        # ---- Stage 2: YOLO detection / segmentation --------------------------
        try:
            dets = self.segmenter.predict(img_bgr)
        except Exception as e:
            print(f"[AI Service] Detector warning: {e}")
            dets = []

        if not dets:
            return self._empty_result(img_bgr, "No road defects detected in this photo.", start,
                                      road_check=road_info, gradcam_image=gradcam_uri)

        # ---- Stage 3: depth per pothole --------------------------------------
        depth_scores = []
        if self.depth.is_available:
            try:
                dmap = self.depth.depth_map(img_rgb)
                for d in dets:
                    s = self.depth.pothole_depth_score(dmap, d["mask"])
                    d["depth_score"] = None if s is None else round(s, 3)
                    if s is not None:
                        depth_scores.append(s)
            except Exception as e:
                print(f"[AI Service] Depth skipped: {e}")
        depth_score = max(depth_scores) if depth_scores else None

        # ---- Stage 4: severity -----------------------------------------------
        total_area = sum(d["area_ratio"] for d in dets)
        sev = compute_severity(total_area, len(dets), depth_score)
        severity = sev["severity"]
        max_conf = max(d["confidence"] for d in dets)

        # ---- Stage 5: output -------------------------------------------------
        annotated = self._annotate(img_bgr, dets, severity)
        public_dets = [
            {k: d[k] for k in ("class_name", "confidence", "bbox", "area_ratio")} | {"depth_score": d.get("depth_score")}
            for d in dets
        ]
        n = len(dets)
        summary = f"{n} pothole defect{'s' if n > 1 else ''} identified ({int(max_conf * 100)}% confidence, {severity} Severity)."
        return {
            "detected": True,
            "pothole_count": n,
            "confidence": round(max_conf, 2),
            "severity": severity,
            "severity_score": sev["score"],
            "depth_score": None if depth_score is None else round(depth_score, 3),
            "detections": public_dets,
            "summary": summary,
            "annotated_image": _to_data_uri(annotated),
            "original_image": _to_data_uri(img_bgr, 85),
            "gradcam_image": gradcam_uri,
            "road_check": road_info,
            "duration_ms": round((time.perf_counter() - start) * 1000, 1),
            "model_provenance": self._provenance(),
        }


# Global singleton (loaded once when the server starts)
ai_service = PotholeDetectionService()
