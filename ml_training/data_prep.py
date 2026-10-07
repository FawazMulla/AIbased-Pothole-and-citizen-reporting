"""
Step 1 - Dataset preparation (RDD2022 -> YOLO format + classifier dataset).

RDD2022 (Road Damage Dataset 2022, 47k images, 6 countries) ships Pascal-VOC XML
annotations. Damage classes: D00 longitudinal crack, D10 transverse crack,
D20 alligator crack, D40 POTHOLE. We only keep D40.

What this script does
  1. Walks <rdd_root>/<Country>/train/{images,annotations/xmls}
  2. Converts every D40 box to YOLO txt:  class x_center y_center w h  (all 0..1)
  3. Images with NO D40 box are kept as NEGATIVE samples (empty label file)
     -> teaches the detector that cracks / shadows / clean road are not potholes.
  4. Splits 70 / 15 / 15 (train/val/test) with a FIXED SEED (reproducible).
  5. Writes data.yaml for Ultralytics and a class-distribution report.
  6. Builds the 3-class classifier dataset (road_pothole / road_clean / not_road).

Usage:
  python -m ml_training.data_prep --rdd_root D:/RDD2022 --out datasets/pothole \
        --countries India Japan Czech --not_road_dir D:/random_non_road_images
"""
import argparse
import json
import os
import random
import shutil
import xml.etree.ElementTree as ET
from collections import Counter

SEED = 42
POTHOLE_CLASS = "D40"


def parse_voc(xml_path):
    """Return (width, height, [boxes]) where box=(name, xmin, ymin, xmax, ymax)."""
    root = ET.parse(xml_path).getroot()
    size = root.find("size")
    w, h = int(size.find("width").text), int(size.find("height").text)
    boxes = []
    for obj in root.findall("object"):
        bb = obj.find("bndbox")
        boxes.append((obj.find("name").text.strip(),
                      float(bb.find("xmin").text), float(bb.find("ymin").text),
                      float(bb.find("xmax").text), float(bb.find("ymax").text)))
    return w, h, boxes


def to_yolo_line(w, h, xmin, ymin, xmax, ymax):
    """Pixel corner box -> normalised centre/size box (YOLO format, class 0)."""
    xc, yc = (xmin + xmax) / 2 / w, (ymin + ymax) / 2 / h
    bw, bh = (xmax - xmin) / w, (ymax - ymin) / h
    return f"0 {xc:.6f} {yc:.6f} {bw:.6f} {bh:.6f}"


def collect_samples(rdd_root, countries):
    samples = []   # (image_path, [yolo_lines])
    for country in countries:
        img_dir = os.path.join(rdd_root, country, "train", "images")
        xml_dir = os.path.join(rdd_root, country, "train", "annotations", "xmls")
        if not os.path.isdir(img_dir):
            print(f"[skip] {img_dir} not found")
            continue
        for fn in os.listdir(img_dir):
            stem, ext = os.path.splitext(fn)
            if ext.lower() not in (".jpg", ".jpeg", ".png"):
                continue
            xml_path = os.path.join(xml_dir, stem + ".xml")
            lines = []
            if os.path.exists(xml_path):
                w, h, boxes = parse_voc(xml_path)
                lines = [to_yolo_line(w, h, *b[1:]) for b in boxes if b[0] == POTHOLE_CLASS]
            samples.append((os.path.join(img_dir, fn), lines))
    return samples


def write_split(samples, out):
    random.Random(SEED).shuffle(samples)
    n = len(samples)
    cuts = {"train": samples[: int(.7 * n)],
            "val": samples[int(.7 * n): int(.85 * n)],
            "test": samples[int(.85 * n):]}
    report = {}
    for split, items in cuts.items():
        os.makedirs(os.path.join(out, "images", split), exist_ok=True)
        os.makedirs(os.path.join(out, "labels", split), exist_ok=True)
        c = Counter()
        for src, lines in items:
            name = os.path.basename(src)
            shutil.copy(src, os.path.join(out, "images", split, name))
            with open(os.path.join(out, "labels", split, os.path.splitext(name)[0] + ".txt"), "w") as f:
                f.write("\n".join(lines))
            c["images_with_pothole" if lines else "negative_images"] += 1
            c["pothole_boxes"] += len(lines)
        report[split] = dict(c)
    with open(os.path.join(out, "data.yaml"), "w") as f:
        f.write(f"path: {os.path.abspath(out)}\ntrain: images/train\nval: images/val\ntest: images/test\n"
                "names:\n  0: pothole\n")
    with open(os.path.join(out, "dataset_report.json"), "w") as f:
        json.dump(report, f, indent=2)
    print(json.dumps(report, indent=2))
    return cuts


def build_classifier_dataset(cuts, out_cls, not_road_dir):
    """Folder layout expected by torchvision ImageFolder: <split>/<class>/img.jpg"""
    for split, items in cuts.items():
        for cls in ("road_pothole", "road_clean", "not_road"):
            os.makedirs(os.path.join(out_cls, split, cls), exist_ok=True)
        for src, lines in items:
            cls = "road_pothole" if lines else "road_clean"
            shutil.copy(src, os.path.join(out_cls, split, cls, os.path.basename(src)))
    if not_road_dir and os.path.isdir(not_road_dir):
        files = [f for f in os.listdir(not_road_dir) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
        random.Random(SEED).shuffle(files)
        n = len(files)
        parts = {"train": files[: int(.7 * n)], "val": files[int(.7 * n): int(.85 * n)], "test": files[int(.85 * n):]}
        for split, fs in parts.items():
            for f in fs:
                shutil.copy(os.path.join(not_road_dir, f), os.path.join(out_cls, split, "not_road", f))
    else:
        print("[warn] --not_road_dir missing: add non-road photos to <split>/not_road yourself.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--rdd_root", required=True)
    ap.add_argument("--out", default="datasets/pothole")
    ap.add_argument("--countries", nargs="+", default=["India", "Japan", "Czech"])
    ap.add_argument("--not_road_dir", default=None)
    args = ap.parse_args()

    samples = collect_samples(args.rdd_root, args.countries)
    print(f"Collected {len(samples)} images")
    cuts = write_split(samples, args.out)
    build_classifier_dataset(cuts, args.out + "_cls", args.not_road_dir)
