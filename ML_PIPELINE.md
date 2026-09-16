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
│  /predict/burnout     →  [burnout_model_v2.pkl]  GBC            │
│  /analyze/mood-trend  →  [mood_trend_model.pkl]  GBC            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Model 1 — Burnout V2

| Property | Value |
|---|---|
| **File** | `ml/burnout_model_v2.pkl` (trained artifact shipped in repo) |
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

### Where the inputs come from

The app's **Wellbeing check-in** screen (`src/domains/wellness/screens/WellbeingCheckInScreen.js`) asks the 4 PHQ-4 questions and five 1–5 self-ratings. `POST /api/profile/wellbeing-checkin` (`backend/src/domains/identity/services/wellbeingCheckInService.js`) stores them on the Profile and re-runs the prediction; mood logs also re-run it. Users who have never checked in are skipped, because their profile only holds defaults.

The ML server rescales the check-in answers onto the EPAT training ranges and rejects out-of-range values (HTTP 422):

| Request field | Check-in source | Scale sent | Training feature (range) |
|---|---|---|---|
| `anxiety` | GAD-2 (PHQ-4 items 1–2) | 0–6 | `Anxiety_Score` (0–40) |
| `depression` | PHQ-2 (PHQ-4 items 3–4) | 0–6 | `Depression_Score` (0–40) |
| `general_stress` | Stress level | 1–5 | `Stress_Score` (0–40) |
| `academic_stress` | Study/work pressure | 1–5 | `Academic_Stress_Score` (0–40) |
| `sleep_quality` | Sleep quality | 1–5 | `Sleep_Quality_Index` (1–10) |
| `behavioral_activity` | Physical activity | 1–5 | `Behavioral_Activity_Level` (3–99) |
| `social_interaction` | Time with others | 1–5 | `Social_Interaction_Frequency` (0–20) |

Before this mapping existed, 1–5 values were fed straight into 0–40 features and the profile lookup used a non-existent field, so every user received nearly the same score.

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
  "anxiety": 5,
  "depression": 4,
  "general_stress": 4,
  "academic_stress": 5,
  "sleep_quality": 2,
  "behavioral_activity": 1,
  "social_interaction": 2
}

// Response (illustrative values; CI measured 32.6% for an all-calm check-in and 100% for an all-strained one)
{
  "burnoutRiskScore": 91.2,
  "riskLevel": "CRITICAL",
  "confidence": 0.93,
  "modelVersion": "burnout-v2-gb-checkin"
}
```

A score of 70% or more files a `burnout_alert` issue report for admins (at most once every two days per user).

---

## 4. Model 2 — Text Sentiment

| Property | Value |
|---|---|
| **File** | `ml/text_classifier.pkl` + `ml/text_risk_labels.pkl` (trained artifacts shipped in repo) |
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

## 5. Vision — Facial Emotion (Transparent Rule)

| Property | Value |
|---|---|
| **Implementation** | `backend/src/domains/assessment/services/ai/visionAssessmentService.js` (no ML server call) |
| **On-Device** | `@react-native-ml-kit/face-detection` (emotion extraction from still photo) |
| **Model version** | `vision-rules-v2` |

The earlier Random Forest (`vision_model.pkl`, trained on the EPAT `Facial_Emotion_Label` column) was removed. In that data facial emotion barely predicts mental-health status: every emotion averages 1.4–1.8 on the 0–3 status scale across 125 rows, so the model scored happy and sad faces almost identically (0.46 vs 0.49). Vision now uses a transparent rule and carries the lowest fusion weight.

### How Vision Works End-to-End

```
1. react-native-vision-camera   →  Captures live photo from front camera
2. @react-native-ml-kit/face-detection → Runs on-device face analysis on still image
3. App maps smile / eye-open probabilities to an emotion label + confidence
4. Sends { emotion, confidence, faceDetectedRatio } to Node.js backend
5. visionAssessmentService scores it locally with the rule below
```

### Scoring Rule

```javascript
EMOTION_RISK = { Happy: 0.10, Neutral: 0.25, Sad: 0.60, Fear: 0.65, Angry: 0.75 }

