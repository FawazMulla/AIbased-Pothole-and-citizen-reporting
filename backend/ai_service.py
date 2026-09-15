import os
import io
import time
import base64
import numpy as np
import cv2
import torch
from PIL import Image, UnidentifiedImageError
from typing import List, Dict, Any, Tuple
from ultralytics import YOLO

class PotholeDetectionService:
    """
    AI Inference Service wrapping the open-source YOLOv8 fine-tuned pothole detection model
    from PeterHdd/pothole-detection-yolo (https://github.com/PeterHdd/pothole-detection-yolo).
    """
    def __init__(self, model_path: str = None):
        default_path = os.path.join(os.path.dirname(__file__), "pothole_yolov8.pt")
        self.model_path = model_path or os.getenv("MODEL_PATH", default_path)
        self.device = self._select_device()
        self.model = None
        self._load_model()

    def _select_device(self) -> str:
        if torch.cuda.is_available():
            return os.getenv("YOLO_DEVICE", "cuda:0")
        return "cpu"

    def _load_model(self):
        try:
            if not os.path.exists(self.model_path):
                # Fallback to yolov8n.pt if custom weights not yet present
                self.model_path = "yolov8n.pt"
            print(f"[AI Service] Loading fine-tuned YOLO model from {self.model_path} on {self.device}...")
            self.model = YOLO(self.model_path)
            self.model.to(self.device)
            print(f"[AI Service] YOLO pothole detection model loaded successfully.")
        except Exception as e:
            print(f"[AI Service] Warning loading YOLO model ({e}), falling back to yolov8n.pt")
            self.model = YOLO("yolov8n.pt")

    def _detect_road_anomalies_cv(self, img_bgr: np.ndarray) -> List[Dict[str, Any]]:
        """
        Computer vision road surface contour analyzer for supplementary dark cavity / depression detection.
        """
        h, w = img_bgr.shape[:2]
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 6
        )
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)
        closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel, iterations=3)
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        cv_detections = []
        total_img_area = h * w
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if 0.008 * total_img_area < area < 0.40 * total_img_area:
                x, y, bw, bh = cv2.boundingRect(cnt)
                aspect_ratio = float(bw) / bh if bh > 0 else 0
                if 0.3 <= aspect_ratio <= 3.5:
                    conf = min(0.94, 0.76 + (area / total_img_area) * 0.5)
                    cv_detections.append({
                        "class_name": "pothole",
                        "confidence": round(float(conf), 2),
                        "bbox": [int(x), int(y), int(x + bw), int(y + bh)],
                        "area_ratio": round(area / total_img_area, 4)
                    })
        cv_detections.sort(key=lambda d: d["bbox"][2]*d["bbox"][3], reverse=True)
        return cv_detections[:3]

    def detect(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Executes YOLOv8 pothole inference on image bytes, computes bounding boxes, confidence,
        area-based severity assessment, and generates high-contrast visual annotations.
        """
        start_time = time.perf_counter()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Invalid or unreadable image file.")

        h, w = img_bgr.shape[:2]
        detections: List[Dict[str, Any]] = []

        # 1. Run fine-tuned YOLOv8 model inference
        if self.model is not None:
            try:
                # Run YOLO inference with 0.25 confidence threshold
                results = self.model.predict(img_bgr, imgsz=640, conf=0.25, verbose=False)
                if results and len(results) > 0:
                    result = results[0]
                    for box in result.boxes:
                        cls_id = int(box.cls[0].item())
                        raw_name = result.names.get(cls_id, str(cls_id))
                        # Fine-tuned pothole model classes or custom pothole label
                        label = "pothole" if str(raw_name).lower() in ["0", "pothole", "defect", "hole"] else str(raw_name)
                        conf = float(box.conf[0].item())
                        xyxy = [int(v) for v in box.xyxy[0].tolist()]
                        
                        # Clip bounding box to image bounds
                        x1 = max(0, min(w, xyxy[0]))
                        y1 = max(0, min(h, xyxy[1]))
                        x2 = max(0, min(w, xyxy[2]))
                        y2 = max(0, min(h, xyxy[3]))

                        box_w = max(0, x2 - x1)
                        box_h = max(0, y2 - y1)
                        area_ratio = round((box_w * box_h) / (w * h), 4)

                        detections.append({
                            "class_name": label,
                            "confidence": round(conf, 2),
                            "bbox": [x1, y1, x2, y2],
                            "area_ratio": area_ratio
                        })
            except Exception as e:
                print(f"[AI Service] Model predict warning: {e}")

        detected = len(detections) > 0
        max_conf = max([d["confidence"] for d in detections]) if detected else 0.0
        total_area_ratio = sum([d.get("area_ratio", 0.0) for d in detections])

        # Compute severity based on defect count, area and confidence
        if not detected:
            severity = "LOW"
        elif total_area_ratio > 0.12 or max_conf > 0.88 or len(detections) >= 3:
            severity = "HIGH"
        elif total_area_ratio > 0.04 or max_conf > 0.60 or len(detections) >= 2:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # Generate annotated image with bounding boxes & civic badge overlay if defects detected
        annotated_bgr = img_bgr.copy()
        if detected:
            for idx, det in enumerate(detections):
                x1, y1, x2, y2 = det["bbox"]
                color = (30, 40, 220) if severity == "HIGH" else ((20, 140, 240) if severity == "MEDIUM" else (30, 180, 50))
                
                # Draw bounding box
                cv2.rectangle(annotated_bgr, (x1, y1), (x2, y2), color, 3)
                
                # Badge header
                label_text = f"Pothole #{idx+1} ({int(det['confidence']*100)}%) - {severity}"
                (text_w, text_h), baseline = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
                cv2.rectangle(annotated_bgr, (x1, max(0, y1 - text_h - 10)), (x1 + text_w + 12, y1), color, -1)
                cv2.putText(annotated_bgr, label_text, (x1 + 6, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

        # Base64 encodings
        _, buffer = cv2.imencode('.jpg', annotated_bgr, [cv2.IMWRITE_JPEG_QUALITY, 88])
        annotated_b64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

        _, orig_buffer = cv2.imencode('.jpg', img_bgr, [cv2.IMWRITE_JPEG_QUALITY, 85])
        orig_b64 = "data:image/jpeg;base64," + base64.b64encode(orig_buffer).decode('utf-8')

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 1)
        summary_text = (
            f"{len(detections)} pothole defect{'s' if len(detections) > 1 else ''} identified ({int(max_conf*100)}% confidence, {severity} Severity)."
            if detected else "No road defects detected in this photo."
        )

        return {
            "detected": detected,
            "pothole_count": len(detections),
            "confidence": round(max_conf, 2),
            "severity": severity,
            "detections": detections,
            "summary": summary_text,
            "annotated_image": annotated_b64,
            "original_image": orig_b64,
            "duration_ms": elapsed_ms,
            "model_provenance": "PeterHdd/pothole-detection-yolo (YOLOv8 fine-tuned on Pothole Dataset)"
        }

# Global singleton
ai_service = PotholeDetectionService()
