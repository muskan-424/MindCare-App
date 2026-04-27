"""
Mood Trend Model — Trained on Daylio Personal Mood Tracker (941 daily entries, 3 years)
Features: Rolling 7-day mood statistics, activity count, weekday
Model: Gradient Boosting — predicts burnout risk from mood trajectory
New endpoint: /analyze/mood-trend
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report
import pickle
import os

print("=" * 50)
print(" Mood Trend Model Training (Daylio Dataset)")
print("=" * 50)

df_path = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'Daylio_Abid.csv')
df = pd.read_csv(df_path)
print(f"Loaded {len(df)} entries from Daylio dataset.")

# Map mood labels to numeric [0.0 - 1.0]
MOOD_MAP = {
    'Amazing': 1.00,
    'Good':    0.75,
    'Normal':  0.50,
    'Bad':     0.25,
    'Awful':   0.00
}

df['mood_score'] = df['mood'].map(MOOD_MAP)
df['full_date'] = pd.to_datetime(df['full_date'], format='%d/%m/%Y', errors='coerce')

# Drop unmapped/invalid
df = df.dropna(subset=['mood_score', 'full_date'])
df = df.sort_values('full_date').reset_index(drop=True)

# Deduplicate — keep first entry per day
df = df.drop_duplicates(subset=['full_date'], keep='first').reset_index(drop=True)
print(f"After dedup: {len(df)} unique daily entries.")
print(f"\nMood distribution:")
print(df['mood'].value_counts())

# ---- Feature Engineering (Rolling 7-day window) ----
W = 7  # window

df['mood_avg_7d']   = df['mood_score'].rolling(W, min_periods=3).mean()
df['mood_min_7d']   = df['mood_score'].rolling(W, min_periods=3).min()
df['mood_max_7d']   = df['mood_score'].rolling(W, min_periods=3).max()
df['bad_days_7d']   = (df['mood_score'] <= 0.25).rolling(W, min_periods=3).sum()
df['good_days_7d']  = (df['mood_score'] >= 0.75).rolling(W, min_periods=3).sum()
df['mood_std_7d']   = df['mood_score'].rolling(W, min_periods=3).std().fillna(0)

# Trend slope (positive = improving, negative = worsening)
def rolling_slope(series, window):
    slopes = [np.nan] * len(series)
    for i in range(window - 1, len(series)):
        chunk = series[i - window + 1: i + 1].values
        if len(chunk) >= 2:
            slopes[i] = np.polyfit(range(len(chunk)), chunk, 1)[0]
    return pd.Series(slopes, index=series.index)

df['mood_slope'] = rolling_slope(df['mood_score'], W)

# Activity count as proxy for behavioral engagement
df['activity_count'] = df['activities'].apply(
    lambda x: len(str(x).split('|')) if pd.notna(x) and str(x).strip() else 0
)
df['activity_avg_7d'] = df['activity_count'].rolling(W, min_periods=3).mean()

# Temporal features
df['weekday_num'] = df['full_date'].dt.dayofweek  # 0=Mon, 6=Sun
df['is_weekend']  = (df['weekday_num'] >= 5).astype(int)

# ---- Target: Will next day be Bad or Awful? ----
df['next_mood'] = df['mood_score'].shift(-1)
df['is_risk_tomorrow'] = (df['next_mood'] <= 0.25).astype(int)

FEATURE_COLS = [
    'mood_avg_7d', 'mood_min_7d', 'mood_max_7d',
    'bad_days_7d', 'good_days_7d',
    'mood_slope', 'mood_std_7d',
    'activity_avg_7d',
    'weekday_num', 'is_weekend'
]

df_clean = df.dropna(subset=FEATURE_COLS + ['is_risk_tomorrow'])
print(f"\nClean training samples: {len(df_clean)}")
print(f"Risk days (Bad/Awful tomorrow): {df_clean['is_risk_tomorrow'].sum()} ({df_clean['is_risk_tomorrow'].mean()*100:.1f}%)")

X = df_clean[FEATURE_COLS]
y = df_clean['is_risk_tomorrow']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

clf = GradientBoostingClassifier(
    n_estimators=150,
    max_depth=3,
    learning_rate=0.1,
    subsample=0.8,
    random_state=42
)
clf.fit(X_train, y_train)

score = clf.score(X_test, y_test)
cv_scores = cross_val_score(clf, X, y, cv=5, scoring='f1')
print(f"\nTest Accuracy: {score:.2f}")
print(f"Cross-Val F1:  {cv_scores.mean():.2f} (+/- {cv_scores.std():.2f})")
print("\nClassification Report:")
print(classification_report(y_test, clf.predict(X_test),
                            target_names=['No Risk', 'Risk'],
                            zero_division=0))
print("\nFeature Importances:")
for feat, imp in sorted(zip(FEATURE_COLS, clf.feature_importances_), key=lambda x: -x[1]):
    print(f"  {feat:<30} {imp:.4f}")

# Save
model_out   = os.path.join(os.path.dirname(__file__), 'mood_trend_model.pkl')
features_out = os.path.join(os.path.dirname(__file__), 'mood_trend_features.pkl')

with open(model_out, 'wb') as f:
    pickle.dump(clf, f)
with open(features_out, 'wb') as f:
    pickle.dump(FEATURE_COLS, f)

print(f"\n[OK] Mood trend model saved to {model_out}")
