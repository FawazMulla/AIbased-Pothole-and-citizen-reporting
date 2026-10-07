# 05 – Viva Q&A

## ML fundamentals
**Q: YOLO or CNN – which did you use?**
YOLO *is* a CNN (CSPDarknet backbone + PAN neck + detection head). A plain classification CNN gives one label per image; we need location, count and area, so we use a detector. We *also* use a CNN classifier (MobileNetV3) as a road-validity gate and MiDaS (CNN encoder-decoder) for depth.

**Q: Why not train a CNN from scratch?**
Small data + limited compute. Transfer learning reuses ImageNet/COCO features (edges, textures) and converges faster with less data.

**Q: What is transfer learning here?**
MobileNetV3 pre-trained on ImageNet; phase A trains only the new head, phase B fine-tunes everything with a 10× smaller learning rate.

**Q: Which loss functions?**
Classifier: Cross-Entropy. YOLOv8: CIoU + DFL (boxes), BCE (classes), BCE/Dice (masks). Faster R-CNN: RPN objectness + box regression + ROI classification.

**Q: What does mAP@0.5 mean?**
Mean over classes of Average Precision (area under precision-recall curve) where a detection is correct if IoU with ground truth ≥ 0.5. mAP@0.5:0.95 averages over IoU thresholds 0.5…0.95 (stricter).

**Q: Precision vs recall in this application?**
Precision = fraction of reported potholes that are real (false alarms waste crews). Recall = fraction of real potholes found (misses are safety risks). We report both plus F1.

**Q: How do you avoid overfitting?**
Augmentation (colour jitter, flip, mosaic, scale), early stopping (`patience`), best-checkpoint by validation metric, held-out test split never used for tuning, pre-trained weights.

**Q: How did you split data?**
70/15/15 train/val/test with fixed seed 42; test used only for the final numbers.

**Q: False positives on shadows/cracks?**
Training includes negative images (roads without D40), HSV augmentation for lighting, road-gate classifier, conf threshold 0.25 with NMS.

**Q: Why segmentation instead of boxes?**
A box includes lots of undamaged road; the mask gives the true damaged area used for severity.

**Q: How is severity computed and is it valid?**
`0.55·area + 0.35·depth + 0.10·count`, thresholds calibrated on human-labelled images (`calibrate_severity.py`). Depth is *relative* (MiDaS), not centimetres – stated as limitation.

**Q: Why not use model confidence as severity?**
Confidence measures certainty of detection, not size/depth of damage.

**Q: What is Grad-CAM?**
Heat-map from gradients of the class score w.r.t. the last conv feature maps; shows image regions that drove the CNN decision – explainability and debugging.

**Q: Why Faster R-CNN as baseline?**
Classic two-stage detector (RPN + head): accurate but slower; shows the accuracy/latency trade-off versus one-stage YOLO.

**Q: Why MobileNetV3-Small for the gate?**
Very small/fast (depthwise-separable convs), runs on CPU in milliseconds, adequate for a 3-class problem.

**Q: Limitations / future work?**
Relative (not metric) depth; dataset bias toward some countries; night/rain performance; no video; future: metric depth with camera calibration, active learning from officer corrections, mobile on-device inference (TFLite/ONNX).

## System questions
**Q: Why FastAPI?** Async, Pydantic validation, auto OpenAPI docs, easy ML integration.
**Q: How is it deployed?** Render: one web service serving API + built React; Postgres for persistence (`render.yaml`).
**Q: Why base64 images?** Simple transport and storage with the complaint; tradeoff is larger payloads (future: object storage/S3).
**Q: How does it work without trained weights?** Each ML stage is optional; falls back to the legacy YOLO model.
**Q: How do you test?** `backend/test_api.py` for endpoints; `ml_training/benchmark.py` for model quality.
**Q: Security?** Content-type check on upload; (future) auth tokens for CMS, rate limiting, restricting CORS origins.
