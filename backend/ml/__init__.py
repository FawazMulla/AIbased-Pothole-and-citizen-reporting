"""
ml package - the machine-learning pipeline of the platform.

Pipeline (see docs/02_ML_PIPELINE.md):
    1. classifier.py : CNN (MobileNetV3) checks "is this a road photo?"
    2. segmenter.py  : YOLOv8 finds potholes (+ pixel masks if a -seg model is used)
    3. depth.py      : MiDaS CNN estimates how deep each pothole is
    4. severity.py   : combines area + depth into LOW / MEDIUM / HIGH
    5. gradcam.py    : Grad-CAM heat-map showing what the CNN looked at

Every stage is optional: if a weight file is missing the stage is skipped
and the service keeps working with the remaining stages.
"""
