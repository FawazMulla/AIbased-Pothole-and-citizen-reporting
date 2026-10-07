"""
Stage 3 - Monocular depth estimation with MiDaS-small (a CNN/transformer-free
encoder-decoder from Intel ISL, loaded through torch.hub).

Why depth?
  A bounding-box area depends on how far the camera is. A shallow but wide
  pothole near the camera looks "bigger" than a deep crater far away.
  Depth lets us measure how much the pothole region sinks BELOW the
  surrounding road surface.

MiDaS outputs *inverse relative depth* (bigger value = closer to camera).
A pothole is a hole, so inside the mask the value is LOWER than the ring of
road around it. We measure that difference.

Enabled only when env ENABLE_DEPTH=1 (first run downloads ~80 MB).
"""
import os
from typing import Optional

import cv2
import numpy as np
import torch


class DepthEstimator:
    def __init__(self, device: str = "cpu"):
        self.device = device
        self.model = None
        self.transform = None
        if os.getenv("ENABLE_DEPTH", "0") != "1":
            print("[Depth] Disabled (set ENABLE_DEPTH=1 to enable MiDaS).")
            return
        try:
            self.model = torch.hub.load("intel-isl/MiDaS", "MiDaS_small", trust_repo=True)
            self.model.to(device).eval()
            transforms = torch.hub.load("intel-isl/MiDaS", "transforms", trust_repo=True)
            self.transform = transforms.small_transform
            print("[Depth] MiDaS-small loaded.")
        except Exception as e:  # no internet, hub error ...
            print(f"[Depth] Could not load MiDaS ({e}); depth stage disabled.")
            self.model = None

    @property
    def is_available(self) -> bool:
        return self.model is not None

    @torch.no_grad()
    def depth_map(self, img_rgb: np.ndarray) -> np.ndarray:
        """Inverse relative depth map, same size as the image (float32)."""
        batch = self.transform(img_rgb).to(self.device)
        pred = self.model(batch)
        pred = torch.nn.functional.interpolate(
            pred.unsqueeze(1), size=img_rgb.shape[:2], mode="bicubic", align_corners=False
        ).squeeze()
        return pred.cpu().numpy().astype(np.float32)

    @staticmethod
    def pothole_depth_score(depth: np.ndarray, mask: np.ndarray) -> Optional[float]:
        """
        mask: bool array (H,W), True inside the pothole.
        Returns 0..1 where 1 = very deep depression relative to the road around it.
        """
        if mask.sum() < 50:
            return None
        # Ring = dilated mask minus mask  -> road surface right around the hole.
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))
        dil = cv2.dilate(mask.astype(np.uint8), k).astype(bool)
        ring = dil & ~mask
        if ring.sum() < 50:
            return None
        inside = float(np.median(depth[mask]))
        around = float(np.median(depth[ring]))
        spread = float(depth.max() - depth.min()) + 1e-6   # normalise per image
        # (around - inside) > 0 means the hole is farther than its surroundings.
        score = (around - inside) / spread * 4.0            # x4: empirical gain
        return float(np.clip(score, 0.0, 1.0))
