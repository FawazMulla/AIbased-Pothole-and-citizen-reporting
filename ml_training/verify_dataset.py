"""
Sanity check for a YOLO pothole dataset produced by collect_dataset.py.

Verifies per split: image/label pairing, every image has >=1 pothole box (pothole-only),
box values within 0..1, images decode, no duplicate files across splits.

Usage: python -m ml_training.verify_dataset --root datasets/pothole_5k
"""
import argparse
import os

from PIL import Image


def main(root):
    seen, total, problems = {}, 0, []
    for split in ("train", "val", "test"):
        idir, ldir = (os.path.join(root, "images", split), os.path.join(root, "labels", split))
        imgs = sorted(os.listdir(idir))
        boxes = 0
        for fn in imgs:
            stem = os.path.splitext(fn)[0]
            if fn in seen:
                problems.append(f"duplicate across splits: {fn}")
            seen[fn] = split
            lp = os.path.join(ldir, stem + ".txt")
            if not os.path.exists(lp):
                problems.append(f"missing label: {split}/{fn}")
                continue
            rows = [l.split() for l in open(lp) if l.strip()]
            if not rows:
                problems.append(f"empty label (no pothole): {split}/{fn}")
            for r in rows:
                v = list(map(float, r[1:5]))
                if r[0] != "0" or len(r) != 5 or not all(0 <= x <= 1 for x in v):
                    problems.append(f"bad box {r}: {split}/{fn}")
            boxes += len(rows)
            try:
                with Image.open(os.path.join(idir, fn)) as im:
                    im.verify()
            except Exception as e:
                problems.append(f"corrupt image {split}/{fn}: {e}")
        print(f"{split:5s} images={len(imgs):6d} boxes={boxes:6d}")
        total += len(imgs)
    print(f"TOTAL images = {total}")
    print("PASS: no problems" if not problems else f"FAIL: {len(problems)} problems")
    for p in problems[:20]:
        print("  -", p)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="datasets/pothole_5k")
    main(ap.parse_args().root)
