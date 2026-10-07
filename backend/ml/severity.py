"""
Stage 4 - Severity scoring (v2).

v1 (old): bounding-box area ratio + YOLO confidence  -> depends on camera distance
          and confuses "how sure the model is" with "how bad the pothole is".
v2 (now): physical-style score from
              area  : fraction of the photo covered by the pothole mask
              depth : how far the hole sinks below the surrounding road (0..1)
              count : number of potholes in the photo

    score = W_AREA * area_norm + W_DEPTH * depth_norm + W_COUNT * count_norm

If depth is unavailable the weights are re-normalised over area + count.
Thresholds are in one place so they can be re-calibrated on labelled data
(see ml_training/calibrate_severity.py).
"""
from typing import Optional

W_AREA, W_DEPTH, W_COUNT = 0.55, 0.35, 0.10
AREA_SATURATION = 0.15      # potholes covering >=15% of the photo count as "max size"
COUNT_SATURATION = 4        # >=4 potholes count as "max count"
T_MEDIUM, T_HIGH = 0.25, 0.55


def compute_severity(total_area_ratio: float, count: int, depth_score: Optional[float]) -> dict:
    if count == 0:
        return {"severity": "LOW", "score": 0.0}

    area_n = min(1.0, total_area_ratio / AREA_SATURATION)
    count_n = min(1.0, count / COUNT_SATURATION)

    if depth_score is None:
        w_sum = W_AREA + W_COUNT
        score = (W_AREA * area_n + W_COUNT * count_n) / w_sum
    else:
        score = W_AREA * area_n + W_DEPTH * depth_score + W_COUNT * count_n

    label = "HIGH" if score >= T_HIGH else "MEDIUM" if score >= T_MEDIUM else "LOW"
    return {"severity": label, "score": round(float(score), 3)}
