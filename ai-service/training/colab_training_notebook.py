# ╔══════════════════════════════════════════════════════════════╗
# ║   E-Gowshala — Cattle Disease CNN Training Notebook          ║
# ║   Run this on Google Colab with T4 GPU                       ║
# ║                                                              ║
# ║   STEP 1: Runtime → Change runtime type → T4 GPU → Save     ║
# ║   STEP 2: Run cells in order                                 ║
# ║   STEP 3: Download egowshala_model_package.zip at the end   ║
# ╚══════════════════════════════════════════════════════════════╝

# ══════════════════════════════════════════════════════════════
# CELL 1: CHECK GPU + INSTALL PACKAGES
# ══════════════════════════════════════════════════════════════

import subprocess, sys
import tensorflow as tf

print(f"TensorFlow: {tf.__version__}")
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    print(f"✅ GPU ready: {gpus[0].name}")
else:
    print("⚠️  No GPU! Go to Runtime → Change runtime type → T4 GPU")

subprocess.check_call([sys.executable, "-m", "pip", "install", "-q",
    "kaggle", "Pillow", "matplotlib", "seaborn", "scikit-learn"])
print("✅ Packages installed")


# ══════════════════════════════════════════════════════════════
# CELL 2: KAGGLE API SETUP
# ══════════════════════════════════════════════════════════════
# HOW TO GET YOUR KAGGLE KEY:
# 1. Go to https://kaggle.com → Your Profile → Settings
# 2. Scroll to "API" → "Create New Token"
# 3. Opens kaggle.json — copy username + key here

import os, json

KAGGLE_USERNAME = "your_username_here"   # <-- CHANGE THIS
KAGGLE_KEY      = "your_api_key_here"    # <-- CHANGE THIS

os.makedirs(os.path.expanduser("~/.kaggle"), exist_ok=True)
with open(os.path.expanduser("~/.kaggle/kaggle.json"), "w") as f:
    json.dump({"username": KAGGLE_USERNAME, "key": KAGGLE_KEY}, f)
os.chmod(os.path.expanduser("~/.kaggle/kaggle.json"), 0o600)
print("✅ Kaggle configured")


# ══════════════════════════════════════════════════════════════
# CELL 3: DOWNLOAD ALL DATASETS
# ══════════════════════════════════════════════════════════════

import os

print("Downloading datasets (this takes 5-10 minutes)...")

datasets = [
    # (kaggle_dataset_slug, local_folder)
    ("saurabhshahane/lumpy-skin-disease-dataset",       "/content/dl/lsd"),
    ("kadir25/cattle-diseases-dataset",                  "/content/dl/cattle_multi"),
    ("omarmohamedelerakky/cattle-disease-dataset",       "/content/dl/cattle_body"),
    ("shivamtech29/lumpy-skin-disease-dataset",          "/content/dl/lsd2"),
    ("khalidgazzaz/diagnosis-of-disease-in-cattle",      "/content/dl/diagnosis"),
    ("jerrykiboi/cattle-health-and-feeding-data",        "/content/dl/health_data"),
]

for slug, folder in datasets:
    print(f"  Downloading: {slug}")
    result = os.system(f"kaggle datasets download -d {slug} -p {folder} --unzip -q 2>/dev/null")
    if result == 0:
        print(f"    ✅ Done")
    else:
        print(f"    ⚠️  Failed (dataset may not exist or need acceptance)")

# Also try FMD from Zenodo
print("  Downloading: FMD from Zenodo")
os.system("""
wget -q "https://zenodo.org/record/7779246/files/FMD_Dataset.zip" \
     -O /content/dl/fmd_zenodo.zip 2>/dev/null && \
unzip -q /content/dl/fmd_zenodo.zip -d /content/dl/fmd_zenodo 2>/dev/null || \
echo "  Zenodo FMD: download manually from https://doi.org/10.5281/zenodo.7779246"
""")

print("\n✅ Downloads complete. Listing downloaded folders:")
os.system("find /content/dl -type d | head -40")


# ══════════════════════════════════════════════════════════════
# CELL 4: EXPLORE WHAT WAS DOWNLOADED
# (Run this to see exact folder names before mapping)
# ══════════════════════════════════════════════════════════════

import os
from pathlib import Path

