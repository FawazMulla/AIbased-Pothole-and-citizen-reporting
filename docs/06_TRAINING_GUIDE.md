# 06 – Training Guide (run these to get real numbers)

Use a GPU (Google Colab / Kaggle free tier is enough). From the repo root:

```bash
pip install -r ml_training/requirements.txt
```

## Quick Start: Train on 10,000+ Images (Google Colab / Kaggle GPU)
If you want to train on **10,000+ images**, do NOT train on your laptop CPU (which takes 25–40 hours). Instead, use the ready-to-run Jupyter notebook:
👉 **[`ml_training/train_pothole_5k_colab.ipynb`](../ml_training/train_pothole_5k_colab.ipynb)**

1. Upload `train_pothole_5k_colab.ipynb` to [Google Colab](https://colab.research.google.com).
2. Set Runtime to **T4 GPU** (free tier).
3. Click **Runtime -> Run all**.
   - Downloads the 13,767-image Pothole Detection dataset in YOLOv8 format.
   - Fine-tunes YOLOv8s with mosaic and HSV augmentation for 50 epochs (~35 minutes).
   - Computes mAP, precision, recall, and displays confusion matrix and PR curves.
   - Automatically downloads your trained `best.pt`.
4. Copy the downloaded `best.pt` to `backend/weights/pothole_det.pt`.

## 1. Get data
1. Download **RDD2022** (https://github.com/sekilab/RoadDamageDetector) – India, Japan, Czech folders.
2. Collect ~1–2k non-road photos (e.g. COCO val2017 indoor/people images) into one folder.
3. (For segmentation) export a Roboflow *pothole segmentation* dataset in "YOLOv8" format.

## 2. Prepare
```bash
python -m ml_training.data_prep --rdd_root D:/RDD2022 --out datasets/pothole \
       --countries India Japan Czech --not_road_dir D:/non_road
```
Creates `datasets/pothole` (YOLO) + `datasets/pothole_cls` (classifier) + `dataset_report.json` (class counts per split → put in report).

## 3. Train
```bash
python -m ml_training.train_classifier --data datasets/pothole_cls --epochs 15
python -m ml_training.train_yolo --data datasets/pothole/data.yaml --task detect
python -m ml_training.train_yolo --data <roboflow_seg>/data.yaml --task seg
python -m ml_training.train_frcnn --data datasets/pothole --epochs 10
```
Outputs go to `backend/weights/` (`road_classifier.pt`, `pothole_det.pt`, `pothole_seg.pt`). Training curves/confusion matrices: `ml_training/runs/*`.

## 4. Benchmark
```bash
python -m ml_training.benchmark --data datasets/pothole \
   --yolo backend/weights/pothole_det.pt --yolo_seg backend/weights/pothole_seg.pt \
   --frcnn ml_training/runs/frcnn.pt
```
Copy the printed Markdown table into doc 02 and your slides.

## 5. Calibrate severity (optional but impressive)
Hand-label ~100 test images (`labels.csv`: `image,label`) then:
```bash
python -m ml_training.calibrate_severity --images datasets/pothole/images/test --labels labels.csv
```
Paste the printed thresholds into `backend/ml/severity.py`.

## 6. Run the app
```bash
set ENABLE_DEPTH=1        # optional, enables MiDaS (downloads ~80MB first time)
uvicorn backend.main:app --reload
```
`/health` reports readiness; `/docs` shows the API.

## Suggested ablations (strong viva material)
1. With vs without negative images → false-positive rate on shadows.
2. With vs without augmentation → mAP.
3. Detect vs seg → area accuracy.
4. Severity v1 (box area) vs v2 (mask + depth) vs human labels → agreement.
