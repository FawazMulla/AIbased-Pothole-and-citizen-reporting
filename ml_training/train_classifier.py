"""
Step 2a - Train the CNN road classifier (transfer learning, MobileNetV3-Small).

Transfer learning in 2 phases:
  Phase A (epochs 1..warmup): backbone frozen, only the new final layer learns.
  Phase B (rest)            : whole network fine-tuned with a 10x smaller LR.

Loss: Cross-Entropy. Optimiser: AdamW. Scheduler: Cosine annealing.
Augmentation: random crop, flip, colour jitter (lighting changes), small rotation.
Outputs: backend/weights/road_classifier.pt + ml_training/runs/classifier_metrics.json
         (accuracy, per-class precision/recall/F1, confusion matrix on the TEST split).

Usage:
  python -m ml_training.train_classifier --data datasets/pothole_cls --epochs 15
"""
import argparse
import json
import os

import torch
import torch.nn as nn
from sklearn.metrics import classification_report, confusion_matrix
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

from backend.ml.classifier import CLASS_NAMES, IMAGENET_MEAN, IMAGENET_STD, build_model

train_tf = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.6, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])
eval_tf = transforms.Compose([
    transforms.Resize((224, 224)), transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])


def run_epoch(model, loader, device, criterion, optimizer=None):
    train = optimizer is not None
    model.train(train)
    total_loss, correct, n = 0.0, 0, 0
    with torch.set_grad_enabled(train):
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            out = model(x)
            loss = criterion(out, y)
            if train:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
            total_loss += loss.item() * len(y)
            correct += (out.argmax(1) == y).sum().item()
            n += len(y)
    return total_loss / n, correct / n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--epochs", type=int, default=15)
    ap.add_argument("--warmup", type=int, default=3)
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--lr", type=float, default=1e-3)
    args = ap.parse_args()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    ds = {s: datasets.ImageFolder(os.path.join(args.data, s), train_tf if s == "train" else eval_tf)
          for s in ("train", "val", "test")}
    # ImageFolder classes are sorted alphabetically; remap indices if needed
    remap = {ds["train"].class_to_idx[c]: i for i, c in enumerate(CLASS_NAMES)}
    class RemapTransform:
        def __init__(self, m):
            self.m = m
        def __call__(self, t):
            return self.m[t]
    for d in ds.values():
        d.target_transform = RemapTransform(remap)
    loaders = {s: DataLoader(d, batch_size=args.batch, shuffle=(s == "train"), num_workers=0) for s, d in ds.items()}

    model = build_model(pretrained=True).to(device)
    criterion = nn.CrossEntropyLoss()
    best_val, history = 0.0, []
    out_path = os.path.join("backend", "weights", "road_classifier.pt")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    for epoch in range(args.epochs):
        if epoch == 0:                                   # Phase A: freeze backbone
            for p in model.features.parameters():
                p.requires_grad = False
            opt = torch.optim.AdamW(model.classifier.parameters(), lr=args.lr)
        if epoch == args.warmup:                         # Phase B: unfreeze, lower LR
            for p in model.features.parameters():
                p.requires_grad = True
            opt = torch.optim.AdamW(model.parameters(), lr=args.lr / 10)
            sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=args.epochs - args.warmup)
        tl, ta = run_epoch(model, loaders["train"], device, criterion, opt)
        vl, va = run_epoch(model, loaders["val"], device, criterion)
        if epoch >= args.warmup:
            sched.step()
        history.append(dict(epoch=epoch + 1, train_loss=tl, train_acc=ta, val_loss=vl, val_acc=va))
        print(f"epoch {epoch + 1:02d} | train {tl:.3f}/{ta:.3f} | val {vl:.3f}/{va:.3f}")
        if va > best_val:                                # keep best checkpoint by validation accuracy
            best_val = va
            torch.save(model.state_dict(), out_path)

    # ---- final evaluation on the untouched TEST split with the best weights
    model.load_state_dict(torch.load(out_path, map_location=device))
    model.eval()
    ys, ps = [], []
    with torch.no_grad():
        for x, y in loaders["test"]:
            ps += model(x.to(device)).argmax(1).cpu().tolist()
            ys += y.tolist()
    report = classification_report(ys, ps, target_names=CLASS_NAMES, output_dict=True)
    os.makedirs("ml_training/runs", exist_ok=True)
    with open("ml_training/runs/classifier_metrics.json", "w") as f:
        json.dump({"history": history, "test_report": report,
                   "confusion_matrix": confusion_matrix(ys, ps).tolist()}, f, indent=2)
    print(classification_report(ys, ps, target_names=CLASS_NAMES))


if __name__ == "__main__":
    main()