print("=== DOWNLOADED FOLDER STRUCTURE ===")
for folder in sorted(Path("/content/dl").rglob("*")):
    if folder.is_dir():
        n_images = len(list(folder.glob("*.jpg")) + list(folder.glob("*.png")) + list(folder.glob("*.jpeg")))
        if n_images > 0:
            print(f"  {str(folder):<60} ({n_images} images)")


# ══════════════════════════════════════════════════════════════
# CELL 5: MERGE DATASETS INTO UNIFIED CLASS STRUCTURE
# (IMPORTANT: Update source_dirs based on CELL 4 output)
# ══════════════════════════════════════════════════════════════

import shutil
import random
from pathlib import Path
from PIL import Image

FINAL_DIR = Path("/content/dataset")
IMG_SIZE  = (224, 224)

# ── 8 Disease Classes ─────────────────────────────────────────
CLASS_MAPPING = {
    "healthy": [
        "/content/dl/lsd/Normal Skin",
        "/content/dl/lsd2/Normal",
        "/content/dl/cattle_multi/Normal",
        "/content/dl/cattle_body/Normal",
    ],
    "lumpy_skin_disease": [
        "/content/dl/lsd/Lumpy Skin",
        "/content/dl/lsd2/Lumpy",
        "/content/dl/lsd2/lumpy_skin_disease",
        "/content/dl/cattle_multi/lumpy skin",
    ],
    "foot_mouth_disease": [
        "/content/dl/fmd_zenodo",
        "/content/dl/cattle_multi/fmd",
        "/content/dl/cattle_multi/Foot and Mouth",
        "/content/dl/cattle_body/Head",      # FMD shows on head/mouth
    ],
    "mastitis": [
        "/content/dl/cattle_multi/mastitis",
        "/content/dl/cattle_body/Udder",
    ],
    "lameness": [
        "/content/dl/cattle_body/Foot",
        "/content/dl/cattle_multi/lameness",
    ],
    "eye_disease": [
        "/content/dl/cattle_multi/eye",
        "/content/dl/cattle_multi/pinkeye",
    ],
    "skin_disease": [
        "/content/dl/cattle_multi/ringworm",
        "/content/dl/cattle_multi/dermatitis",
        "/content/dl/cattle_multi/skin",
    ],
    "respiratory_disease": [
        "/content/dl/cattle_multi/respiratory",
        "/content/dl/cattle_multi/brd",
        "/content/dl/cattle_multi/nasal",
    ],
}

def copy_class_images(sources, cls_name, max_imgs=600):
    """Copy valid images from source folders into dataset/class structure."""
    all_imgs = []
    for src in sources:
        p = Path(src)
        if p.exists():
            for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG", "*.PNG"]:
                all_imgs.extend(list(p.rglob(ext)))

    random.shuffle(all_imgs)
    all_imgs = all_imgs[:max_imgs]

    n_train = int(len(all_imgs) * 0.70)
    n_val   = int(len(all_imgs) * 0.20)

    split_map = {
        "train": all_imgs[:n_train],
        "val":   all_imgs[n_train:n_train + n_val],
        "test":  all_imgs[n_train + n_val:],
    }

    counts = {}
    for split, imgs in split_map.items():
        dest = FINAL_DIR / split / cls_name
        dest.mkdir(parents=True, exist_ok=True)
        ok = 0
        for i, img in enumerate(imgs):
            try:
                with Image.open(img) as im:
                    im.verify()
                shutil.copy2(img, dest / f"{cls_name}_{i:05d}{img.suffix.lower()}")
                ok += 1
            except Exception:
                pass
        counts[split] = ok
    return counts

print("Organising dataset...")
print(f"{'Class':<25} {'Train':>6} {'Val':>6} {'Test':>6}")
print("-" * 50)
total = 0
for cls, sources in CLASS_MAPPING.items():
    counts = copy_class_images(sources, cls, max_imgs=700)
    t = counts.get("train", 0) + counts.get("val", 0) + counts.get("test", 0)
    total += t
    print(f"{cls:<25} {counts.get('train',0):>6} {counts.get('val',0):>6} {counts.get('test',0):>6}")
print(f"\n{'TOTAL':<25} {total:>6} images across {len(CLASS_MAPPING)} classes")


# ══════════════════════════════════════════════════════════════
# CELL 6: CREATE DATA PIPELINE WITH AUGMENTATION
# ══════════════════════════════════════════════════════════════

from tensorflow.keras.preprocessing.image import ImageDataGenerator

