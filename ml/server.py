from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import pickle
import os
import pandas as pd

app = FastAPI(title="MindCare ML Service", version="3.0.0")

# ---------------------------------------------------------------------------
# Global Models
# ---------------------------------------------------------------------------
models = {}
meta = {}
BASE_DIR = os.path.dirname(__file__)

def load_pkl(filename):
    path = os.path.join(BASE_DIR, filename)
    if os.path.exists(path):
        with open(path, 'rb') as f:
            return pickle.load(f)
    print(f"[WARN] {filename} not found.")
    return None

@app.on_event("startup")
def load_all_models():
    print("=" * 50)
    print(" MindCare ML Server - Loading Models")
    print("=" * 50)
    
    # 1. Burnout V2
    models['burnout'] = load_pkl('burnout_model_v2.pkl')
    meta['burnout_features'] = load_pkl('burnout_v2_features.pkl')
    if models['burnout']: print("[OK] Loaded Burnout V2 Model")

    # 2. Vision
    models['vision'] = load_pkl('vision_model.pkl')
    if models['vision']: print("[OK] Loaded Vision Model")

    # 3. Text Sentiment
    models['text'] = load_pkl('text_classifier.pkl')
    meta['text_labels'] = load_pkl('text_risk_labels.pkl')
    if models['text']: print("[OK] Loaded Text Sentiment Model")

    # 4. Mood Trend
    models['mood'] = load_pkl('mood_trend_model.pkl')
    meta['mood_features'] = load_pkl('mood_trend_features.pkl')
    if models['mood']: print("[OK] Loaded Mood Trend Model")

# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": {k: v is not None for k, v in models.items()},
        "version": "3.0.0"
    }

# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------
def _risk_level(score: float) -> str:
    if score >= 0.8: return "CRITICAL"
    if score >= 0.6: return "HIGH"
    if score >= 0.35: return "MEDIUM"
    return "LOW"

# ---------------------------------------------------------------------------
# ENDPOINT 1: Burnout Prediction (V2)
# ---------------------------------------------------------------------------
class BurnoutRequest(BaseModel):
    age: int = 20
    gender: str = "Female"
    academic_stress: int = 3
    anxiety: int = 2
    depression: int = 2
    general_stress: int = 3
    sleep_quality: float = 2.0
    behavioral_activity: float = 2.0
    social_interaction: float = 2.0

@app.post("/predict/burnout")
def predict_burnout(req: BurnoutRequest):
    if not models['burnout'] or not meta['burnout_features']:
        raise HTTPException(status_code=503, detail="Burnout V2 model not loaded.")

    g_enc = 1 if req.gender.lower() == 'male' else 0 if req.gender.lower() == 'female' else 2

    # Match exact features trained: 'Age', 'Gender_enc', 'Academic_Stress_Score', 'Anxiety_Score', 
    # 'Depression_Score', 'Stress_Score', 'Sleep_Quality_Index', 'Behavioral_Activity_Level', 'Social_Interaction_Frequency'
    df = pd.DataFrame([{
        'Age': req.age,
        'Gender_enc': g_enc,
        'Academic_Stress_Score': req.academic_stress,
        'Anxiety_Score': req.anxiety,
        'Depression_Score': req.depression,
        'Stress_Score': req.general_stress,
        'Sleep_Quality_Index': req.sleep_quality,
        'Behavioral_Activity_Level': req.behavioral_activity,
        'Social_Interaction_Frequency': req.social_interaction
    }], columns=meta['burnout_features'])

    proba = models['burnout'].predict_proba(df)[0]
    
    # 0=Low, 1=Mild, 2=Moderate, 3=High. Compute risk_score dynamically:
    risk_score = (proba[1]*0.33 + proba[2]*0.66 + proba[3]*1.0)
    risk_percentage = round(risk_score * 100, 2)

    return {
        "burnoutRiskScore": risk_percentage,
        "riskLevel": _risk_level(risk_score),
        "confidence": round(float(max(proba)), 4),
        "modelVersion": "burnout-v2-gb"
    }

# ---------------------------------------------------------------------------
# ENDPOINT 2: Vision Analysis
# ---------------------------------------------------------------------------
class VisionRequest(BaseModel):
    emotion: str = "Neutral"  # Happy, Sad, Fear, Angry, Neutral
    confidence: float = 0.8
    faceDetectedRatio: float = 0.9

