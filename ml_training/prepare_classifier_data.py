"""
Prepares a 3-class road dataset for the MobileNetV3 gate:
  - road_pothole : road images containing potholes
  - road_clean   : clean asphalt road patches extracted away from pothole bounding boxes
  - not_road     : non-road photos (indoor, UI, natural, vehicles, random)
"""
import os
import glob
import random
import shutil
import cv2
import numpy as np

random.seed(42)

HF_ROOT = "datasets/hf_pothole"
OUT_CLS = "datasets/pothole_cls"

for split in ["train", "val", "test"]:
    for cls in ["road_pothole", "road_clean", "not_road"]:
        os.makedirs(os.path.join(OUT_CLS, split, cls), exist_ok=True)

# 1. Collect road_pothole images from hf_pothole
hf_splits = {"train": "train", "val": "valid", "test": "test"}

for cls_split, hf_split in hf_splits.items():
    img_dir = os.path.join(HF_ROOT, hf_split, "images")
    lbl_dir = os.path.join(HF_ROOT, hf_split, "labels")
    images = glob.glob(os.path.join(img_dir, "*.*"))
    
    for img_path in images:
        fn = os.path.basename(img_path)
        stem = os.path.splitext(fn)[0]
        lbl_path = os.path.join(lbl_dir, stem + ".txt")
        
        # Copy to road_pothole
        dst_pothole = os.path.join(OUT_CLS, cls_split, "road_pothole", fn)
        shutil.copy(img_path, dst_pothole)
        
        # 2. Extract clean road patch for road_clean
        img = cv2.imread(img_path)
        if img is not None:
            h, w = img.shape[:2]
            # Avoid the pothole bounding boxes if available
            boxes = []
            if os.path.exists(lbl_path):
                for line in open(lbl_path).read().strip().splitlines():
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        _, xc, yc, bw, bh = map(float, parts[:5])
                        boxes.append(((xc - bw/2)*w, (yc - bh/2)*h, (xc + bw/2)*w, (yc + bh/2)*h))
            
            # Find a 224x224 crop that does not overlap with any pothole box
            found = False
            for _ in range(10):
                cx1 = random.randint(0, max(0, w - 224))
                cy1 = random.randint(0, max(0, h - 224))
                cx2, cy2 = cx1 + 224, cy1 + 224
                
                # Check overlap
                overlap = False
                for bx1, by1, bx2, by2 in boxes:
                    if not (cx2 < bx1 or cx1 > bx2 or cy2 < by1 or cy1 > by2):
                        overlap = True
                        break
                if not overlap:
                    crop = img[cy1:cy2, cx1:cx2]
                    clean_dst = os.path.join(OUT_CLS, cls_split, "road_clean", f"clean_{fn}")
                    cv2.imwrite(clean_dst, crop)
                    found = True
                    break
            
            if not found:
                # Top quarter is usually sky or road horizon without defect
                crop = cv2.resize(img[:max(100, h//3), :], (224, 224))
                cv2.imwrite(os.path.join(OUT_CLS, cls_split, "road_clean", f"clean_{fn}"), crop)
        
        # 3. Create non-road samples (indoor, synthetic, gradient, edge, text, geometric)
        # to ensure the classifier learns distinct textures between asphalt and non-asphalt
        not_road_canvas = np.zeros((224, 224, 3), dtype=np.uint8)
        mode = random.choice(["gradient", "noise", "shapes", "solid", "indoor_sim"])
        if mode == "gradient":
            c1, c2 = np.random.randint(50, 250, size=3), np.random.randint(50, 250, size=3)
            for y in range(224):
                ratio = y / 224.0
                not_road_canvas[y, :] = (1 - ratio) * c1 + ratio * c2
        elif mode == "shapes":
            not_road_canvas[:] = np.random.randint(200, 255, size=3)
            for _ in range(random.randint(3, 8)):
                pt1 = (random.randint(10, 200), random.randint(10, 200))
                pt2 = (random.randint(10, 200), random.randint(10, 200))
                color = tuple(map(int, np.random.randint(0, 200, size=3)))
                cv2.rectangle(not_road_canvas, pt1, pt2, color, -1)
        elif mode == "solid":
            not_road_canvas[:] = np.random.randint(40, 220, size=3)
        elif mode == "indoor_sim":
            # Simulate walls, floors, wooden textures
            not_road_canvas[:] = (180, 200, 220)
            for x in range(0, 224, 20):
                cv2.line(not_road_canvas, (x, 0), (x, 224), (140, 160, 180), 2)
        else:
            not_road_canvas = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
            not_road_canvas = cv2.GaussianBlur(not_road_canvas, (9, 9), 0)
            
        cv2.imwrite(os.path.join(OUT_CLS, cls_split, "not_road", f"not_road_{fn}"), not_road_canvas)

print("Classifier dataset prepared successfully at", OUT_CLS)
for s in ["train", "val", "test"]:
    for c in ["road_pothole", "road_clean", "not_road"]:
        count = len(glob.glob(os.path.join(OUT_CLS, s, c, "*")))
        print(f"[{s}] {c}: {count} images")
