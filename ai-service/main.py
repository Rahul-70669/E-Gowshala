"""
E-Gowshala AI Microservice — Disease Prediction & Health Risk Analysis
FastAPI server providing ML-based cattle health predictions.
Includes CNN image-based disease detection + rule-based vitals analysis.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os, json
from pathlib import Path

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load CNN model at startup."""
    load_cnn_model()
    yield

app = FastAPI(title="E-Gowshala AI Service", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── CNN Model Setup ──────────────────────────────────
MODELS_DIR   = Path(__file__).parent / "models"
MODEL_KERAS  = MODELS_DIR / "cattle_disease_v1.keras"
MODEL_H5     = MODELS_DIR / "cattle_disease_v1.h5"   # fallback
CLASS_MAP    = MODELS_DIR / "class_mapping.json"

_cnn_model     = None
_class_mapping = None
_model_ready   = False

def load_cnn_model():
    """Load CNN model at startup — prefers .keras, falls back to .h5."""
    global _cnn_model, _class_mapping, _model_ready

    model_path = MODEL_KERAS if MODEL_KERAS.exists() else MODEL_H5 if MODEL_H5.exists() else None
    if model_path is None:
        print("CNN model not found. Train the model first.")
        return False

    try:
        import tensorflow as tf
        os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

        print(f"Loading CNN model from: {model_path.name}")
        _cnn_model = tf.keras.models.load_model(str(model_path))

        if CLASS_MAP.exists():
            with open(CLASS_MAP) as f:
                _class_mapping = json.load(f)
        else:
            _class_mapping = {
                "index_to_class": {
                    "0": "foot_mouth_disease",
                    "1": "healthy",
                    "2": "lumpy_skin_disease",
                    "3": "mastitis",
                    "4": "skin_disease"
                }
            }

        _model_ready = True
        classes = _class_mapping.get("classes", [])
        print(f"CNN model ready! Classes: {classes}")

        # Warmup: run a dummy inference to pre-compile TF graph.
        # This eliminates the ~2s cold-start latency on the first real request.
        import numpy as np
        dummy = np.zeros((1, 224, 224, 3), dtype="float32")
        _cnn_model.predict(dummy, verbose=0)
        print("CNN warmup complete — first request will be fast.")
        return True
    except Exception as e:
        print(f"Could not load CNN model: {e}")
        return False

# ─── Data Models ──────────────────────────────────────

class HealthInput(BaseModel):
    temperature: float       # in °F (normal: 100.4–102.5)
    heart_rate: int          # bpm (normal: 40–80)
    weight: float            # kg
    age: int                 # years
    breed: str
    symptoms: list[str] = []
    is_pregnant: bool = False
    milk_yield_liters: Optional[float] = None

class PredictionResponse(BaseModel):
    risk_level: str
    risk_score: float
    predicted_conditions: list[dict]
    recommendations: list[str]
    confidence: float

class BehaviorInput(BaseModel):
    activity_level: str       # low, normal, high
    eating_pattern: str       # normal, reduced, excessive, none
    rumination_hours: float   # normal: 6–8 hours
    lying_time_hours: float   # normal: 10–14 hours
    water_intake_liters: float
    social_behavior: str      # normal, isolated, aggressive

class ImagePredictionResponse(BaseModel):
    disease: str
    display_name: str
    confidence: float
    severity: str
    all_predictions: list[dict]
    treatment: str
    should_see_vet: bool
    model_version: str

class FeedbackInput(BaseModel):
    image_prediction: str       # What model predicted
    correct_label: str          # What vet confirmed
    cow_id: Optional[str] = None
    notes: Optional[str] = None

# ─── Disease Knowledge Base ───────────────────────────

DISEASES = {
    "foot_mouth_disease": {
        "name": "Foot & Mouth Disease (FMD)",
        "symptoms": ["fever", "drooling", "blisters", "lameness", "loss of appetite"],
        "severity": "critical",
        "treatment": "ISOLATE immediately. Contact district veterinary officer. Administer anti-fever medication. No cure — supportive care and strict quarantine.",
        "should_see_vet": True,
    },
    "lumpy_skin_disease": {
        "name": "Lumpy Skin Disease (LSD)",
        "symptoms": ["skin lumps", "fever", "swollen lymph nodes", "nasal discharge", "lethargy"],
        "severity": "high",
        "treatment": "Vaccinate herd immediately (Neethling strain). Isolate affected animals. Anti-inflammatory drugs. Wound care for skin lesions. Report to authorities.",
        "should_see_vet": True,
    },
    "mastitis": {
        "name": "Mastitis (Udder Infection)",
        "symptoms": ["swollen udder", "abnormal milk", "fever", "pain on touch", "reduced milk yield"],
        "severity": "medium",
        "treatment": "Antibiotic therapy (Cephalosporin/Amoxicillin). Improve milking hygiene. Hot compresses. CMT test to identify affected quarters.",
        "should_see_vet": True,
    },
    "skin_disease": {
        "name": "Skin Disease (Ringworm / Warts)",
        "symptoms": ["circular bald patches", "skin warts", "crusty skin", "itching", "hair loss"],
        "severity": "low",
        "treatment": "Apply antifungal cream (Miconazole). For warts: surgical removal or immune stimulation. Improve hygiene and nutrition.",
        "should_see_vet": False,
    },
    "healthy": {
        "name": "Healthy Cow",
        "symptoms": [],
        "severity": "none",
        "treatment": "Continue regular health monitoring and vaccination schedule. Maintain balanced nutrition.",
        "should_see_vet": False,
    },
    # Legacy rule-based diseases (not yet in CNN)
    "bloat": {
        "name": "Ruminal Bloat",
        "symptoms": ["distended abdomen", "difficulty breathing", "restlessness", "drooling"],
        "severity": "high",
        "treatment": "Emergency trocarization if severe. Administer anti-bloat oil. Restrict green fodder.",
        "should_see_vet": True,
    },
    "brucellosis": {
        "name": "Brucellosis",
        "symptoms": ["abortion", "retained placenta", "infertility", "joint swelling"],
        "severity": "high",
        "treatment": "Vaccination (S19 for calves). Test and segregate. Report to authorities.",
        "should_see_vet": True,
    },
    "tick_fever": {
        "name": "Tick Fever (Babesiosis)",
        "symptoms": ["high fever", "anemia", "dark urine", "weakness", "jaundice"],
        "severity": "high",
        "treatment": "Diminazene aceturate injection. Iron supplements. Tick control program.",
        "should_see_vet": True,
    },
    "respiratory_infection": {
        "name": "Bovine Respiratory Disease",
        "symptoms": ["cough", "nasal discharge", "fever", "rapid breathing", "lethargy"],
        "severity": "medium",
        "treatment": "Oxytetracycline antibiotics. NSAIDs for fever. Ensure ventilation in shed.",
        "should_see_vet": True,
    },
    "ketosis": {
        "name": "Ketosis (Acetonaemia)",
        "symptoms": ["loss of appetite", "weight loss", "reduced milk", "sweet breath", "lethargy"],
        "severity": "medium",
        "treatment": "IV glucose. Propylene glycol drench. Increase energy-rich feed.",
        "should_see_vet": True,
    },
}

# ─── Image Prediction Logic ───────────────────────────

async def predict_from_image(image_bytes: bytes) -> ImagePredictionResponse:
    """Run CNN model on uploaded image bytes."""
    if not _model_ready:
        raise HTTPException(
            status_code=503,
            detail="CNN model not loaded yet. Train the model first or check ai-service/models/ folder."
        )

    import numpy as np
    import tensorflow as tf

    # Decode & preprocess image
    img = tf.image.decode_image(image_bytes, channels=3, expand_animations=False)
    img = tf.image.resize(img, [224, 224])
    img = tf.cast(img, tf.float32) / 255.0
    img = tf.expand_dims(img, 0)   # Add batch dimension

    # Run inference
    probs = _cnn_model.predict(img, verbose=0)[0]
    idx_to_cls = _class_mapping.get("index_to_class", {})

    all_preds = []
    for idx, prob in enumerate(probs):
        cls = idx_to_cls.get(str(idx), f"class_{idx}")
        info = DISEASES.get(cls, {})
        all_preds.append({
            "class": cls,
            "display_name": info.get("name", cls),
            "confidence": round(float(prob), 4),
        })
    all_preds.sort(key=lambda x: x["confidence"], reverse=True)

    top = all_preds[0]
    top_cls = top["class"]
    info = DISEASES.get(top_cls, {})

    return ImagePredictionResponse(
        disease=top_cls,
        display_name=info.get("name", top_cls),
        confidence=top["confidence"],
        severity=info.get("severity", "unknown"),
        all_predictions=all_preds,
        treatment=info.get("treatment", "Consult a veterinarian."),
        should_see_vet=info.get("should_see_vet", True),
        model_version=_class_mapping.get("model_version", "1.0"),
    )

# ─── Vitals Prediction Logic ──────────────────────────

def predict_disease(data: HealthInput) -> PredictionResponse:
    conditions = []
    recommendations = []
    risk_score = 0.0

    # Temperature analysis
    if data.temperature > 103.5:
        risk_score += 0.3
        recommendations.append("High fever detected — immediate veterinary attention required")
    elif data.temperature > 102.5:
        risk_score += 0.15
        recommendations.append("Slightly elevated temperature — monitor closely")
    elif data.temperature < 100.0:
        risk_score += 0.2
        recommendations.append("Subnormal temperature — check for hypothermia or shock")

    # Heart rate analysis
    if data.heart_rate > 80:
        risk_score += 0.15
        recommendations.append("Elevated heart rate — may indicate pain, stress, or infection")
    elif data.heart_rate < 40:
        risk_score += 0.2
        recommendations.append("Low heart rate — check for cardiac issues")

    # Symptom matching against rule base
    symptoms_lower = [s.lower().strip() for s in data.symptoms]
    for disease_id, disease in DISEASES.items():
        if disease_id in ["healthy"]:
            continue
        matches = sum(1 for s in disease["symptoms"] if any(s in sym or sym in s for sym in symptoms_lower))
        if matches >= 2 or (matches >= 1 and risk_score > 0.2):
            confidence = min(0.95, 0.4 + (matches * 0.15) + (risk_score * 0.3))
            conditions.append({
                "disease": disease["name"],
                "probability": round(confidence, 2),
                "severity": disease["severity"],
                "matched_symptoms": matches,
                "treatment": disease["treatment"],
            })

    # Pregnancy-specific checks
    if data.is_pregnant:
        if data.temperature > 103.0:
            recommendations.append("Pregnant cow with fever — risk of abortion. Urgent vet care needed.")
            risk_score += 0.1
        recommendations.append("Continue monitoring pregnancy vitals regularly")

    # Milk yield drop
    if data.milk_yield_liters is not None and data.milk_yield_liters < 3.0:
        risk_score += 0.1
        recommendations.append("Significant drop in milk yield — check for subclinical mastitis or metabolic disease")

    # Fallback if no disease matched
    if not conditions:
        if risk_score > 0.2:
            conditions.append({
                "disease": "Unspecified Health Concern",
                "probability": round(risk_score, 2),
                "severity": "low",
                "matched_symptoms": 0,
                "treatment": "Schedule a detailed veterinary examination within 24 hours.",
            })
        else:
            conditions.append({
                "disease": "No Disease Detected",
                "probability": round(1 - risk_score, 2),
                "severity": "none",
                "matched_symptoms": 0,
                "treatment": "Continue regular health monitoring.",
            })

    conditions.sort(key=lambda x: x["probability"], reverse=True)

    if risk_score >= 0.5:
        risk_level = "critical"
    elif risk_score >= 0.3:
        risk_level = "high"
    elif risk_score >= 0.15:
        risk_level = "moderate"
    else:
        risk_level = "low"

    if not recommendations:
        recommendations.append("All vitals within normal range. Continue regular monitoring.")

    return PredictionResponse(
        risk_level=risk_level,
        risk_score=round(min(risk_score, 1.0), 2),
        predicted_conditions=conditions[:3],
        recommendations=recommendations,
        confidence=round(conditions[0]["probability"] if conditions else 0.9, 2),
    )

def analyze_behavior(data: BehaviorInput) -> dict:
    alerts = []
    risk_score = 0.0

    if data.activity_level == "low":
        alerts.append({"type": "warning", "message": "Low activity detected — possible illness or pain"})
        risk_score += 0.2
    if data.eating_pattern in ["reduced", "none"]:
        alerts.append({"type": "danger", "message": f"{'No eating' if data.eating_pattern == 'none' else 'Reduced eating'} — monitor for 24h, check for digestive issues"})
        risk_score += 0.3 if data.eating_pattern == "none" else 0.15
    if data.rumination_hours < 4:
        alerts.append({"type": "danger", "message": "Low rumination time — possible digestive disorder or pain"})
        risk_score += 0.25
    if data.lying_time_hours > 16:
        alerts.append({"type": "warning", "message": "Excessive lying time — check for lameness or fatigue"})
        risk_score += 0.1
    if data.water_intake_liters < 20:
        alerts.append({"type": "warning", "message": "Low water intake — dehydration risk"})
        risk_score += 0.15
    if data.social_behavior == "isolated":
        alerts.append({"type": "warning", "message": "Social isolation — early sign of illness"})
        risk_score += 0.2
    elif data.social_behavior == "aggressive":
        alerts.append({"type": "info", "message": "Aggressive behavior — check for estrus or environmental stress"})

    if not alerts:
        alerts.append({"type": "success", "message": "Normal behavior patterns observed"})

    return {
        "risk_score": round(min(risk_score, 1.0), 2),
        "risk_level": "critical" if risk_score >= 0.5 else "high" if risk_score >= 0.3 else "moderate" if risk_score >= 0.15 else "low",
        "alerts": alerts,
        "recommendation": "Immediate veterinary attention required" if risk_score >= 0.5 else "Schedule checkup within 24 hours" if risk_score >= 0.3 else "Continue monitoring" if risk_score >= 0.15 else "All normal",
    }

# ─── API Endpoints ────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "E-Gowshala AI",
        "status": "active",
        "version": "2.0.0",
        "cnn_model_loaded": _model_ready,
        "endpoints": ["/predict/disease", "/predict/image", "/analyze/behavior", "/diseases", "/model/status"]
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "cnn_ready": _model_ready}

