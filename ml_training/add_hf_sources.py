"""
Merge extra human-labelled pothole datasets (Hugging Face / Roboflow exports) into the
local YOLO dataset built by collect_dataset.py.

Sources (all pothole-only, bbox or polygon labels converted to YOLO class 0):
  Ryukijano/Pothole-detection-Yolov8   (YOLO txt)      CC BY 4.0
  rupesh002/pothole-detection-dataset  (YOLO txt)      MIT
  manot/pothole-segmentation           (COCO polygons -> bbox)
  manot/pothole-segmentation2          (COCO polygons -> bbox)
  keremberke/pothole-segmentation      (COCO polygons -> bbox)

Safety:
  * each source's own split is respected (train->train, valid->val, test->test)
  * perceptual-hash (dHash) de-duplication against EVERYTHING already in the dataset,
    so an image can't appear twice / leak between splits
  * images without a valid box are dropped (pothole-only)

Usage: python -m ml_training.add_hf_sources --root datasets/pothole_5k --hf datasets/_hf
"""
import argparse
import glob
import io
import json
import os
import zipfile
from collections import Counter

import numpy as np
from PIL import Image

POP = np.array([bin(i).count("1") for i in range(256)], dtype=np.uint8)
HAMMING_DUP = 6   # <= this many differing bits (of 64) => treated as duplicate


def dhash(im):
    g = im.convert("L").resize((9, 8), Image.BILINEAR)
    a = np.asarray(g, dtype=np.int16)
    bits = (a[:, 1:] > a[:, :-1]).flatten()
    return int(np.packbits(bits).view(">u8")[0])


class Dedup:
    def __init__(self):
        self.h = np.zeros(0, dtype=np.uint64)

    def add_existing(self, h):
        self.h = np.append(self.h, np.uint64(h))

    def is_dup(self, h):
        if len(self.h) == 0:
            return False
        x = (self.h ^ np.uint64(h)).view(np.uint8).reshape(-1, 8)
        return bool((POP[x].sum(axis=1) <= HAMMING_DUP).any())


def yolo_from_xywh_px(x, y, w, h, W, H):
    x1, y1, x2, y2 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x2 - x1 < 2 or y2 - y1 < 2:
        return None
    return f"0 {(x1+x2)/2/W:.6f} {(y1+y2)/2/H:.6f} {(x2-x1)/W:.6f} {(y2-y1)/H:.6f}"


def valid_yolo(lines):
    out = []
    for l in lines:
        p = l.split()
        if len(p) >= 5:
            try:
                x, y, w, h = map(float, p[1:5])
            except ValueError:
                continue
            if 0 <= x <= 1 and 0 <= y <= 1 and 0 < w <= 1 and 0 < h <= 1:
                out.append(f"0 {x:.6f} {y:.6f} {w:.6f} {h:.6f}")
    return out


def iter_ryukijano(hf):
    root = os.path.join(hf, "Ryukijano__Pothole-detection-Yolov8")
    for src, split in (("train", "train"), ("valid", "val"), ("test", "test")):
        for ip in sorted(glob.glob(os.path.join(root, src, "images", "*.jpg"))):
            lp = os.path.join(root, src, "labels", os.path.splitext(os.path.basename(ip))[0] + ".txt")
            if os.path.exists(lp):
                yield "ryu", split, os.path.basename(ip), open(ip, "rb").read(), valid_yolo(open(lp).read().splitlines())


def iter_rupesh(hf):
    z = zipfile.ZipFile(os.path.join(hf, "rupesh002__pothole-detection-dataset", "pothole_dataset.zip"))
    for n in sorted(z.namelist()):
        if n.endswith(".jpg"):
            split = "train" if "/train/" in n else "val" if "/valid/" in n else None
            if split is None:
                continue
            ln = n.replace("/images/", "/labels/")[:-4] + ".txt"
            if ln in z.namelist():
                yield "rup", split, os.path.basename(n), z.read(n), valid_yolo(z.read(ln).decode().splitlines())


def iter_coco(hf, repo, tag):
    for zname, split in (("train", "train"), ("valid", "val"), ("test", "test")):
        zp = os.path.join(hf, repo, "data", zname + ".zip")
        if not os.path.exists(zp):
            continue
        z = zipfile.ZipFile(zp)
        j = json.loads(z.read([n for n in z.namelist() if n.endswith(".json")][0]))
        cats = {c["id"]: c["name"] for c in j["categories"]}
        by_img = {}
        for a in j["annotations"]:
            if cats.get(a["category_id"]) == "object":      # manot v1 has a generic 'object' class
                continue
            by_img.setdefault(a["image_id"], []).append(a)
        for im in j["images"]:
            fn = im["file_name"]
            if fn not in z.namelist():
                continue
            W, H = im["width"], im["height"]
            lines = [yolo_from_xywh_px(*a["bbox"], W, H) for a in by_img.get(im["id"], [])]
            yield tag, split, os.path.basename(fn), z.read(fn), [l for l in lines if l]


def main(root, hf):
    dd = Dedup()
    n_exist = 0
    for split in ("train", "val", "test"):
        for p in glob.glob(os.path.join(root, "images", split, "*")):
            with Image.open(p) as im:
                dd.add_existing(dhash(im))
            n_exist += 1
    print(f"Indexed {n_exist} existing images for de-duplication")

    stats = {}
    sources = [iter_ryukijano(hf), iter_rupesh(hf),
               iter_coco(hf, "manot__pothole-segmentation", "manot1"),
               iter_coco(hf, "manot__pothole-segmentation2", "manot2"),
               iter_coco(hf, "keremberke__pothole-segmentation", "kerem")]
    for it in sources:
        for tag, split, fn, data, lines in it:
            st = stats.setdefault(tag, Counter())
            st["seen"] += 1
            if not lines:
                st["dropped_no_box"] += 1
                continue
            try:
                im = Image.open(io.BytesIO(data))
                im.load()
                im = im.convert("RGB")
            except Exception:
                st["dropped_corrupt"] += 1
                continue
            h = dhash(im)
            if dd.is_dup(h):
                st["dropped_duplicate"] += 1
                continue
            dd.add_existing(h)
            stem = f"{tag}_{os.path.splitext(fn)[0]}"[:120]
            im.save(os.path.join(root, "images", split, stem + ".jpg"), quality=95)
            with open(os.path.join(root, "labels", split, stem + ".txt"), "w") as f:
                f.write("\n".join(lines))
            st["added_" + split] += 1
            st["added"] += 1
            st["boxes"] += len(lines)
    for tag, st in stats.items():
        print(tag, dict(st))

    report = {"total_images": 0}
    for split in ("train", "val", "test"):
        n = len(os.listdir(os.path.join(root, "images", split)))
        boxes = sum(sum(1 for l in open(p) if l.strip()) for p in glob.glob(os.path.join(root, "labels", split, "*.txt")))
        report[split] = {"images_with_pothole": n, "pothole_boxes": boxes, "total_images": n}
        report["total_images"] += n
    report["added_from_hf"] = {k: dict(v) for k, v in stats.items()}
    with open(os.path.join(root, "dataset_report.json"), "w") as f:
        json.dump(report, f, indent=2)
    print(json.dumps({k: v for k, v in report.items() if k != "added_from_hf"}, indent=2))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="datasets/pothole_5k")
    ap.add_argument("--hf", default="datasets/_hf")
    a = ap.parse_args()
    main(a.root, a.hf)
