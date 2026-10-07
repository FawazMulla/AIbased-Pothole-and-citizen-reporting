"""
Collect a ~10k-image pothole dataset from public sources and store it locally.

Source: RDD2022 (Road Damage Dataset 2022, figshare doi:10.6084/m9.figshare.21431547).
The 12.6 GB master zip contains one nested zip per country. We download the
country zips one at a time, keep only:
  * every image that has >=1 pothole box (class D40)  -> positives
  * a capped random sample of images with NO pothole  -> hard negatives
convert the VOC xml labels to YOLO txt (class 0 = pothole), delete the country
zip (disk friendly), then split 70/15/15 with a fixed seed and write data.yaml.

Usage:
  python -m ml_training.collect_dataset --out datasets/pothole_5k --target 10000
"""
import argparse
import json
import os
import random
import shutil
import struct
import threading
import time
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

import requests
from remotezip import RemoteZip

MASTER_URL = "https://ndownloader.figshare.com/files/38030910"
# Norway (10.6 GB, almost no potholes) is skipped on purpose.
COUNTRIES = ["India", "Japan", "Czech", "United_States", "China_MotorBike", "China_Drone"]
SEED = 42
IMG_EXT = (".jpg", ".jpeg", ".png")


def _range_get(url, start, end, retries=8):
    for attempt in range(retries):
        try:
            r = requests.get(url, headers={"Range": f"bytes={start}-{end}"}, timeout=60)
            if r.status_code == 206 and len(r.content) == end - start + 1:
                return r.content
        except requests.RequestException:
            pass
        time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"range {start}-{end} failed")


def download_country(country, cache_dir, workers=16, chunk=8 << 20):
    """Download one nested country zip from the master zip using parallel HTTP range
    requests (the server caps each connection at ~0.5 MB/s). Resumable + progress bar."""
    os.makedirs(cache_dir, exist_ok=True)
    dst = os.path.join(cache_dir, f"{country}.zip")
    if os.path.exists(dst) and zipfile.is_zipfile(dst):
        return dst
    with RemoteZip(MASTER_URL) as rz:
        info = rz.getinfo(f"RDD2022/{country}.zip")
        if info.compress_type != zipfile.ZIP_STORED:
            raise RuntimeError("nested zip is compressed in master; expected STORED")
        url = rz.fp.url if hasattr(rz.fp, "url") else MASTER_URL
    # locate the data start: local header (30 bytes) + filename + extra
    hdr = _range_get(MASTER_URL, info.header_offset, info.header_offset + 29)
    nlen, elen = struct.unpack("<HH", hdr[26:30])
    data_start = info.header_offset + 30 + nlen + elen
    size = info.file_size
    part = dst + ".part"
    donefile = dst + ".done"
    done = set(int(x) for x in open(donefile).read().split()) if os.path.exists(donefile) else set()
    if not os.path.exists(part) or os.path.getsize(part) != size:
        with open(part, "wb") as f:
            f.truncate(size)
        done = set()
    n_chunks = (size + chunk - 1) // chunk
    todo = [i for i in range(n_chunks) if i not in done]
    lock = threading.Lock()
    t0, got = time.time(), len(done) * chunk
    print(f"[download] {country}: {size/1e6:.0f} MB, {len(todo)}/{n_chunks} chunks, {workers} connections", flush=True)

    def work(i):
        nonlocal got
        s = i * chunk
        e = min(s + chunk, size) - 1
        data = _range_get(MASTER_URL, data_start + s, data_start + e)
        with lock:
            with open(part, "r+b") as f:
                f.seek(s)
                f.write(data)
            with open(donefile, "a") as d:
                d.write(f"{i}\n")
            got += len(data)
            el = time.time() - t0
            print(f"  {country}: {min(got,size)/size*100:5.1f}%  {min(got,size)/1e6:7.0f}/{size/1e6:.0f} MB  "
                  f"{got/1e6/max(el,1e-6):5.2f} MB/s", flush=True)

    with ThreadPoolExecutor(workers) as ex:
        list(ex.map(work, todo))
    os.replace(part, dst)
    os.remove(donefile)
    if not zipfile.is_zipfile(dst):
        raise RuntimeError(f"{country}.zip corrupt after download")
    return dst


def yolo_lines(xml_bytes):
    root = ET.fromstring(xml_bytes)
    size = root.find("size")
    w, h = int(size.find("width").text), int(size.find("height").text)
    out = []
    for obj in root.findall("object"):
        if obj.find("name").text.strip() != "D40":
            continue
        bb = obj.find("bndbox")
        x1, y1, x2, y2 = (float(bb.find(k).text) for k in ("xmin", "ymin", "xmax", "ymax"))
        if w <= 0 or h <= 0 or x2 <= x1 or y2 <= y1:
            continue
        out.append(f"0 {(x1+x2)/2/w:.6f} {(y1+y2)/2/h:.6f} {(x2-x1)/w:.6f} {(y2-y1)/h:.6f}")
    return out


