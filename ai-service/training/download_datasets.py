import os
import sys
import subprocess
from pathlib import Path

# Force UTF-8 for output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

BASE_DIR = Path(r"c:\Users\rahul\OneDrive\Desktop\E-Gowshala\ai-service\training\datasets\raw")
BASE_DIR.mkdir(parents=True, exist_ok=True)

DATASETS = [
    ("warcoder/lumpy-skin-images-dataset", BASE_DIR / "lsd_warcoder"),
    ("shivamagarwal29/cow-lumpy-disease-dataset", BASE_DIR / "lsd_shivam"),
    ("wasimfaraz/fmd-cattle-dataset", BASE_DIR / "fmd_wasim"),
    ("wasimfaraz/cattle-foot-and-mouth-disease-fmd", BASE_DIR / "fmd_extended"),
    ("devang03mgr/cattle-diseases-datasets", BASE_DIR / "cattle_multi_devang"),
    ("magantirajasri/cattle-diseases-dataset", BASE_DIR / "cattle_multi_maganti"),
    ("anmol420/animal-disease-prediction", BASE_DIR / "disease_csv"),
]

def download_dataset(slug, dest_dir):
    dest_dir.mkdir(parents=True, exist_ok=True)
    print(f"\n==========================================")
    print(f"[DOWNLOADING] {slug}")
    print(f"[DESTINATION] {dest_dir}")
    print(f"==========================================")
    
    cmd = [
        "kaggle", "datasets", "download",
        "-d", slug,
        "-p", str(dest_dir),
        "--unzip"
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(res.stdout)
        print(f"[SUCCESS] Downloaded & unzipped: {slug}")
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] downloading {slug}:")
        print(e.stderr)

if __name__ == "__main__":
    print("Starting automated dataset collection via Kaggle API...")
    for slug, dest in DATASETS:
        download_dataset(slug, dest)
    
    print("\n[COMPLETE] All dataset downloads completed!")
    print("\nSummary of files downloaded:")
    for slug, dest in DATASETS:
        if dest.exists():
            files = list(dest.rglob("*"))
            imgs = [f for f in files if f.suffix.lower() in [".jpg", ".jpeg", ".png"]]
            print(f"  * {dest.name}: {len(imgs)} images, {len(files)} total files")
