from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import joblib
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
        try:
            return joblib.load(path)
        except Exception as e:
            print(f"[ERROR] Failed to load {filename}: {e}")
            return None
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

    # 3. Text Sentiment
    models['text'] = load_pkl('text_classifier.pkl')
    meta['text_labels'] = load_pkl('text_risk_labels.pkl')
    if models['text']: print("[OK] Loaded Text Sentiment Model")

    # 4. Mood Trend
    models['mood'] = load_pkl('mood_trend_model.pkl')
    meta['mood_features'] = load_pkl('mood_trend_features.pkl')
    if models['mood']: print("[OK] Loaded Mood Trend Model")

    # 5. Voice (NEW)
    models['voice'] = load_pkl('voice_model.pkl')
    meta['voice_features'] = load_pkl('voice_features.pkl')
    if models['voice']: print("[OK] Loaded Voice Model (CREMA-D)")

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
    """Answers from the app's wellbeing check-in (backend wellbeingCheckInService).

    anxiety = GAD-2 and depression = PHQ-2 (0-6 each); the rest are 1-5 self-ratings.
    Out-of-range values are rejected: the model was silently fed 1-5 values for
    features trained on 0-40 ranges before, which made every prediction look alike.
    """
    age: int = Field(20, ge=10, le=100)
    gender: str = "Female"
    anxiety: int = Field(2, ge=0, le=6)
    depression: int = Field(2, ge=0, le=6)
    general_stress: int = Field(3, ge=1, le=5)
    academic_stress: int = Field(3, ge=1, le=5)
    sleep_quality: float = Field(3, ge=1, le=5)
    behavioral_activity: float = Field(3, ge=1, le=5)
    social_interaction: float = Field(3, ge=1, le=5)


def _rescale(value, from_min, from_max, to_min, to_max):
    return to_min + (value - from_min) * (to_max - to_min) / (from_max - from_min)


@app.post("/predict/burnout")
def predict_burnout(req: BurnoutRequest):
    if not models['burnout'] or not meta['burnout_features']:
        raise HTTPException(status_code=503, detail="Burnout V2 model not loaded.")

    g_enc = 1 if req.gender.lower() == 'male' else 0 if req.gender.lower() == 'female' else 2

    # Map check-in scales onto the EPAT training ranges: symptom/stress scores 0-40,
    # sleep quality index 1-10, activity level 3-99, social interaction frequency 0-20.
    df = pd.DataFrame([{
        'Age': req.age,
        'Gender_enc': g_enc,
        'Academic_Stress_Score': _rescale(req.academic_stress, 1, 5, 0, 40),
        'Anxiety_Score': _rescale(req.anxiety, 0, 6, 0, 40),
        'Depression_Score': _rescale(req.depression, 0, 6, 0, 40),
        'Stress_Score': _rescale(req.general_stress, 1, 5, 0, 40),
        'Sleep_Quality_Index': _rescale(req.sleep_quality, 1, 5, 1, 10),
        'Behavioral_Activity_Level': _rescale(req.behavioral_activity, 1, 5, 3, 99),
        'Social_Interaction_Frequency': _rescale(req.social_interaction, 1, 5, 0, 20),
    }], columns=meta['burnout_features'])

    proba = models['burnout'].predict_proba(df)[0]
    
    # 0=Low, 1=Mild, 2=Moderate, 3=High. Compute risk_score dynamically:
    risk_score = (proba[1]*0.33 + proba[2]*0.66 + proba[3]*1.0)
    risk_percentage = round(risk_score * 100, 2)

    return {
        "burnoutRiskScore": risk_percentage,
        "riskLevel": _risk_level(risk_score),
        "confidence": round(float(max(proba)), 4),
        "modelVersion": "burnout-v2-gb-checkin"
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
    # Try using the ML model first
    if models.get('voice') and meta.get('voice_features'):
        try:
            # Match features: ['speechRate', 'pauseRatio', 'pitchVariance', 'durationSec', 'snr', 'energyLevel']
            df = pd.DataFrame([{
                'speechRate': req.speechRate,
                'pauseRatio': req.pauseRatio,
                'pitchVariance': req.pitchVariance,
                'durationSec': req.durationSec,
                'snr': req.snr,
                'energyLevel': req.energyLevel if req.energyLevel is not None else 0.5
            }], columns=meta['voice_features'])
            
            proba = models['voice'].predict_proba(df)[0]
            
            # Predict Risk Score: (proba[1]*0.5 + proba[2]*1.0)
            # Map: 0=LOW, 1=MEDIUM, 2=HIGH
            risk_score = float(proba[1] * 0.5 + proba[2] * 1.0)
            confidence = round(float(max(proba)), 4)
            
            return {
                "riskScore": round(risk_score, 4),
                "riskLevel": _risk_level(risk_score),
                "confidence": confidence,
                "modelVersion": "voice-gbc-v3-cremad"
            }
        except Exception as e:
            print(f"[ERROR] Voice model prediction failed: {e}")
            # Fall through to heuristic

    # Fallback: Heuristic Engine
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
        "modelVersion": "voice-heuristic-fallback"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
