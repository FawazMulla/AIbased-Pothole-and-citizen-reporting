"""
Stage 1 - CNN road-image classifier (transfer learning on MobileNetV3-Small).

Why a classifier before YOLO?
  Citizens upload selfies, screenshots, indoor photos... Running the detector
  on those wastes compute and can create fake complaints. A tiny CNN gives a
  cheap "is this a road?" gate.

Classes (index order matters, it is the same order used in training):
    0 = not_road      (random / irrelevant photo)
    1 = road_clean    (road without pothole)
    2 = road_pothole  (road with pothole)

Weights are produced by ml_training/train_classifier.py and stored in
backend/weights/road_classifier.pt. If the file is absent the classifier is
disabled (is_available == False) and the pipeline skips this stage.
"""
import os
from typing import Dict, Optional

import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms

CLASS_NAMES = ["not_road", "road_clean", "road_pothole"]

# Standard ImageNet normalisation - MobileNet was pre-trained with these values.
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

PREPROCESS = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])


def build_model(num_classes: int = len(CLASS_NAMES), pretrained: bool = False) -> nn.Module:
    """
    MobileNetV3-Small backbone + new final linear layer.
    Used both for training (pretrained=True) and inference (pretrained=False,
    then trained weights are loaded on top).
    """
    weights = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
    model = models.mobilenet_v3_small(weights=weights)
    in_features = model.classifier[-1].in_features
    model.classifier[-1] = nn.Linear(in_features, num_classes)
    return model


class RoadClassifier:
    def __init__(self, weights_path: str, device: str = "cpu"):
        self.device = device
        self.model: Optional[nn.Module] = None
        self.weights_path = weights_path
        if os.path.exists(weights_path):
            model = build_model(pretrained=False)
            model.load_state_dict(torch.load(weights_path, map_location=device))
            self.model = model.to(device).eval()
            print(f"[Classifier] Loaded road classifier from {weights_path}")
        else:
            print(f"[Classifier] {weights_path} not found - road-gate stage disabled.")

    @property
    def is_available(self) -> bool:
        return self.model is not None

    def preprocess(self, img_rgb: np.ndarray) -> torch.Tensor:
        """RGB uint8 image (H,W,3) -> normalised tensor (1,3,224,224)."""
        return PREPROCESS(img_rgb).unsqueeze(0).to(self.device)

    @torch.no_grad()
    def predict(self, img_rgb: np.ndarray) -> Dict:
        """Returns the winning label and the probability of every class."""
        logits = self.model(self.preprocess(img_rgb))
        probs = torch.softmax(logits, dim=1)[0].cpu().numpy()
        idx = int(probs.argmax())
        return {
            "label": CLASS_NAMES[idx],
            "confidence": round(float(probs[idx]), 3),
            "probabilities": {n: round(float(p), 3) for n, p in zip(CLASS_NAMES, probs)},
        }