BATCH_SIZE  = 32
NUM_CLASSES = len(CLASS_MAPPING)

train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=25,
    width_shift_range=0.15,
    height_shift_range=0.15,
    shear_range=0.1,
    zoom_range=0.2,
    horizontal_flip=True,
    brightness_range=[0.7, 1.3],
    channel_shift_range=15.0,
    fill_mode="nearest"
)
val_datagen = ImageDataGenerator(rescale=1./255)

train_gen = train_datagen.flow_from_directory(
    FINAL_DIR / "train", target_size=IMG_SIZE,
    batch_size=BATCH_SIZE, class_mode="categorical", shuffle=True, seed=42)

val_gen = val_datagen.flow_from_directory(
    FINAL_DIR / "val", target_size=IMG_SIZE,
    batch_size=BATCH_SIZE, class_mode="categorical", shuffle=False)

test_gen = val_datagen.flow_from_directory(
    FINAL_DIR / "test", target_size=IMG_SIZE,
    batch_size=BATCH_SIZE, class_mode="categorical", shuffle=False)

CLASS_NAMES = {str(v): k for k, v in train_gen.class_indices.items()}
print(f"✅ Data pipeline ready | Classes: {train_gen.class_indices}")

with open("/content/class_mapping.json", "w") as f:
    json.dump({
        "index_to_class": CLASS_NAMES,
        "class_to_index": train_gen.class_indices,
        "num_classes": NUM_CLASSES,
        "img_size": list(IMG_SIZE),
        "model_version": "1.0",
        "architecture": "EfficientNetB0",
        "diseases_covered": list(CLASS_MAPPING.keys()),
    }, f, indent=2)
print("✅ class_mapping.json saved")


# ══════════════════════════════════════════════════════════════
# CELL 7: BUILD MODEL — EfficientNetB0 Transfer Learning
# ══════════════════════════════════════════════════════════════

from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras import layers, models, regularizers
from tensorflow.keras.optimizers import Adam

base = EfficientNetB0(include_top=False, weights="imagenet",
                      input_shape=(224, 224, 3), drop_connect_rate=0.2)
base.trainable = False

inp = tf.keras.Input(shape=(224, 224, 3))
x   = base(inp, training=False)
x   = layers.GlobalAveragePooling2D()(x)
x   = layers.BatchNormalization()(x)
x   = layers.Dense(512, activation="relu", kernel_regularizer=regularizers.l2(1e-4))(x)
x   = layers.Dropout(0.4)(x)
x   = layers.Dense(256, activation="relu", kernel_regularizer=regularizers.l2(1e-4))(x)
x   = layers.Dropout(0.3)(x)
out = layers.Dense(NUM_CLASSES, activation="softmax")(x)
model = tf.keras.Model(inp, out)

model.compile(optimizer=Adam(1e-3), loss="categorical_crossentropy",
              metrics=["accuracy",
                       tf.keras.metrics.TopKCategoricalAccuracy(k=2, name="top2_acc")])
print(f"✅ Model ready — {model.count_params():,} parameters")


# ══════════════════════════════════════════════════════════════
# CELL 8: PHASE 1 TRAINING — Head only (frozen base)
# ══════════════════════════════════════════════════════════════

from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau

callbacks_p1 = [
    ModelCheckpoint("/content/phase1_best.h5", monitor="val_accuracy",
                    save_best_only=True, mode="max", verbose=1),
    EarlyStopping(monitor="val_accuracy", patience=5,
                  restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3,
                      min_lr=1e-7, verbose=1),
]

print("=== PHASE 1: Training classification head ===")
h1 = model.fit(train_gen, epochs=12, validation_data=val_gen,
               callbacks=callbacks_p1, verbose=1)
print(f"Phase 1 best val accuracy: {max(h1.history['val_accuracy']):.1%}")


# ══════════════════════════════════════════════════════════════
# CELL 9: PHASE 2 — Fine-tune top 30 base layers
# ══════════════════════════════════════════════════════════════

base.trainable = True
freeze_until = len(base.layers) - 30
for layer in base.layers[:freeze_until]:
    layer.trainable = False
print(f"Unfroze top {len(base.layers) - freeze_until} layers")

model.compile(optimizer=Adam(1e-5), loss="categorical_crossentropy",
              metrics=["accuracy",
                       tf.keras.metrics.TopKCategoricalAccuracy(k=2, name="top2_acc")])

