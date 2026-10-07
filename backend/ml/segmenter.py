"""
Stage 2 - Pothole detector / segmenter (YOLOv8).

YOLOv8 = a deep CNN (CSPDarknet backbone + PAN neck + anchor-free head).
  * detect model (yolov8*.pt)     -> bounding boxes
  * segment model (yolov8*-seg.pt)-> boxes + pixel masks (exact pothole shape)

This wrapper hides the difference: every detection gets a boolean `mask`.
For a detect-only model the mask is simply the filled box (less precise).

Model priority (first file that exists):
    1. $MODEL_PATH
    2. backend/weights/pothole_seg.pt     <- trained by ml_training/train_yolo.py --task seg
    3. backend/weights/pothole_det.pt     <- trained by ml_training/train_yolo.py --task detect
    4. backend/pothole_yolov8.pt          <- legacy downloaded model
    5. yolov8n.pt                         <- generic COCO model (last resort)
"""
import os
from typing import Any, Dict, List

import cv2
import numpy as np
from ultralytics import YOLO

BASE = os.path.dirname(os.path.dirname(__file__))      # backend/
CANDIDATES = [
    os.getenv("MODEL_PATH", ""),
    os.path.join(BASE, "weights", "pothole_seg.pt"),
    os.path.join(BASE, "weights", "pothole_det.pt"),
    os.path.join(BASE, "pothole_yolov8.pt"),
]


class PotholeSegmenter:
    def __init__(self, device: str = "cpu", conf: float = 0.25):
        self.device = device
        self.conf = conf
        self.model_path = next((p for p in CANDIDATES if p and os.path.exists(p)), "yolov8n.pt")
        print(f"[Segmenter] Loading YOLO weights: {self.model_path} on {device}")
        self.model = YOLO(self.model_path)
        self.is_custom = self.model_path != "yolov8n.pt"

    def predict(self, img_bgr: np.ndarray) -> List[Dict[str, Any]]:
        """Returns a list of detections: class_name, confidence, bbox, area_ratio, mask."""
        h, w = img_bgr.shape[:2]
        result = self.model.predict(img_bgr, imgsz=640, conf=self.conf, device=self.device, verbose=False)[0]
        out: List[Dict[str, Any]] = []
        has_masks = result.masks is not None

        for i, box in enumerate(result.boxes):
            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
            x1, y1, x2, y2 = max(0, x1), max(0, y1), min(w, x2), min(h, y2)

            mask = np.zeros((h, w), dtype=bool)
            if has_masks:
                # result.masks.xy[i] = polygon of the pothole in pixel coordinates
                poly = np.array(result.masks.xy[i], dtype=np.int32)
                if len(poly) >= 3:
                    canvas = np.zeros((h, w), dtype=np.uint8)
                    cv2.fillPoly(canvas, [poly], 1)
                    mask = canvas.astype(bool)
            if not mask.any():                       # detect-only model: use the box
                mask[y1:y2, x1:x2] = True

            raw = str(result.names.get(int(box.cls[0].item()), "pothole")).lower()
            out.append({
                "class_name": "pothole" if raw in ("0", "pothole", "defect", "hole", "d40") else raw,
                "confidence": round(float(box.conf[0].item()), 2),
                "bbox": [x1, y1, x2, y2],
                "area_ratio": round(float(mask.sum()) / (w * h), 4),
                "mask": mask,
                "has_true_mask": has_masks,
            })
        return out
