"""
Step 2c - Train a Faster R-CNN (ResNet-50 FPN) baseline on the SAME split as YOLO.

Faster R-CNN is a TWO-stage detector (Region Proposal Network, then a
classification/regression head). It is usually accurate but slower than YOLO -
this is the comparison point for the benchmark table.

Reads the YOLO-format dataset produced by data_prep.py.

Usage:
  python -m ml_training.train_frcnn --data datasets/pothole --epochs 10
"""
import argparse
import glob
import os

import torch
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision.models.detection import FasterRCNN_ResNet50_FPN_Weights, fasterrcnn_resnet50_fpn
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision.transforms.functional import to_tensor


class YoloFolderDataset(Dataset):
    """Reads images/<split> + labels/<split> (YOLO txt) and converts to torchvision targets."""

    def __init__(self, root, split):
        self.imgs = sorted(glob.glob(os.path.join(root, "images", split, "*")))
        self.lbl_dir = os.path.join(root, "labels", split)

    def __len__(self):
        return len(self.imgs)

    def __getitem__(self, i):
        path = self.imgs[i]
        img = Image.open(path).convert("RGB")
        w, h = img.size
        lbl = os.path.join(self.lbl_dir, os.path.splitext(os.path.basename(path))[0] + ".txt")
        boxes = []
        if os.path.exists(lbl):
            for line in open(lbl).read().strip().splitlines():
                _, xc, yc, bw, bh = map(float, line.split())
                boxes.append([(xc - bw / 2) * w, (yc - bh / 2) * h, (xc + bw / 2) * w, (yc + bh / 2) * h])
        boxes_t = torch.tensor(boxes, dtype=torch.float32).reshape(-1, 4)
        # label 1 = pothole (label 0 is reserved for background in torchvision)
        target = {"boxes": boxes_t, "labels": torch.ones(len(boxes_t), dtype=torch.int64)}
        return to_tensor(img), target


def collate(batch):
    return tuple(zip(*batch))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--epochs", type=int, default=10)
    ap.add_argument("--batch", type=int, default=4)
    args = ap.parse_args()
    device = "cuda" if torch.cuda.is_available() else "cpu"

    model = fasterrcnn_resnet50_fpn(weights=FasterRCNN_ResNet50_FPN_Weights.DEFAULT)
    in_f = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_f, 2)   # background + pothole
    model.to(device)

    loader = DataLoader(YoloFolderDataset(args.data, "train"), batch_size=args.batch,
                        shuffle=True, collate_fn=collate, num_workers=2)
    params = [p for p in model.parameters() if p.requires_grad]
    opt = torch.optim.SGD(params, lr=0.005, momentum=0.9, weight_decay=5e-4)

    for epoch in range(args.epochs):
        model.train()
        running = 0.0
        for imgs, targets in loader:
            imgs = [i.to(device) for i in imgs]
            targets = [{k: v.to(device) for k, v in t.items()} for t in targets]
            loss = sum(model(imgs, targets).values())   # RPN + ROI classification/box losses
            opt.zero_grad()
            loss.backward()
            opt.step()
            running += loss.item()
        print(f"epoch {epoch + 1}: loss {running / len(loader):.4f}")

    os.makedirs("ml_training/runs", exist_ok=True)
    torch.save(model.state_dict(), "ml_training/runs/frcnn.pt")


if __name__ == "__main__":
    main()
