# MindCare — Complete ML Pipeline Documentation

> **Last Updated:** April 2026  
> **Pipeline Version:** `fusion-v3-full-ml`  
> **Status:** ✅ All 4 models trained & deployed

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Model 1 — Burnout V2 (Gradient Boosting)](#3-model-1--burnout-v2)
4. [Model 2 — Text Sentiment (TF-IDF + Logistic Regression)](#4-model-2--text-sentiment)
5. [Model 3 — Vision / Micro-expression (Random Forest)](#5-model-3--vision--micro-expression)
6. [Model 4 — Mood Trend (Gradient Boosting)](#6-model-4--mood-trend)
7. [Voice Analysis (Heuristic Engine)](#7-voice-analysis-heuristic-engine)
8. [Fusion Engine](#8-fusion-engine)
9. [End-to-End Assessment Flow](#9-end-to-end-assessment-flow)
10. [FastAPI Server Endpoints](#10-fastapi-server-endpoints)
11. [Node.js Backend Services](#11-nodejs-backend-services)
12. [Risk Scoring Reference](#12-risk-scoring-reference)
13. [File Map](#13-file-map)
14. [How to Run](#14-how-to-run)

---

## 1. System Overview

MindCare uses a **multi-modal AI pipeline** that combines three live data streams — written text, voice, and facial expression — into a single fused mental health risk assessment. The system is built across three layers:

| Layer | Technology | Responsibility |
|---|---|---|
| **Mobile App** | React Native | Collects text, voice, and camera input from the user |
| **Node.js Backend** | Express.js | Orchestrates session state, routes modality data to ML services |
| **Python ML Server** | FastAPI + scikit-learn | Runs 4 trained `.pkl` models and returns risk scores |

Every daily login triggers a full **Multidimensional Intake Session** that gathers all three modalities, scores them independently, then fuses them into one report.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    REACT NATIVE APP (Mobile)                    │
│                                                                 │
│  Step 0: Consent  →  Step 1: Text  →  Step 2: Voice            │
│                                    →  Step 3: Camera (Live)     │
│                                       └── ML Kit Face Detection │
│                                    →  Step 4: Fusion Report     │
└────────────────────┬────────────────────────────────────────────┘
                     │  HTTP (JWT Auth)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│               NODE.JS BACKEND (Express / MongoDB)               │
│                                                                 │
│  POST /api/aiIntake/session/start                               │
│  POST /api/aiIntake/session/:id/text-response                   │
│  POST /api/aiIntake/session/:id/voice-response                  │
│  POST /api/aiIntake/session/:id/vision-meta                     │
│  POST /api/aiIntake/session/:id/fusion/run                      │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────────────┐     │
│  │ textAssessmentService│  │ visionAssessmentService      │     │
│  │ voiceAssessmentService│  │ fusionAssessmentService      │     │
│  └──────────┬───────────┘  └────────────┬─────────────────┘     │
└─────────────┼────────────────────────────┼─────────────────────┘
              │  HTTP (localhost:8000)      │
              ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               PYTHON FASTAPI ML SERVER (port 8000)              │
│                                                                 │
│  /analyze/text-local  →  [text_classifier.pkl]   TF-IDF + LR   │
│  /analyze/voice       →  [Heuristic prosodic engine]            │
│  /analyze/vision      →  [vision_model.pkl]      RF Classifier  │
│  /predict/burnout     →  [burnout_model_v2.pkl]  GBC            │
│  /analyze/mood-trend  →  [mood_trend_model.pkl]  GBC            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Model 1 — Burnout V2

| Property | Value |
|---|---|
| **File** | `ml/burnout_model_v2.pkl` |
| **Training Script** | `ml/train_burnout_v2.py` |
| **Dataset** | `dataset/EPAT_mental_health_dataset.csv` |
| **Algorithm** | Gradient Boosting Classifier |
| **Task** | Multi-class classification (0=Low, 1=Mild, 2=Moderate, 3=High burnout) |
| **API Endpoint** | `POST /predict/burnout` |

### Input Features (9 features)

```python
FEATURE_COLS = [
    'Age',
    'Gender_enc',               # Male=1, Female=0, Other=2
    'Academic_Stress_Score',
    'Anxiety_Score',
    'Depression_Score',
    'Stress_Score',
    'Sleep_Quality_Index',
    'Behavioral_Activity_Level',
    'Social_Interaction_Frequency'
]
```

### Model Hyperparameters

```python
GradientBoostingClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.08,
    subsample=0.85,
    random_state=42
)
```

### Risk Score Formula

```
risk_score = (proba[Mild]*0.33) + (proba[Moderate]*0.66) + (proba[High]*1.0)
```

### Sample API Request / Response

```json
// POST /predict/burnout
{
  "age": 21,
  "gender": "Female",
  "academic_stress": 4,
  "anxiety": 3,
  "depression": 2,
  "general_stress": 4,
  "sleep_quality": 1.5,
  "behavioral_activity": 1.0,
  "social_interaction": 1.5
}

// Response
{
  "burnoutRiskScore": 67.4,
  "riskLevel": "HIGH",
  "confidence": 0.7812,
  "modelVersion": "burnout-v2-gb"
}
```

---

## 4. Model 2 — Text Sentiment

| Property | Value |
|---|---|
| **File** | `ml/text_classifier.pkl` + `ml/text_risk_labels.pkl` |
| **Training Script** | `ml/train_text_sentiment.py` |
| **Dataset** | `dataset/Sentiment_Mental_health_dataset.csv` (~24 MB, 7 Reddit categories) |
| **Algorithm** | TF-IDF Vectorizer → Logistic Regression (sklearn Pipeline) |
| **Task** | Multi-class text classification (4 risk levels) |
| **API Endpoint** | `POST /analyze/text-local` |

### Category Mapping (7 Reddit → 4 Risk Levels)

```
Normal               → 0 (LOW)
Stress, Anxiety      → 1 (MEDIUM)
Depression, Bipolar,
Personality Disorder → 2 (HIGH)
Suicidal             → 3 (CRITICAL)
```

### TF-IDF Configuration

```python
TfidfVectorizer(
    max_features=40000,
    ngram_range=(1, 2),   # unigrams + bigrams
    sublinear_tf=True,    # log TF damping
    min_df=3,
    stop_words='english'
)
```

### Critical Term Override

The Node.js service applies an **automatic CRITICAL override** on top of the ML prediction if any explicit crisis keywords are detected:

```javascript
const CRITICAL_TERMS = [
  'suicide', 'suicidal', 'kill myself', 'end my life',
  'self-harm', 'self harm', 'want to die',
];
// Forces riskLevel = 'CRITICAL', riskScore = max(mlScore, 0.95)
```

### Sample API Request / Response

```json
// POST /analyze/text-local
{ "statement": "I feel completely overwhelmed and can't stop crying at night." }

// Response
{
  "riskScore": 0.8,
  "riskLevel": "HIGH",
  "confidence": 0.7634,
  "modelVersion": "text-tfidf-lr-v1"
}
```

---

## 5. Model 3 — Vision / Micro-expression

| Property | Value |
|---|---|
| **File** | `ml/vision_model.pkl` |
| **Training Script** | `ml/train_vision.py` |
| **Dataset** | `dataset/EPAT_mental_health_dataset.csv` (Facial_Emotion_Label column) |
| **Algorithm** | Random Forest Classifier |
| **On-Device** | `@react-native-ml-kit/face-detection` (emotion extraction from still photo) |
| **API Endpoint** | `POST /analyze/vision` |

### How Vision Works End-to-End

```
1. react-native-vision-camera   →  Captures live photo from front camera
2. @react-native-ml-kit/face-detection → Runs on-device face analysis on still image
3. Emotion mapping logic:
      smilingProbability > 0.65        → "Happy"
      eyeOpenProbability < 0.25        → "Sad"  (fatigue/low energy)
      smiling < 0.20 && eyes open > 0.6 → "Neutral"
      smiling < 0.10                   → "Fear"
4. Sends { emotion, confidence, faceDetectedRatio } to Node.js backend
5. Node.js visionAssessmentService → POST /analyze/vision on FastAPI
6. FastAPI RF model → maps emotion label + confidence to risk score
```

### FastAPI Model Features

```python
# Input to the sklearn pipeline
X = df[['Facial_Emotion_Label', 'Facial_Emotion_Confidence']]
# OHE for emotion label, passthrough for confidence float
```

### Sample API Request / Response

```json
// POST /analyze/vision
{ "emotion": "Sad", "confidence": 0.82, "faceDetectedRatio": 1.0 }

// Response
{
  "riskScore": 0.62,
  "riskLevel": "HIGH",
  "confidence": 0.7048,
  "emotion": "Sad",
  "modelVersion": "vision-rf-v1"
}
```

---

## 6. Model 4 — Mood Trend

| Property | Value |
|---|---|
| **File** | `ml/mood_trend_model.pkl` + `ml/mood_trend_features.pkl` |
| **Training Script** | `ml/train_mood_trend.py` |
| **Dataset** | `dataset/Daylio_Abid.csv` (941 daily entries, ~3 years personal tracker) |
| **Algorithm** | Gradient Boosting Classifier |
| **Task** | Binary prediction — will **tomorrow** be a Bad/Awful mood day? |
| **API Endpoint** | `POST /analyze/mood-trend` |

### Feature Engineering (Rolling 7-Day Window)

```python
FEATURE_COLS = [
    'mood_avg_7d',       # 7-day average mood score
    'mood_min_7d',       # worst day in the window
    'mood_max_7d',       # best day in the window
    'bad_days_7d',       # count of Bad/Awful days
    'good_days_7d',      # count of Amazing/Good days
    'mood_slope',        # linear trend (negative = worsening)
    'mood_std_7d',       # mood volatility / instability
    'activity_avg_7d',   # behavioral engagement proxy
    'weekday_num',       # 0=Monday … 6=Sunday
    'is_weekend'         # binary flag
]
```

### Mood Score Mapping

```
Amazing → 1.00    Good → 0.75    Normal → 0.50
Bad     → 0.25    Awful → 0.00
```

### Sample API Request / Response

```json
// POST /analyze/mood-trend
{
  "mood_avg_7d": 0.35,
  "mood_min_7d": 0.00,
  "mood_max_7d": 0.50,
  "bad_days_7d": 3,
  "good_days_7d": 1,
  "mood_slope": -0.05,
  "mood_std_7d": 0.18,
  "activity_avg_7d": 1.2,
  "weekday_num": 0,
  "is_weekend": 0
}

// Response
{
  "riskScore": 0.74,
  "riskLevel": "HIGH",
  "confidence": 0.8120,
  "modelVersion": "mood-trend-gb-v1"
}
```

> **Note:** The Mood Trend model is available as a standalone endpoint but is **not yet wired into the daily intake session**. It is intended for the Home screen's weekly mood chart analytics.

---

## 7. Voice Analysis (Heuristic Engine)

The voice modality currently uses a **prosodic heuristic engine** (not a trained .pkl model). It analyses acoustic features from the voice recording.

| Property | Value |
|---|---|
| **API Endpoint** | `POST /analyze/voice` |
| **Type** | Rule-based heuristic (no training required) |
| **Inputs** | speechRate, pauseRatio, pitchVariance, durationSec, snr, energyLevel |

### Risk Scoring Logic

```python
# Speech pace stress
if speechRate > 180: pace_stress = 0.30  # racing thoughts
elif speechRate < 80: pace_stress = 0.35  # psychomotor slowing
else: pace_stress = 0.08                  # normal range

# Pause ratio stress
if pauseRatio > 0.50: pause_stress = 0.35
elif pauseRatio > 0.35: pause_stress = 0.22
else: pause_stress = 0.05

# Pitch flatness stress
if pitchVariance < 0.10: pitch_stress = 0.30  # flat affect
elif pitchVariance > 0.75: pitch_stress = 0.25
else: pitch_stress = 0.05

risk_score = pace_stress + pause_stress + pitch_stress + energy_stress
confidence = min(snrNorm, durationNorm)
```

> **Current Limitation:** Voice in the React Native app is currently **simulated** — it sends fixed default values. Real audio capture via `react-native-audio-recorder-player` is the planned next upgrade.

---

## 8. Fusion Engine

The fusion engine lives entirely in **Node.js** (`backend/services/ai/fusionAssessmentService.js`). It is a **weighted linear combination** of the three modality scores.

### Weights

```javascript
const wText   = 0.45;  // Richest semantic signal
const wVoice  = 0.30;  // Prosodic / acoustic signal
const wVision = 0.25;  // Micro-expression signal
```

### Fusion Formula

```javascript
riskScore  = (text.riskScore  * 0.45)
           + (voice.riskScore * 0.30)
           + (vision.riskScore * 0.25)

confidence = (text.confidence  * 0.45)
           + (voice.confidence * 0.30)
           + (vision.confidence * 0.25)
```

### Contradiction Detection

```javascript
// Flags cross-modal inconsistencies (e.g., user says calm but face shows Fear)
if (|text.riskScore - vision.riskScore| > 0.45)  → "text_vision_mismatch"
if (|voice.riskScore - vision.riskScore| > 0.45) → "voice_vision_mismatch"
```

### Recommendations by Risk Level

| Risk Level | Recommendations |
|---|---|
| **CRITICAL** | Open emergency resources, connect to a counselor immediately |
| **HIGH** | Guided breathing, schedule therapist within 24-48 hours |
| **MEDIUM** | 10-min mindfulness, journal stress triggers |
| **LOW** | Light self-care, track mood consistency over the week |

---

## 9. End-to-End Assessment Flow

```
USER OPENS APP (daily login)
        │
        ▼
[React Native] Checks AsyncStorage for MindCare_dismissedCheckInDate
        │ Not today → show intake
        ▼
STEP 0 — Consent Screen
  POST /api/aiIntake/session/start
  ← Returns { sessionId, questions: { textPrompts[8], voicePrompts } }
  (8 random questions drawn from a pool of 20 each session)
        │
        ▼
STEP 1 — Written Assessment
  User selects mood tag (calm/anxious/sad/…)
  User answers 8 text prompts
  POST /api/aiIntake/session/:id/text-response
    → Node.js textAssessmentService
      → FastAPI POST /analyze/text-local   (TF-IDF + LR)
      ← { riskScore, riskLevel, confidence }   [+ critical keyword override]
        │
        ▼
STEP 2 — Vocal Analysis
  User reads aloud the displayed sentence
  POST /api/aiIntake/session/:id/voice-response
    → Node.js voiceAssessmentService
      → FastAPI POST /analyze/voice   (Heuristic prosodic engine)
      ← { riskScore, riskLevel, confidence }
        │
        ▼
STEP 3 — Micro-expression Scan
  react-native-vision-camera → live front-camera feed displayed
  User taps "Capture Expression" → still photo taken
  @react-native-ml-kit/face-detection → on-device face analysis
    { smilingProbability, leftEyeOpenProbability, rightEyeOpenProbability }
    → mapped to emotion label: Happy / Sad / Fear / Neutral
  4-second auto-submit timer starts (or user taps "Analyze Now")
  POST /api/aiIntake/session/:id/vision-meta
    { visionRef, emotion, confidence, faceDetectedRatio }
    → Node.js visionAssessmentService
      → FastAPI POST /analyze/vision   (Random Forest)
      ← { riskScore, riskLevel, confidence }
        │
        ▼
STEP 4 — Fusion & Report
  POST /api/aiIntake/session/:id/fusion/run
    → Node.js fusionAssessmentService
      riskScore  = text(45%) + voice(30%) + vision(25%)
      confidence = weighted average
      contradictionFlags = cross-modal gap detection
      recommendations = level-based guidance
    ← { riskLevel, riskScore, confidence, contradictionFlags, recommendations }
  AsyncStorage.setItem('MindCare_dismissedCheckInDate', today)
  Navigate to Home  [or Safety screen if CRITICAL]
```

---

## 10. FastAPI Server Endpoints

| Method | Endpoint | Model | Description |
|---|---|---|---|
| GET | `/health` | — | Returns status of all 4 loaded models |
| POST | `/predict/burnout` | `burnout_model_v2.pkl` | Burnout risk from 9 psychometric features |
| POST | `/analyze/text-local` | `text_classifier.pkl` | NLP risk classification from free text |
| POST | `/analyze/vision` | `vision_model.pkl` | Risk level from facial emotion label + confidence |
| POST | `/analyze/voice` | Heuristic | Risk from speech prosody features |
| POST | `/analyze/mood-trend` | `mood_trend_model.pkl` | Tomorrow's burnout risk from 7-day mood history |

### Health Check Response

```json
GET /health
{
  "status": "ok",
  "models_loaded": {
    "burnout": true,
    "vision": true,
    "text": true,
    "mood": true
  },
  "version": "3.0.0"
}
```

---

## 11. Node.js Backend Services

### Service Architecture

```
backend/services/ai/
├── textAssessmentService.js    — Calls /analyze/text-local, heuristic fallback
├── voiceAssessmentService.js   — Calls /analyze/voice, heuristic fallback
├── visionAssessmentService.js  — Calls /analyze/vision, heuristic fallback
├── fusionAssessmentService.js  — Pure JS weighted fusion (no HTTP call)
├── questionPolicyService.js    — Random 8-of-20 question selection per session
└── geminiAiService.js          — Gemini AI integration (chat/supplementary)
```

### Fallback Strategy

Every ML service has a **dual-path** design:

```
Primary Path:   axios.post(ML_SERVER/endpoint, payload, { timeout: 5000 })
                ↓ on ECONNREFUSED / timeout / 5xx
Fallback Path:  Local heuristic function (runs in Node.js, no Python needed)
```

This means the intake flow **never crashes** even if the Python server is down — it degrades gracefully to the rule-based fallback.

---

## 12. Risk Scoring Reference

### Risk Level Thresholds (used by all models + fusion)

```
score >= 0.80  →  CRITICAL  🔴  Emergency resources triggered
score >= 0.60  →  HIGH      🟠  Therapist scheduling recommended
score >= 0.35  →  MEDIUM    🟡  Mindfulness + journaling
score <  0.35  →  LOW       🟢  Healthy routine maintenance
```

### Score Mapping for Text Model

```
LOW      → 0.20
MEDIUM   → 0.50
HIGH     → 0.80
CRITICAL → 0.95
```

---

## 13. File Map

```
MentalHealthApp/
│
├── ml/                                 ← Python ML Server
│   ├── server.py                       ← FastAPI app (all 5 endpoints)
│   ├── burnout_model_v2.pkl            ← Gradient Boosting (burnout)
│   ├── burnout_v2_features.pkl         ← Feature column name list
│   ├── text_classifier.pkl             ← TF-IDF + LR Pipeline
│   ├── text_risk_labels.pkl            ← {0:'LOW', 1:'MEDIUM', ...}
│   ├── vision_model.pkl                ← Random Forest (vision)
│   ├── mood_trend_model.pkl            ← Gradient Boosting (mood)
│   ├── mood_trend_features.pkl         ← Feature column name list
│   ├── train_burnout_v2.py
│   ├── train_text_sentiment.py
│   ├── train_vision.py
│   ├── train_mood_trend.py
│   └── requirements.txt
│
├── backend/
│   ├── routes/
│   │   └── aiIntake.js                 ← Session lifecycle API routes
│   └── services/ai/
│       ├── textAssessmentService.js
│       ├── voiceAssessmentService.js
│       ├── visionAssessmentService.js
│       ├── fusionAssessmentService.js
│       ├── questionPolicyService.js
│       └── geminiAiService.js
│
├── src/screens/
│   └── MultidimensionalIntakeScreen.js ← Full 4-step intake UI
│
├── dataset/
│   ├── EPAT_mental_health_dataset.csv  ← Burnout V2 + Vision training data
│   ├── Sentiment_Mental_health_dataset.csv ← Text model training data (24 MB)
│   └── Daylio_Abid.csv                 ← Mood trend training data (941 entries)
│
└── android/app/src/main/AndroidManifest.xml
    ← CAMERA + INTERNET permissions declared
```

---

## 14. How to Run

### Start the Python ML Server

```bash
cd c:\Projects\MentalHealthApp\ml
pip install -r requirements.txt
python server.py
# Server runs at http://127.0.0.1:8000
# Visit http://127.0.0.1:8000/docs for interactive Swagger UI
```

### Start the Node.js Backend

```bash
cd c:\Projects\MentalHealthApp\backend
npm install
npm start
# Server runs at http://localhost:5000
```

### Build & Run the Android App

```bash
cd c:\Projects\MentalHealthApp

# First time (or after adding native libraries):
npx react-native run-android

# Subsequent hot-reload sessions:
npx react-native start
```

### Retrain Any Model

```bash
cd c:\Projects\MentalHealthApp\ml

python train_burnout_v2.py        # Retrains burnout_model_v2.pkl
python train_text_sentiment.py    # Retrains text_classifier.pkl
python train_vision.py            # Retrains vision_model.pkl
python train_mood_trend.py        # Retrains mood_trend_model.pkl
```

> **Note:** After retraining, restart `python server.py` to hot-reload the new `.pkl` files. No code changes needed.

---

*Generated from source code analysis of MindCare v0.0.1 — muskan-424/MindCare-App*
