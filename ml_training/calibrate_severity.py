"""
Step 4 - Calibrate the severity thresholds against human labels.

Input CSV (you label ~100 test images LOW/MEDIUM/HIGH by hand, e.g. with a
road engineer or by IRC pothole-size guidelines):
    image,label
    img001.jpg,HIGH
    ...
The script runs the full pipeline on each image, grid-searches (T_MEDIUM, T_HIGH)
and reports the pair with the best agreement + a confusion matrix, so the
thresholds in ml/severity.py are DATA-DRIVEN and defensible.

Usage:
  python -m ml_training.calibrate_severity --images datasets/pothole/images/test --labels labels.csv
"""
import argparse
import csv
import itertools
import os

import numpy as np
from sklearn.metrics import accuracy_score, confusion_matrix

from backend.ai_service import ai_service

ORDER = ["LOW", "MEDIUM", "HIGH"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", required=True)
    ap.add_argument("--labels", required=True)
    args = ap.parse_args()

    scores, truth = [], []
    for row in csv.DictReader(open(args.labels)):
        with open(os.path.join(args.images, row["image"]), "rb") as f:
            res = ai_service.detect(f.read())
        scores.append(res.get("severity_score") or 0.0)
        truth.append(ORDER.index(row["label"].upper()))
    scores, truth = np.array(scores), np.array(truth)

    best = (0, None)
    for t_med, t_high in itertools.product(np.arange(0.05, 0.6, 0.025), np.arange(0.2, 0.95, 0.025)):
        if t_high <= t_med:
            continue
        pred = np.where(scores >= t_high, 2, np.where(scores >= t_med, 1, 0))
        acc = accuracy_score(truth, pred)
        if acc > best[0]:
            best = (acc, (round(float(t_med), 3), round(float(t_high), 3)))
    t_med, t_high = best[1]
    pred = np.where(scores >= t_high, 2, np.where(scores >= t_med, 1, 0))
    print(f"Best T_MEDIUM={t_med}, T_HIGH={t_high}, accuracy={best[0]:.3f}")
    print(confusion_matrix(truth, pred))
    print("-> put these values in backend/ml/severity.py")


if __name__ == "__main__":
    main()
