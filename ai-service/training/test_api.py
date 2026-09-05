import os
import sys
from pathlib import Path

# Unbuffered output
sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)

print("Testing Kaggle Python API...")
try:
    from kaggle.api.kaggle_api_extended import KaggleApi
    print("Imported KaggleApi successfully.")
    
    api = KaggleApi()
    print("Created KaggleApi instance.")
    
    api.authenticate()
    print("Authenticated successfully!")
    
    dest = Path(r"c:\Users\rahul\OneDrive\Desktop\E-Gowshala\ai-service\training\datasets\raw\test_fmd")
    dest.mkdir(parents=True, exist_ok=True)
    print(f"Downloading dataset to {dest}...")
    
    api.dataset_download_files("wasimfaraz/fmd-cattle-dataset", path=str(dest), unzip=True)
    print("Download and unzip finished!")
    
    files = list(dest.rglob("*"))
    print(f"Total files unpacked: {len(files)}")
    for f in files[:10]:
        print(f" - {f.name} ({f.stat().st_size} bytes)")

except Exception as e:
    print(f"EXCEPTION: {type(e).__name__} -> {e}")
    import traceback
    traceback.print_exc()
