"""Start the ML server and check every model loads and every endpoint answers.

Payloads mirror what the backend sends (backend/src/domains/assessment/services/ai
and backend/src/domains/therapy/services/burnoutPredictionService.js).
Standard library only; run from anywhere: python ml/smoke_test.py
To check an already-running deployment instead: python ml/smoke_test.py https://your-ml-server.onrender.com
"""
import json
import os
import subprocess
import sys
import time
import urllib.request

PORT = int(os.environ.get("SMOKE_PORT", "8765"))
BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else f"http://127.0.0.1:{PORT}"
LEVELS = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
failures = []


def call(path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as res:  # free Render instances take ~1 min to wake
        return json.loads(res.read())


def check(name, condition, detail=""):
    print(f"[{'PASS' if condition else 'FAIL'}] {name}{' - ' + str(detail) if detail else ''}")
    if not condition:
        failures.append(name)


def check_result(name, result, score_key="riskScore", model_prefix=None, score_max=1.0):
    score = result.get(score_key)
    check(f"{name}: score in range", isinstance(score, (int, float)) and 0 <= score <= score_max, result)
    check(f"{name}: risk level", result.get("riskLevel") in LEVELS, result.get("riskLevel"))
    check(f"{name}: confidence in range", 0 <= result.get("confidence", -1) <= 1, result.get("confidence"))
    if model_prefix:
        check(f"{name}: served by trained model", str(result.get("modelVersion", "")).startswith(model_prefix), result.get("modelVersion"))
    return score


def run_checks():
    health = call("/health")
    loaded = health.get("models_loaded", {})
    check("health: all 5 models loaded", len(loaded) == 5 and all(loaded.values()), loaded)

    calm = {"age": 22, "gender": "Female", "academic_stress": 1, "anxiety": 1, "depression": 1,
            "general_stress": 1, "sleep_quality": 4.0, "behavioral_activity": 4.0, "social_interaction": 4.0}
    strained = {**calm, "academic_stress": 5, "anxiety": 5, "depression": 5, "general_stress": 5,
                "sleep_quality": 1.0, "behavioral_activity": 1.0, "social_interaction": 1.0}
    low = check_result("burnout (calm)", call("/predict/burnout", calm), "burnoutRiskScore", "burnout-v2", 100)
    high = check_result("burnout (strained)", call("/predict/burnout", strained), "burnoutRiskScore", "burnout-v2", 100)
    check("burnout: strained profile scores higher than calm", high > low, f"{low} -> {high}")

    happy = check_result("vision (happy)", call("/analyze/vision", {"emotion": "happy", "confidence": 0.9, "faceDetectedRatio": 0.9}), model_prefix="vision-rf")
    sad = check_result("vision (sad)", call("/analyze/vision", {"emotion": "sad", "confidence": 0.9, "faceDetectedRatio": 0.9}), model_prefix="vision-rf")
    check("vision: sad scores higher than happy", sad > happy, f"{happy} -> {sad}")

    fine = check_result("text (positive)", call("/analyze/text-local", {"statement": "I had a great day with friends and feel relaxed and happy."}), model_prefix="text-tfidf")
    crisis = check_result("text (crisis)", call("/analyze/text-local", {"statement": "I feel hopeless and worthless, I want to end my life and can't go on."}), model_prefix="text-tfidf")
    check("text: crisis statement scores higher than positive", crisis > fine, f"{fine} -> {crisis}")

    check_result("voice", call("/analyze/voice", {"speechRate": 130, "pauseRatio": 0.15, "pitchVariance": 0.3,
                                                   "durationSec": 5, "snr": 15, "energyLevel": 0.5}), model_prefix="voice-gbc")

    steady = {"mood_avg_7d": 0.8, "mood_min_7d": 0.7, "mood_max_7d": 0.9, "bad_days_7d": 0, "good_days_7d": 6,
              "mood_slope": 0.01, "mood_std_7d": 0.05, "activity_avg_7d": 8, "weekday_num": 2, "is_weekend": 0}
    falling = {"mood_avg_7d": 0.25, "mood_min_7d": 0.0, "mood_max_7d": 0.6, "bad_days_7d": 5, "good_days_7d": 0,
               "mood_slope": -0.1, "mood_std_7d": 0.2, "activity_avg_7d": 1, "weekday_num": 2, "is_weekend": 0}
    up = check_result("mood trend (steady)", call("/analyze/mood-trend", steady), model_prefix="mood-trend")
    down = check_result("mood trend (falling)", call("/analyze/mood-trend", falling), model_prefix="mood-trend")
    check("mood trend: falling week scores higher than steady", down > up, f"{up} -> {down}")


def summary():
    print()
    print(f"{len(failures)} failure(s)" if failures else "All ML smoke checks passed")
    return 1 if failures else 0


def main():
    if len(sys.argv) > 1:
        run_checks()
        return summary()

    here = os.path.dirname(os.path.abspath(__file__))
    server = subprocess.Popen([sys.executable, "-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", str(PORT)], cwd=here)
    try:
        deadline = time.time() + 120
        while True:
            try:
                call("/health")
                break
            except Exception:
                if server.poll() is not None or time.time() > deadline:
                    print("ML server failed to start")
                    return 1
                time.sleep(1)
        run_checks()
    finally:
        server.terminate()
        server.wait(timeout=30)
    return summary()


if __name__ == "__main__":
    sys.exit(main())