// Detector confidence pulls the score toward neutral, not toward zero,
// so an uncertain "Sad" reads as mildly elevated rather than calm.
riskScore  = 0.25 + (EMOTION_RISK[emotion] - 0.25) * emotionConfidence
confidence = clamp(emotionConfidence * faceDetectedRatio, 0.2, 0.95)
```

| Input | riskScore |
|---|---|
| Happy, confidence 0.9 | 0.115 (LOW) |
| Sad, confidence 0.9 | 0.565 (MEDIUM) |
| Angry, confidence 0.95 | 0.725 (HIGH) |
| Unknown / missing label | 0.25 (LOW) |

---

## 6. Model 4 — Mood Trend

| Property | Value |
|---|---|
| **File** | `ml/mood_trend_model.pkl` + `ml/mood_trend_features.pkl` (trained artifacts shipped in repo) |
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

The fusion engine lives entirely in **Node.js** (`backend/src/domains/assessment/services/ai/fusionAssessmentService.js`). It is a **weighted linear combination** of the three modality scores.

### Weights

```javascript
const wText   = 0.45;  // Real-time semantic signal (most reliable)
const wMood   = 0.25;  // Historical trend from logged moods
const wVoice  = 0.20;  // Prosodic / acoustic signal
const wVision = 0.10;  // Facial emotion (weak predictor, see section 5)
```

### Fusion Formula

```javascript
riskScore  = (text.riskScore   * 0.45)
           + (mood.riskScore   * 0.25)
           + (voice.riskScore  * 0.20)
           + (vision.riskScore * 0.10)

confidence = same weights applied to each modality's confidence
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
| GET | `/health` | — | Returns status of the 4 loaded models |
| POST | `/predict/burnout` | `burnout_model_v2.pkl` | Burnout risk from wellbeing check-in answers (rescaled to training ranges) |
| POST | `/analyze/text-local` | `text_classifier.pkl` | NLP risk classification from free text |
| POST | `/analyze/voice` | Heuristic | Risk from speech prosody features |
| POST | `/analyze/mood-trend` | `mood_trend_model.pkl` | Tomorrow's burnout risk from 7-day mood history |

### Health Check Response

```json
GET /health
{
  "status": "ok",
  "models_loaded": {
    "burnout": true,
    "text": true,
    "mood": true,
    "voice": true
  },
  "version": "3.0.0"
}
```

---

## 11. Node.js Backend Services

### Service Architecture

```
backend/src/domains/assessment/services/ai/
├── textAssessmentService.js    — Calls /analyze/text-local, heuristic fallback
├── voiceAssessmentService.js   — Calls /analyze/voice, heuristic fallback
├── visionAssessmentService.js  — Calls /analyze/vision, heuristic fallback
├── fusionAssessmentService.js  — Pure JS weighted fusion (no HTTP call)
└── questionPolicyService.js    — Random 8-of-20 question selection per session
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
│   ├── mood_trend_model.pkl            ← Gradient Boosting (mood)
│   ├── mood_trend_features.pkl         ← Feature column name list
│   └── requirements.txt
│   (Note: only the trained .pkl artifacts are shipped; the offline
│    training scripts are kept outside the repo.)
│
├── backend/src/domains/assessment/
│   ├── routes/
│   │   └── aiIntake.js                 ← Session lifecycle API routes
│   └── services/ai/
│       ├── textAssessmentService.js
│       ├── voiceAssessmentService.js
│       ├── visionAssessmentService.js
│       ├── fusionAssessmentService.js
│       └── questionPolicyService.js
│
├── src/domains/assessment/screens/
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

### Retraining

The repository ships the **pre-trained `.pkl` model artifacts** (loaded by `ml/server.py` at startup) along with the source datasets under `dataset/`. The offline training scripts that produced these artifacts are **not included in the repo**.

`ml/requirements.txt` pins the exact library versions the artifacts were trained with (scikit-learn 1.8.0); keep them in sync when retraining. `python ml/smoke_test.py` starts the server and checks every model and endpoint (CI runs it on Python 3.11, the version Render uses), and `python ml/smoke_test.py <url>` checks a deployed server. The live API reports the ML connection at `GET /api/health/ml`.

To regenerate a model, retrain it offline against the corresponding dataset (see each model's section above for algorithm + hyperparameters), drop the resulting `.pkl` into `ml/`, and restart `python server.py` to hot-reload it. No backend code changes are needed.

---

*Generated from source code analysis of MindCare v0.0.1 — muskan-424/MindCare-App*
