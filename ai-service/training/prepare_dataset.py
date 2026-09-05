"""
E-Gowshala — Dataset Preparation Script
Organizes all downloaded cattle disease images into structured train/val/test splits.
Run AFTER all downloads are complete.
"""
import os, sys, shutil, random, json
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
    sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)

RAW   = Path(r"c:\Users\rahul\OneDrive\Desktop\E-Gowshala\ai-service\training\datasets\raw")
OUT   = Path(r"c:\Users\rahul\OneDrive\Desktop\E-Gowshala\ai-service\training\datasets\structured")
TRAIN_RATIO = 0.70
VAL_RATIO   = 0.20
# remaining 0.10 goes to test
MAX_PER_CLASS = 900   # cap to keep classes balanced

# ── Exact verified source paths for each class ─────────────────────────────
BEHAVIOR_IMGS = RAW / "cattle_behavior" / "Dataset_behavior-desease_HD-LGBT_HUTECH" / "behavior" / "dataset1_od"
DISEASE_JILSA = RAW / "cattle_behavior" / "Dataset_behavior-desease_HD-LGBT_HUTECH" / "desease" / "dataset1_jilsa" / "jilsa" / "class" / "data_tho" / "Desease_Cattle_1-Jilsa-_Class.folder"

CLASS_SOURCES = {
    "healthy": [
        RAW / "lsd_warcoder"   / "Lumpy Skin Images Dataset" / "Normal Skin",
        RAW / "lsd_shivam"     / "healthycows",
        RAW / "cattle_maganti" / "Normal Skin" / "Normal Skin",
        RAW / "cowhealth_6k"   / "Cows datasets" / "Healthycows 1",
        RAW / "cowhealth_6k"   / "Cows datasets" / "Healthycows 2",
        RAW / "cowhealth_6k"   / "Cows datasets" / "Mastitis" / "normal teats",
        BEHAVIOR_IMGS / "train" / "images",   # behavioral footage = normal cows
        BEHAVIOR_IMGS / "valid" / "images",
    ],
    "lumpy_skin_disease": [
        RAW / "lsd_warcoder"   / "Lumpy Skin Images Dataset" / "Lumpy Skin",
        RAW / "lsd_shivam"     / "lumpycows",
        RAW / "cattle_maganti" / "Lumpy Skin" / "Lumpy Skin",
        RAW / "cowhealth_6k"   / "Cows datasets" / "Lumpycows-1",
        RAW / "cowhealth_6k"   / "Cows datasets" / "Lumpycows-2",
    ],
    "foot_mouth_disease": [
        RAW / "fmd_wasim"           / "train",
        RAW / "fmd_wasim"           / "valid",
        RAW / "fmd_extended"        / "train",
        RAW / "fmd_extended"        / "valid",
        RAW / "cattle_multi_devang" / "Cows datasets" / "foot-and-mouth",
        RAW / "cattle_maganti"      / "Foot and Mouth disease" / "Foot and Mouth disease",
        RAW / "cowhealth_6k"        / "Cows datasets" / "Foot-and-mouth",
    ],
    "mastitis": [
        RAW / "cowhealth_6k" / "Cows datasets" / "Mastitis" / "mastitis",
    ],
    "skin_disease": [
        DISEASE_JILSA / "Mun coc",   # Warts (bovine papillomatosis)
        DISEASE_JILSA / "Nam da",    # Skin fungus / ringworm (dermatophytosis)
    ],
}

# ── Placeholder classes from cattle_behavior dataset (if downloaded) ───────
BEHAVIOR_BASE = RAW / "cattle_behavior"
# These will be auto-discovered if cattle_behavior was downloaded
EXTRA_CLASSES = ["lameness", "eye_disease", "skin_disease", "respiratory_disease"]

def collect_images(source_dirs: list[Path], label: str) -> list[Path]:
    """Collect all valid images from source directories."""
    imgs = []
    for src in source_dirs:
        if src.exists():
            for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"]:
                imgs.extend(list(src.glob(ext)))
    imgs = list(set(imgs))
    print(f"  [{label}] Found {len(imgs)} raw images")
    return imgs

def split_and_copy(imgs: list[Path], cls_name: str, max_count: int = MAX_PER_CLASS):
    """Split images 70/20/10 and copy to structured folders."""
    from PIL import Image
    random.seed(42)
    random.shuffle(imgs)
    imgs = imgs[:max_count]

    n = len(imgs)
    n_train = int(n * TRAIN_RATIO)
    n_val   = int(n * VAL_RATIO)

    splits = {
        "train": imgs[:n_train],
        "val":   imgs[n_train:n_train + n_val],
        "test":  imgs[n_train + n_val:],
    }

    counts = {}
    for split, split_imgs in splits.items():
        dest = OUT / split / cls_name
        dest.mkdir(parents=True, exist_ok=True)
        ok = 0
        for i, img in enumerate(split_imgs):
            try:
                with Image.open(img) as im:
                    im.verify()
                ext = img.suffix.lower() if img.suffix.lower() in [".jpg",".jpeg",".png"] else ".jpg"
                shutil.copy2(img, dest / f"{cls_name}_{i:05d}{ext}")
                ok += 1
            except Exception:
                pass
        counts[split] = ok
    return counts