def process_country(country, cache_dir, raw_dir, neg_cap, rng):
    zpath = download_country(country, cache_dir)
    pos = neg = 0
    with zipfile.ZipFile(zpath) as z:
        names = z.namelist()
        xmls = {os.path.splitext(os.path.basename(n))[0]: n for n in names if n.endswith(".xml")}
        imgs = {os.path.splitext(os.path.basename(n))[0]: n for n in names
                if n.lower().endswith(IMG_EXT) and "/train/" in n.replace("\\", "/")}
        positives, negatives = [], []
        for stem, ipath in imgs.items():
            lines = yolo_lines(z.read(xmls[stem])) if stem in xmls else []
            (positives if lines else negatives).append((stem, ipath, lines))
        rng.shuffle(negatives)
        keep = positives + negatives[:neg_cap]
        for stem, ipath, lines in keep:
            name = f"{country}_{stem}"
            ext = os.path.splitext(ipath)[1].lower()
            with open(os.path.join(raw_dir, "images", name + ext), "wb") as f:
                f.write(z.read(ipath))
            with open(os.path.join(raw_dir, "labels", name + ".txt"), "w") as f:
                f.write("\n".join(lines))
        pos, neg = len(positives), min(len(negatives), neg_cap)
    os.remove(zpath)  # free disk
    print(f"[{country}] positives={pos} negatives_kept={neg}")
    return pos, neg


def split_and_write(raw_dir, out):
    rng = random.Random(SEED)
    files = sorted(os.listdir(os.path.join(raw_dir, "images")))
    rng.shuffle(files)
    n = len(files)
    cuts = {"train": files[: int(.7 * n)], "val": files[int(.7 * n): int(.85 * n)], "test": files[int(.85 * n):]}
    report = {}
    for split, fs in cuts.items():
        os.makedirs(os.path.join(out, "images", split), exist_ok=True)
        os.makedirs(os.path.join(out, "labels", split), exist_ok=True)
        c = Counter()
        for fn in fs:
            stem = os.path.splitext(fn)[0]
            shutil.move(os.path.join(raw_dir, "images", fn), os.path.join(out, "images", split, fn))
            lp = os.path.join(raw_dir, "labels", stem + ".txt")
            shutil.move(lp, os.path.join(out, "labels", split, stem + ".txt"))
            k = sum(1 for l in open(os.path.join(out, "labels", split, stem + ".txt")) if l.strip())
            c["images_with_pothole" if k else "negative_images"] += 1
            c["pothole_boxes"] += k
        c["total_images"] = len(fs)
        report[split] = dict(c)
    with open(os.path.join(out, "data.yaml"), "w") as f:
        f.write(f"path: {os.path.abspath(out)}\ntrain: images/train\nval: images/val\ntest: images/test\n"
                "names:\n  0: pothole\n")
    report["total_images"] = n
    with open(os.path.join(out, "dataset_report.json"), "w") as f:
        json.dump(report, f, indent=2)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="datasets/pothole_5k")
    ap.add_argument("--target", type=int, default=10000)
    ap.add_argument("--countries", nargs="+", default=COUNTRIES)
    args = ap.parse_args()

    cache_dir = os.path.join(os.path.dirname(args.out) or ".", "_cache")
    raw_dir = os.path.join(cache_dir, "raw")
    os.makedirs(os.path.join(raw_dir, "images"), exist_ok=True)
    os.makedirs(os.path.join(raw_dir, "labels"), exist_ok=True)
    rng = random.Random(SEED)

    # Pass 1: all positives from every country; negatives topped up afterwards.
    total_pos, neg_pool = 0, 0
    for c in args.countries:
        p, n = process_country(c, cache_dir, raw_dir, neg_cap=0, rng=rng)  # pothole-only
        total_pos += p
        neg_pool += n
    have = total_pos + neg_pool
    print(f"Collected positives={total_pos}, negatives={neg_pool}, total={have}")

    # Trim negatives down so the total is exactly --target (never drop positives).
    if have > args.target:
        excess = have - args.target
        negs = [f for f in os.listdir(os.path.join(raw_dir, "images"))
                if os.path.getsize(os.path.join(raw_dir, "labels", os.path.splitext(f)[0] + ".txt")) == 0]
        rng.shuffle(negs)
        for f in negs[:excess]:
            os.remove(os.path.join(raw_dir, "images", f))
            os.remove(os.path.join(raw_dir, "labels", os.path.splitext(f)[0] + ".txt"))
    split_and_write(raw_dir, args.out)
    shutil.rmtree(cache_dir, ignore_errors=True)
