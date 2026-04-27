"""
Text Sentiment Classifier — Trained on Reddit Mental Health Dataset (24MB, 7 categories)
Features: TF-IDF (unigrams + bigrams) on raw Reddit post text
Model: Logistic Regression (fast, accurate on text)
Output: 0=LOW, 1=MEDIUM, 2=HIGH, 3=CRITICAL
New endpoint: /analyze/text-local
"""
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report
import pickle
import os

print("=" * 50)
print(" Text Sentiment Model Training (Reddit Dataset)")
print("=" * 50)

df_path = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'Sentiment_Mental_health_dataset.csv')
print("Loading dataset (24MB, may take a moment)...")
df = pd.read_csv(df_path)

# Strip whitespace from column names (the dataset has 'statement ' with trailing space)
df.columns = df.columns.str.strip()
df['statement'] = df['statement'].astype(str).str.strip()

print(f"Loaded {len(df)} rows.")
print(f"\nCategory distribution:")
print(df['status'].value_counts())

# Map 7 categories to 4 risk levels
RISK_MAP = {
    'Normal':               0,  # LOW
    'Stress':               1,  # MEDIUM
    'Anxiety':              1,  # MEDIUM
    'Depression':           2,  # HIGH
    'Bipolar':              2,  # HIGH
    'Personality_disorder': 2,  # HIGH
    'Suicidal':             3,  # CRITICAL
}
RISK_LABELS = {0: 'LOW', 1: 'MEDIUM', 2: 'HIGH', 3: 'CRITICAL'}

df['risk_level'] = df['status'].map(RISK_MAP)
df = df.dropna(subset=['statement', 'risk_level'])
df['risk_level'] = df['risk_level'].astype(int)

print(f"\nRisk level distribution after mapping:")
print(df['risk_level'].value_counts().sort_index().rename(RISK_LABELS))

X = df['statement']
y = df['risk_level']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")

# TF-IDF + Logistic Regression pipeline
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        max_features=40000,
        ngram_range=(1, 2),      # unigrams + bigrams
        sublinear_tf=True,       # log TF damping
        min_df=3,                # ignore very rare terms
        analyzer='word',
        stop_words='english'
    )),
    ('clf', LogisticRegression(
        max_iter=1000,
        C=3.0,
        solver='lbfgs',
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    ))
])

print("\nTraining text classifier... (this may take 30-60 seconds for 24MB)")
pipeline.fit(X_train, y_train)

score = pipeline.score(X_test, y_test)
print(f"\nTest Accuracy: {score:.2f}")
print("\nClassification Report:")
print(classification_report(y_test, pipeline.predict(X_test),
                            target_names=['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                            zero_division=0))

# Save model (TF-IDF + classifier bundled in pipeline)
model_out = os.path.join(os.path.dirname(__file__), 'text_classifier.pkl')
with open(model_out, 'wb') as f:
    pickle.dump(pipeline, f)

# Save label map for server to decode predictions
label_out = os.path.join(os.path.dirname(__file__), 'text_risk_labels.pkl')
with open(label_out, 'wb') as f:
    pickle.dump(RISK_LABELS, f)

print(f"\n[OK] Text classifier saved to {model_out}")