def auto_discover_behavior_classes():
    """Auto-discover classes inside the cattle_behavior dataset folder."""
    discovered = {}
    if BEHAVIOR_BASE.exists():
        for item in BEHAVIOR_BASE.rglob("*"):
            if item.is_dir():
                imgs = list(item.glob("*.jpg")) + list(item.glob("*.jpeg")) + list(item.glob("*.png"))
                if len(imgs) > 20:
                    discovered[item.name.lower().replace(" ","_")] = item
                    print(f"  [Auto-discovered] {item.name}: {len(imgs)} images -> '{item.name.lower().replace(' ','_')}'")
    return discovered

def main():
    try:
        from PIL import Image
    except ImportError:
        os.system("pip install Pillow -q")
        from PIL import Image

    print("=" * 65)
    print("E-Gowshala — Dataset Preparation")
    print("=" * 65)

    # Clean output
    if OUT.exists():
        shutil.rmtree(OUT)
        print("Cleaned previous structured dataset.")

    all_stats = {}

    # ── Process confirmed classes ──────────────────────────────────────────
    print("\n[PHASE 1] Processing confirmed disease classes...")
    print(f"{'Class':<28} {'Train':>6} {'Val':>6} {'Test':>6} {'Total':>7}")
    print("-" * 60)

    for cls, sources in CLASS_SOURCES.items():
        imgs = collect_images(sources, cls)
        if len(imgs) == 0:
            print(f"  WARNING: No images found for '{cls}', skipping.")
            continue
        counts = split_and_copy(imgs, cls)
        total = sum(counts.values())
        all_stats[cls] = counts
        print(f"  {cls:<26} {counts['train']:>6} {counts['val']:>6} {counts['test']:>6} {total:>7}")

    # ── Auto-discover behavior/extra classes ──────────────────────────────
    print("\n[PHASE 2] Scanning cattle_behavior dataset for extra classes...")
    discovered = auto_discover_behavior_classes()

    CLASS_KEYWORDS = {
        "lameness":           ["lame","limp","gait","locomotion","walking"],
        "eye_disease":        ["eye","pinkeye","conjunctiv","ocular"],
        "skin_disease":       ["ringworm","dermatit","skin","itch","mange"],
        "respiratory_disease":["respiratory","nasal","cough","breath","brd","pneumon"],
    }

    for target_cls, keywords in CLASS_KEYWORDS.items():
        matched_sources = []
        for disc_name, disc_path in discovered.items():
            if any(kw in disc_name for kw in keywords):
                matched_sources.append(disc_path)

        if matched_sources:
            imgs = collect_images(matched_sources, target_cls)
            if imgs:
                counts = split_and_copy(imgs, target_cls)
                total = sum(counts.values())
                all_stats[target_cls] = counts
                print(f"  {target_cls:<26} {counts['train']:>6} {counts['val']:>6} {counts['test']:>6} {total:>7}")
        else:
            print(f"  {target_cls}: No matching folder found in cattle_behavior yet.")

    # ── Save class mapping ─────────────────────────────────────────────────
    class_list = sorted(all_stats.keys())
    class_mapping = {
        "classes": class_list,
        "num_classes": len(class_list),
        "class_to_index": {c: i for i, c in enumerate(class_list)},
        "index_to_class": {str(i): c for i, c in enumerate(class_list)},
        "img_size": [224, 224],
        "splits": {cls: all_stats[cls] for cls in class_list}
    }
    mapping_path = Path(r"c:\Users\rahul\OneDrive\Desktop\E-Gowshala\ai-service\training\class_mapping.json")
    with open(mapping_path, "w") as f:
        json.dump(class_mapping, f, indent=2)

    # ── Final summary ──────────────────────────────────────────────────────
    total_imgs = sum(sum(v.values()) for v in all_stats.values())
    print("\n" + "=" * 65)
    print(f"DATASET READY!")
    print(f"  Classes: {len(class_list)}")
    print(f"  Total images: {total_imgs}")
    print(f"  Output: {OUT}")
    print(f"  class_mapping.json saved to: {mapping_path}")
    print("=" * 65)
    print("\nNext step: Run train_model.py to start training!")

if __name__ == "__main__":
    main()
