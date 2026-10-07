"""
Step 3 - Benchmark: compare detectors on the SAME held-out test split.

Metrics per model: Precision, Recall, mAP@0.5, mAP@0.5:0.95, latency (ms/img), size (MB).
Output: ml_training/runs/benchmark.json + a Markdown table printed to the console
(copy the table into your report / slides).

Usage:
  python -m ml_training.benchmark --data datasets/pothole \
      --yolo backend/weights/pothole_det.pt --yolo_seg backend/weights/pothole_seg.pt \
      --frcnn ml_training/runs/frcnn.pt
"""
import argparse
import glob
import json
import os
import time

import torch
from PIL import Image
from torchmetrics.detection.mean_ap import MeanAveragePrecision
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision.transforms.functional import to_tensor
from ultralytics import YOLO

from .train_frcnn import YoloFolderDataset


def size_mb(path):
    return round(os.path.getsize(path) / 1e6, 1)


def bench_yolo(path, data_yaml, test_images):
    model = YOLO(path)
    m = model.val(data=data_yaml, split="test", verbose=False)
    # latency on 50 test images (batch size 1, includes pre/post-processing)
    imgs = test_images[:50]
    model.predict(imgs[0], verbose=False)             # warm-up
    t = time.perf_counter()
    for p in imgs:
        model.predict(p, imgsz=640, verbose=False)
    ms = (time.perf_counter() - t) / len(imgs) * 1000
    return dict(precision=float(m.box.mp), recall=float(m.box.mr), map50=float(m.box.map50),
                map50_95=float(m.box.map), latency_ms=round(ms, 1), size_mb=size_mb(path))


@torch.no_grad()
def bench_frcnn(path, root):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = fasterrcnn_resnet50_fpn(weights=None, weights_backbone=None)
    model.roi_heads.box_predictor = FastRCNNPredictor(model.roi_heads.box_predictor.cls_score.in_features, 2)
    model.load_state_dict(torch.load(path, map_location=device))
    model.to(device).eval()
    ds = YoloFolderDataset(root, "test")
    metric = MeanAveragePrecision(iou_type="bbox")
    total = 0.0
    for img, target in ds:
        t = time.perf_counter()
        pred = model([img.to(device)])[0]
        total += time.perf_counter() - t
        metric.update([{k: v.cpu() for k, v in pred.items()}], [target])
    r = metric.compute()
    return dict(precision=None, recall=float(r["mar_100"]), map50=float(r["map_50"]),
                map50_95=float(r["map"]), latency_ms=round(total / len(ds) * 1000, 1), size_mb=size_mb(path))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--yolo")
    ap.add_argument("--yolo_seg")
    ap.add_argument("--frcnn")
    args = ap.parse_args()
    yaml_path = os.path.join(args.data, "data.yaml")
    test_images = sorted(glob.glob(os.path.join(args.data, "images", "test", "*")))
    if not test_images:
        test_images = sorted(glob.glob(os.path.join(args.data, "test", "images", "*")))

    results = {}
    if args.yolo:
        results["YOLOv8s (detect)"] = bench_yolo(args.yolo, yaml_path, test_images)
    if args.yolo_seg:
        results["YOLOv8s (seg)"] = bench_yolo(args.yolo_seg, yaml_path, test_images)
    if args.frcnn:
        results["Faster R-CNN R50-FPN"] = bench_frcnn(args.frcnn, args.data)

    os.makedirs("ml_training/runs", exist_ok=True)
    json.dump(results, open("ml_training/runs/benchmark.json", "w"), indent=2)
    print("\n| Model | Precision | Recall | mAP@0.5 | mAP@0.5:0.95 | Latency (ms) | Size (MB) |")
    print("|---|---|---|---|---|---|---|")
    for name, r in results.items():
        p = "-" if r["precision"] is None else f"{r['precision']:.3f}"
        print(f"| {name} | {p} | {r['recall']:.3f} | {r['map50']:.3f} | {r['map50_95']:.3f} | {r['latency_ms']} | {r['size_mb']} |")


if __name__ == "__main__":
    main()
