"""
Step 2b - Train YOLOv8 on the prepared pothole dataset.

  --task detect : boxes only (works with the RDD2022 labels produced by data_prep.py)
  --task seg    : instance segmentation (needs polygon labels, e.g. a Roboflow
                  "pothole segmentation" export in YOLOv8 format -> pass its data.yaml)

Key hyper-parameters (explain these in the viva):
  epochs / patience : training length / early stopping if val mAP stops improving
  imgsz=640         : input resolution
  augmentation      : hsv_h/s/v colour jitter (lighting), fliplr, mosaic (4 images in 1),
                      translate / scale (camera distance variation)
Loss (inside Ultralytics): box = CIoU, cls = BCE, dfl = Distribution Focal Loss
              (+ mask BCE for segmentation).

Usage:
  python -m ml_training.train_yolo --data datasets/pothole/data.yaml --task detect --model yolov8s.pt
"""
import argparse
import os
import shutil

from ultralytics import YOLO


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--task", choices=["detect", "seg"], default="detect")
    ap.add_argument("--model", default=None, help="default yolov8s.pt / yolov8s-seg.pt")
    ap.add_argument("--epochs", type=int, default=80)
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--name", default=None)
    args = ap.parse_args()

    model_name = args.model or ("yolov8s-seg.pt" if args.task == "seg" else "yolov8s.pt")
    run_name = args.name or f"yolo_{args.task}"
    model = YOLO(model_name)                      # COCO-pretrained = transfer learning
    model.train(
        data=args.data, epochs=args.epochs, imgsz=640, batch=args.batch, patience=15,
        project="ml_training/runs", name=run_name, exist_ok=True,
        hsv_h=0.015, hsv_s=0.6, hsv_v=0.4, fliplr=0.5, mosaic=1.0, scale=0.5, translate=0.1,
    )
    best = os.path.join("ml_training", "runs", run_name, "weights", "best.pt")
    dst = os.path.join("backend", "weights", "pothole_seg.pt" if args.task == "seg" else "pothole_det.pt")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy(best, dst)
    print(f"Best weights copied to {dst}")

    metrics = YOLO(dst).val(data=args.data, split="test")       # evaluate on held-out TEST split
    print("mAP50:", metrics.box.map50, "mAP50-95:", metrics.box.map,
          "P:", metrics.box.mp, "R:", metrics.box.mr)


if __name__ == "__main__":
    main()