callbacks_p2 = [
    ModelCheckpoint("/content/cattle_disease_v1.h5", monitor="val_accuracy",
                    save_best_only=True, mode="max", verbose=1),
    EarlyStopping(monitor="val_accuracy", patience=8,
                  restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor="val_loss", factor=0.3, patience=4,
                      min_lr=1e-8, verbose=1),
]

print("=== PHASE 2: Fine-tuning ===")
h2 = model.fit(train_gen, epochs=25, validation_data=val_gen,
               callbacks=callbacks_p2,
               initial_epoch=len(h1.history["accuracy"]), verbose=1)
print(f"Phase 2 best val accuracy: {max(h2.history['val_accuracy']):.1%}")


# ══════════════════════════════════════════════════════════════
# CELL 10: EVALUATE + CONFUSION MATRIX
# ══════════════════════════════════════════════════════════════

import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np

model.load_weights("/content/cattle_disease_v1.h5")
test_gen.reset()
y_pred = np.argmax(model.predict(test_gen, verbose=1), axis=1)
y_true = test_gen.classes
cls_list = list(CLASS_MAPPING.keys())

print("\n=== Classification Report ===")
print(classification_report(y_true, y_pred, target_names=cls_list))

cm = confusion_matrix(y_true, y_pred)
plt.figure(figsize=(12, 9))
sns.heatmap(cm, annot=True, fmt="d", cmap="Greens",
            xticklabels=cls_list, yticklabels=cls_list, linewidths=0.5)
plt.title("E-Gowshala Cattle Disease Model — Confusion Matrix", fontweight="bold")
plt.ylabel("True"); plt.xlabel("Predicted")
plt.xticks(rotation=45, ha="right"); plt.yticks(rotation=0)
plt.tight_layout()
plt.savefig("/content/confusion_matrix.png", dpi=150)
plt.show()

# Training curves
all_acc = h1.history["accuracy"] + h2.history["accuracy"]
all_val = h1.history["val_accuracy"] + h2.history["val_accuracy"]
fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(all_acc, label="Train", color="#1a7a4a", lw=2)
ax.plot(all_val, label="Val",   color="#f59e0b", lw=2, ls="--")
ax.axvline(len(h1.history["accuracy"]), color="red", ls=":", label="Fine-tune start")
ax.set_title("E-Gowshala CNN — Training Accuracy", fontweight="bold")
ax.set_xlabel("Epoch"); ax.set_ylabel("Accuracy")
ax.legend(); ax.grid(alpha=0.3)
plt.tight_layout()
plt.savefig("/content/training_curves.png", dpi=150)
plt.show()

loss, acc, top2 = model.evaluate(test_gen, verbose=0)
print(f"\n🎯 Final Test Accuracy: {acc:.1%}  |  Top-2 Accuracy: {top2:.1%}")


# ══════════════════════════════════════════════════════════════
# CELL 11: SAVE EVERYTHING + PACKAGE FOR DOWNLOAD
# ══════════════════════════════════════════════════════════════

# TFLite model (smaller, faster for Render deployment)
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite = converter.convert()
with open("/content/cattle_disease_v1.tflite", "wb") as f:
    f.write(tflite)
print(f"✅ TFLite: {len(tflite)/1024/1024:.1f} MB")

# Zip all outputs
os.system("""
zip -j /content/egowshala_model_package.zip \
    /content/cattle_disease_v1.h5 \
    /content/cattle_disease_v1.tflite \
    /content/class_mapping.json \
    /content/confusion_matrix.png \
    /content/training_curves.png
""")

print("\n" + "=" * 60)
print("TRAINING COMPLETE!")
print("=" * 60)
print(f"  Test Accuracy: {acc:.1%}")
print()
print("FILES TO DOWNLOAD (Files tab on left, or run download cell):")
print("  ✅ egowshala_model_package.zip  ← Download this!")
print()
print("AFTER DOWNLOAD:")
print("  1. Extract the zip")
print("  2. Copy cattle_disease_v1.h5  → ai-service/models/")
print("  3. Copy class_mapping.json    → ai-service/models/")
print("  4. We then integrate into main.py")


# ══════════════════════════════════════════════════════════════
# CELL 12: DOWNLOAD SHORTCUT
# ══════════════════════════════════════════════════════════════

from google.colab import files
files.download("/content/egowshala_model_package.zip")
print("✅ Download started!")