@app.get("/model/status")
def model_status():
    """Check if CNN model is loaded and ready."""
    active_model = MODEL_KERAS if MODEL_KERAS.exists() else MODEL_H5
    return {
        "model_ready": _model_ready,
        "model_file": active_model.name,
        "model_exists": active_model.exists(),
        "model_size_mb": round(active_model.stat().st_size / 1024 / 1024, 1) if active_model.exists() else 0,
        "classes": _class_mapping.get("classes", []) if _class_mapping else [],
        "num_classes": _class_mapping.get("num_classes", 0) if _class_mapping else 0,
        "model_version": _class_mapping.get("model_version", "unknown") if _class_mapping else "unknown",
    }

@app.post("/predict/image", response_model=ImagePredictionResponse)
async def predict_image_endpoint(file: UploadFile = File(...)):
    """
    Upload a cow image → get disease prediction from CNN model.
    Accepts: JPG, JPEG, PNG images.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file (JPG or PNG).")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=413, detail="Image too large. Maximum size is 10MB.")

    return await predict_from_image(contents)

@app.post("/predict/disease", response_model=PredictionResponse)
def predict_disease_endpoint(data: HealthInput):
    """Predict disease from clinical vitals and symptoms."""
    return predict_disease(data)

@app.post("/predict/combined")
async def predict_combined(
    vitals: HealthInput,
    file: Optional[UploadFile] = File(None)
):
    """
    Combined prediction: vitals rule-engine + optional CNN image analysis.
    Best of both worlds.
    """
    vitals_result = predict_disease(vitals)
    image_result = None

    if file and file.content_type and file.content_type.startswith("image/"):
        contents = await file.read()
        try:
            image_result = await predict_from_image(contents)
        except Exception:
            image_result = None

    return {
        "vitals_analysis": vitals_result,
        "image_analysis": image_result,
        "combined_risk": vitals_result.risk_level,
        "note": "Image analysis added CNN-based visual disease detection" if image_result else "Image analysis not performed",
    }

@app.post("/feedback")
def submit_feedback(data: FeedbackInput):
    """
    Submit veterinary feedback on a prediction.
    Used to collect ground-truth data for model retraining.
    """
    import json
    from datetime import datetime

    feedback_file = MODELS_DIR / "feedback_log.jsonl"
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "predicted": data.image_prediction,
        "correct": data.correct_label,
        "cow_id": data.cow_id,
        "notes": data.notes,
    }
    with open(feedback_file, "a") as f:
        f.write(json.dumps(entry) + "\n")

    return {"status": "saved", "message": "Thank you! Feedback will improve future model accuracy."}

@app.post("/analyze/behavior")
def analyze_behavior_endpoint(data: BehaviorInput):
    """Analyze behavioral indicators for health risk assessment."""
    return analyze_behavior(data)

@app.get("/diseases")
def list_diseases():
    """List all diseases in the knowledge base."""
    return {
        "diseases": [
            {
                "id": k,
                "name": v["name"],
                "severity": v["severity"],
                "symptoms": v["symptoms"],
                "in_cnn_model": k in ["foot_mouth_disease", "lumpy_skin_disease", "mastitis", "skin_disease", "healthy"]
            }
            for k, v in DISEASES.items() if k != "healthy"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
