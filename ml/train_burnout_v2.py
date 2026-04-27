"""
Burnout V2 Model — Trained on EPAT College Student Mental Health Dataset
Features: Stress, Anxiety, Depression, Sleep, Activity, Social Interaction
Model: Gradient Boosting Classifier (multi-class: 0=Low, 1=Mild, 2=Moderate, 3=High)
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report
import pickle
import os

print("=" * 50)
print(" Burnout V2 Model Training (EPAT Dataset)")
print("=" * 50)

df_path = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'EPAT_mental_health_dataset.csv')
df = pd.read_csv(df_path)
print(f"Loaded {len(df)} rows from EPAT dataset.")

# Target distribution
print(f"\nTarget (Mental_Health_Status) distribution:")
print(df['Mental_Health_Status'].value_counts().sort_index())

# Encode Gender: Male=1, Female=0, Other=2
df['Gender_enc'] = df['Gender'].map({'Male': 1, 'Female': 0, 'Other': 2}).fillna(2)

# Rich multi-domain feature set (9 features vs old model's 5)
FEATURE_COLS = [
    'Age',
    'Gender_enc',
    'Academic_Stress_Score',
    'Anxiety_Score',
    'Depression_Score',
    'Stress_Score',
    'Sleep_Quality_Index',
    'Behavioral_Activity_Level',
    'Social_Interaction_Frequency'
]

X = df[FEATURE_COLS]
y = df['Mental_Health_Status']

# Stratified split to preserve class distribution
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Gradient Boosting — handles small datasets well
clf = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.08,
    subsample=0.85,
    random_state=42
)
clf.fit(X_train, y_train)

# Evaluation
score = clf.score(X_test, y_test)
cv_scores = cross_val_score(clf, X, y, cv=5, scoring='accuracy')
print(f"\nTest Accuracy: {score:.2f}")
print(f"Cross-Val Accuracy: {cv_scores.mean():.2f} (+/- {cv_scores.std():.2f})")
print("\nClassification Report:")
print(classification_report(y_test, clf.predict(X_test),
                            target_names=['Low', 'Mild', 'Moderate', 'High'],
                            zero_division=0))
print("\nFeature Importances:")
for feat, imp in sorted(zip(FEATURE_COLS, clf.feature_importances_), key=lambda x: -x[1]):
    print(f"  {feat:<35} {imp:.4f}")

# Save model + feature column names (for server to validate input order)
model_out = os.path.join(os.path.dirname(__file__), 'burnout_model_v2.pkl')
features_out = os.path.join(os.path.dirname(__file__), 'burnout_v2_features.pkl')

with open(model_out, 'wb') as f:
    pickle.dump(clf, f)
with open(features_out, 'wb') as f:
    pickle.dump(FEATURE_COLS, f)

print(f"\n[OK] Burnout V2 model saved to {model_out}")
