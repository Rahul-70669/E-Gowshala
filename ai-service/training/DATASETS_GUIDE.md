# E-Gowshala — Complete Dataset Collection Guide

## All Datasets to Download (All FREE)

### KAGGLE DATASETS
Login at https://kaggle.com, then download each:

| # | Dataset | URL | Class It Covers | Images |
|---|---------|-----|----------------|--------|
| 1 | Lumpy Skin Disease | https://www.kaggle.com/datasets/saurabhshahane/lumpy-skin-disease-dataset | lumpy_skin_disease + healthy | ~1000 |
| 2 | Lumpy Skin (alternate) | https://www.kaggle.com/datasets/shivamtech29/lumpy-skin-disease-dataset | lumpy_skin_disease | ~500 |
| 3 | Cattle Diseases Multi | https://www.kaggle.com/datasets/kadir25/cattle-diseases-dataset | FMD, skin, eye, respiratory | ~800 |
| 4 | Cattle Body Parts | https://www.kaggle.com/datasets/omarmohamedelerakky/cattle-disease-dataset | Foot, Head, Udder, Torso | ~600 |
| 5 | Diagnosis of Disease | https://www.kaggle.com/datasets/khalidgazzaz/diagnosis-of-disease-in-cattle | CSV (symptoms) | — |
| 6 | Cattle Health & Feeding | https://www.kaggle.com/datasets/jerrykiboi/cattle-health-and-feeding-data | CSV (vitals) | — |
| 7 | Cow Health Prediction | https://www.kaggle.com/datasets/gauravduttakiit/cow-health-prediction | CSV (health status) | — |

### MENDELEY DATA DATASETS
Go to each link, click "Download All":

| # | Dataset | URL | Class | Images |
|---|---------|-----|-------|--------|
| 1 | LSD Academic (Kumar & Shastri 2022) | https://data.mendeley.com/datasets/w36hpf86j2/1 | lumpy_skin_disease + healthy | 1024 |
| 2 | Cattle Lameness Images | https://data.mendeley.com/datasets/p6x4s5s6n4/1 | lameness | 277 |
| 3 | Cattle Lameness 2D (Siachos 2024) | https://data.mendeley.com/datasets/533d5ttydp/1 | lameness | varies |

### ROBOFLOW UNIVERSE DATASETS
Go to https://universe.roboflow.com, export as "Classification" format:

| # | Project | URL | Classes Covered |
|---|---------|-----|----------------|
| 1 | livestock_disease | https://universe.roboflow.com/mathanbabu/livestock_disease | FMD, LSD, mastitis, TB, ringworm |
| 2 | Cattle Disease Detection | https://universe.roboflow.com/mdzillur-rahaman-rohan/cattle_disease-detection | FMD, LSD, foot |
| 3 | Cattle Diseases (SLIIT) | https://universe.roboflow.com/sliit-siqx8/cattle-diseases-ezkwx | multi-disease |
| 4 | Indian Bovine Breed | https://universe.roboflow.com/chad-teeru/indian-bovine-breed-recognition-hen07-zls8t | Healthy Indian breeds |
| 5 | Sahiwal Cow | https://universe.roboflow.com/final-bwjlq/sahiwal-cow-onsxx | Healthy Sahiwal |
| 6 | Cow + Mastitis Detection | https://universe.roboflow.com (search "cow mastitis") | mastitis |
| 7 | FMD Object Detection | https://universe.roboflow.com/moaz-biwiy/foot-and-mouth-disease | foot_mouth_disease |

### ZENODO / ACADEMIC DATASETS

| # | Dataset | URL | Class |
|---|---------|-----|-------|
| 1 | FMD Cattle Dataset | https://doi.org/10.5281/zenodo.7779246 | foot_mouth_disease |
| 2 | EuFMD Lesion Library | https://knowledgebank.eufmd.com | foot_mouth_disease (high quality) |

### GITHUB + SPECIAL SOURCES

| # | Source | URL | What To Get |
|---|--------|-----|-------------|
| 1 | Lameness Detection Code | https://github.com/whsu2s/Lameness-Detection | Code + dataset links |
| 2 | LSTM Lameness | https://github.com/hrussel/lstm-lameness-detection | 272 keypoint trajectories |
| 3 | ML Animal Health | https://github.com/IbrahimBagwan1/ML-Animal-Health-Prediction | Training CSV data |
| 4 | Cattle Disease ML | https://github.com/thyagarajank/Cattle-disease-prediction-using-Machine-Learning | Training + Testing CSV |

### HUGGING FACE DATASETS

| # | Dataset | URL | Use For |
|---|---------|-----|---------|
| 1 | Indian Cattle Breeds | https://huggingface.co/datasets/SynthAIzer/indian-cattle-buffalo-breeds | Healthy Indian breeds |

---

## How to Download from Roboflow (Step by Step)

1. Go to the dataset URL
2. Click "Download Dataset" button (top right)
3. Select Export Format: **"Classification" → "Folder Structure"**
4. Click "Download zip to computer"
5. Extract, you get: `train/class_name/image.jpg` format
6. This is exactly what our training script expects!

---

## Expected Total Dataset Size After All Downloads

| Class | Expected Images | Sources |
|-------|----------------|---------|
| healthy | 800-1200 | LSD datasets (normal class) + Indian breed datasets |
| lumpy_skin_disease | 500-800 | Kaggle LSD + Mendeley LSD |
| foot_mouth_disease | 300-500 | Zenodo FMD + Roboflow FMD + Kaggle cattle multi |
| mastitis | 200-400 | Roboflow mastitis + Kaggle cattle body |
| lameness | 200-300 | Mendeley lameness + GitHub datasets |
| eye_disease | 150-250 | Roboflow eye/pinkeye + Kaggle cattle multi |
| skin_disease | 200-300 | Roboflow ringworm/dermatitis |
| respiratory_disease | 100-200 | Kaggle cattle multi (BRD/nasal images) |
| **TOTAL** | **~2500-3950** | All sources combined |

Note: Our augmentation pipeline will multiply this 5-8x effectively,
so 2500 raw images → ~15,000-20,000 augmented training examples.
This is sufficient for EfficientNetB0 fine-tuning!

---

## Minimum Viable Dataset (if some downloads fail)

At minimum, we MUST have:
1. ✅ LSD dataset (Kaggle #1) — most important for India
2. ✅ Mendeley LSD — gives us healthy class too
3. ✅ Cattle Body Parts (Kaggle #4) — covers foot, head, udder
4. ✅ Roboflow livestock_disease — covers 5 classes at once

With just these 4, we get ~2000 images across all 8 classes.
That is enough to train a baseline model to ~80% accuracy.

---

## After Training — Files To Copy to Project

After Colab training, download and copy these to your project:

```
egowshala_model_package.zip
    ├── cattle_disease_v1.h5      → ai-service/models/
    ├── cattle_disease_v1.tflite  → ai-service/models/  (future mobile)
    ├── class_mapping.json        → ai-service/models/
    ├── confusion_matrix.png      → Keep for documentation
    └── training_curves.png       → Keep for documentation
```
