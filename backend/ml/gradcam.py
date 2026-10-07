"""
Explainability - Grad-CAM for the MobileNetV3 road classifier.

Idea (Selvaraju et al., 2017):
  1. Run the image forward, remember the activations A of the last conv layer.
  2. Back-propagate the score of the target class, get gradients dY/dA.
  3. Average the gradients over each channel -> one weight per channel.
  4. Heat-map = ReLU( sum_k weight_k * A_k ), resized to the image size.
Bright regions = pixels that pushed the CNN towards its decision.
"""
import cv2
import numpy as np
import torch


def grad_cam(classifier, img_rgb: np.ndarray, target_idx: int) -> np.ndarray:
    """
    Returns an RGB image with the heat-map blended over the original photo.
    `classifier` is a ml.classifier.RoadClassifier (must be available).
    """
    model = classifier.model
    target_layer = model.features[-1]          # last convolution block
    store = {}

    fwd = target_layer.register_forward_hook(lambda m, i, o: store.__setitem__("act", o))
    bwd = target_layer.register_full_backward_hook(lambda m, gi, go: store.__setitem__("grad", go[0]))
    try:
        x = classifier.preprocess(img_rgb).requires_grad_(True)
        with torch.enable_grad():
            model.zero_grad()
            score = model(x)[0, target_idx]
            score.backward()
        act, grad = store["act"][0], store["grad"][0]       # (C,h,w)
        weights = grad.mean(dim=(1, 2))                      # (C,)
        cam = torch.relu((weights[:, None, None] * act).sum(0)).detach().cpu().numpy()
    finally:
        fwd.remove()
        bwd.remove()

    cam = cam / (cam.max() + 1e-8)
    h, w = img_rgb.shape[:2]
    cam = cv2.resize(cam, (w, h))
    heat = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
    heat = cv2.cvtColor(heat, cv2.COLOR_BGR2RGB)
    return cv2.addWeighted(img_rgb, 0.55, heat, 0.45, 0)