@app.post("/analyze/vision")
def analyze_vision(req: VisionRequest):
    """Real ML-based vision analysis mapping facial emotion to risk state"""
    if not models['vision']:
        raise HTTPException(status_code=503, detail="Vision model not loaded.")

    df = pd.DataFrame([{
        'Facial_Emotion_Label': req.emotion.capitalize(),
        'Facial_Emotion_Confidence': req.confidence
    }])

    proba = models['vision'].predict_proba(df)[0]
    risk_score = (proba[1]*0.33 + proba[2]*0.66 + proba[3]*1.0)
    
    # Penalize confidence if face tracking was poor
    overall_confidence = round(float(max(proba)) * req.faceDetectedRatio, 4)

    return {
        "riskScore": round(risk_score, 4),
        "riskLevel": _risk_level(risk_score),
        "confidence": overall_confidence,
        "emotion": req.emotion.capitalize(),
        "modelVersion": "vision-rf-v1"
    }

# ---------------------------------------------------------------------------
# ENDPOINT 3: Text Sentiment (NEW)
# ---------------------------------------------------------------------------
class TextRequest(BaseModel):
    statement: str

@app.post("/analyze/text-local")
def analyze_text(req: TextRequest):
    """Fast local TF-IDF + Logistic Regression triage"""
    if not models['text'] or not meta['text_labels']:
        raise HTTPException(status_code=503, detail="Text sentiment model not loaded.")

    proba = models['text'].predict_proba([req.statement])[0]
    pred_class = models['text'].predict([req.statement])[0]
    
    risk_class_str = meta['text_labels'].get(pred_class, "LOW")
    
    # Score mapping: LOW=0.2, MEDIUM=0.5, HIGH=0.8, CRITICAL=0.95
    score_map = {"LOW": 0.2, "MEDIUM": 0.5, "HIGH": 0.8, "CRITICAL": 0.95}
    risk_score = score_map.get(risk_class_str, 0.2)

    return {
        "riskScore": risk_score,
        "riskLevel": risk_class_str,
        "confidence": round(float(max(proba)), 4),
        "modelVersion": "text-tfidf-lr-v1"
    }

# ---------------------------------------------------------------------------
# ENDPOINT 4: Mood Trend (NEW)
# ---------------------------------------------------------------------------
class MoodTrendRequest(BaseModel):
    mood_avg_7d: float
    mood_min_7d: float
    mood_max_7d: float
    bad_days_7d: int
    good_days_7d: int
    mood_slope: float
    mood_std_7d: float
    activity_avg_7d: float
    weekday_num: int
    is_weekend: int

@app.post("/analyze/mood-trend")
def analyze_mood(req: MoodTrendRequest):
    """Predicts if tomorrow is a high-risk burnout day based on 7-day trend"""
    if not models['mood'] or not meta['mood_features']:
        raise HTTPException(status_code=503, detail="Mood trend model not loaded.")

    df = pd.DataFrame([req.dict()], columns=meta['mood_features'])
    
    proba = models['mood'].predict_proba(df)[0]
    
    # Target 1 = Risk (Bad/Awful tomorrow)
    risk_score = float(proba[1])

    return {
        "riskScore": round(risk_score, 4),
        "riskLevel": _risk_level(risk_score),
        "confidence": round(float(max(proba)), 4),
        "modelVersion": "mood-trend-gb-v1"
    }

# ---------------------------------------------------------------------------
# KEEP FASTAPI VOICE ENDPOINT (Still heuristic-based for now)
# ---------------------------------------------------------------------------
class VoiceRequest(BaseModel):
    speechRate: float = 130.0
    pauseRatio: float = 0.15
    pitchVariance: float = 0.3
    durationSec: float = 5.0
    snr: float = 15.0
    energyLevel: Optional[float] = 0.5

@app.post("/analyze/voice")
def analyze_voice(req: VoiceRequest):
    if req.speechRate > 180: pace_stress = 0.30
    elif req.speechRate < 80: pace_stress = 0.35
    elif 80 <= req.speechRate < 110: pace_stress = 0.18
    else: pace_stress = 0.08

    if req.pauseRatio > 0.50: pause_stress = 0.35
    elif req.pauseRatio > 0.35: pause_stress = 0.22
    elif req.pauseRatio > 0.20: pause_stress = 0.10
    else: pause_stress = 0.05

    if req.pitchVariance > 0.75: pitch_stress = 0.25
    elif req.pitchVariance < 0.10: pitch_stress = 0.30
    elif req.pitchVariance > 0.50: pitch_stress = 0.15
    else: pitch_stress = 0.05

    energy_stress = max(0.0, (1.0 - (req.energyLevel or 0.5)) * 0.20)
    risk_score = max(0.0, min(1.0, pace_stress + pause_stress + pitch_stress + energy_stress))
    
    confidence = round(min(max(0.2, min(0.95, (req.snr+20)/45.0)), max(0.2, min(0.95, req.durationSec/20.0))), 4)

    return {
        "riskScore": round(risk_score, 4),
        "riskLevel": _risk_level(risk_score),
        "confidence": confidence,
        "modelVersion": "voice-prosodic-v2"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
