"""
Vision Model — Trained on EPAT Facial Emotion Labels + Confidence
Features: Facial_Emotion_Label (OHE), Facial_Emotion_Confidence
Model: Random Forest (multi-class → risk level)
Replaces the heuristic in /analyze/vision endpoint
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report
import pickle
import os

print("=" * 50)
print(" Vision Model Training (Facial Emotion -> Risk)")
print("=" * 50)

df_path = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'EPAT_mental_health_dataset.csv')
df = pd.read_csv(df_path)
print(f"Loaded {len(df)} rows.")

print(f"\nFacial Emotion Distribution:")
print(df['Facial_Emotion_Label'].value_counts())
print(f"\nRisk Level Distribution:")
print(df['Mental_Health_Status'].value_counts().sort_index())

# Features: Facial_Emotion_Label (categorical) + Facial_Emotion_Confidence (float)
X = df[['Facial_Emotion_Label', 'Facial_Emotion_Confidence']].copy()
y = df['Mental_Health_Status']  # 0=Low, 1=Mild, 2=Moderate, 3=High

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Pipeline: OHE for emotion label + passthrough for confidence
preprocessor = ColumnTransformer([
    ('emotion_ohe', OneHotEncoder(sparse_output=False, handle_unknown='ignore'),
     ['Facial_Emotion_Label'])
], remainder='passthrough')  # passes Facial_Emotion_Confidence through

pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(
        n_estimators=150,
        max_depth=6,
        min_samples_leaf=2,
        random_state=42,
        class_weight='balanced'
    ))
])

pipeline.fit(X_train, y_train)

score = pipeline.score(X_test, y_test)
print(f"\nTest Accuracy: {score:.2f}")

cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring='accuracy')
print(f"Cross-Val Accuracy: {cv_scores.mean():.2f} (+/- {cv_scores.std():.2f})")
print("\nClassification Report:")
print(classification_report(y_test, pipeline.predict(X_test),
                            target_names=['Low', 'Mild', 'Moderate', 'High'],
                            zero_division=0))

# Save model
model_out = os.path.join(os.path.dirname(__file__), 'vision_model.pkl')
with open(model_out, 'wb') as f:
    pickle.dump(pipeline, f)

print(f"\n[OK] Vision model saved to {model_out}")
