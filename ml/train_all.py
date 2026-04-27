"""
train_all.py — Master training runner
Runs all 4 ML model training scripts in sequence and reports results.
Usage: python train_all.py
"""
import subprocess
import sys
import os
import time

scripts = [
    ("Burnout V2 Model",      "train_burnout_v2.py"),
    ("Vision Model",           "train_vision.py"),
    ("Mood Trend Model",       "train_mood_trend.py"),
    ("Text Sentiment Model",   "train_text_sentiment.py"),  # last - largest dataset
]

base = os.path.dirname(os.path.abspath(__file__))
results = []

print("=" * 60)
print("  MindCare ML Pipeline — Full Training Run")
print("=" * 60)

for name, script in scripts:
    print(f"\n[TRAINING] {name}...")
    print("-" * 50)
    start = time.time()
    result = subprocess.run(
        [sys.executable, os.path.join(base, script)],
        capture_output=False
    )
    elapsed = time.time() - start
    status = "PASSED" if result.returncode == 0 else "FAILED"
    results.append((name, status, f"{elapsed:.1f}s"))
    print(f"--> {status} in {elapsed:.1f}s")

print("\n" + "=" * 60)
print("  Training Summary")
print("=" * 60)
for name, status, duration in results:
    icon = "[OK]" if status == "PASSED" else "[FAIL]"
    print(f"  {icon}  {name:<30}  {status}  ({duration})")

all_passed = all(s == "PASSED" for _, s, _ in results)
print("=" * 60)
if all_passed:
    print("  All models trained successfully!")
    print("  Start the server with: python server.py")
else:
    print("  Some models failed. Check output above.")
print("=" * 60)
