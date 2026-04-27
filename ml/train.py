import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import pickle
import os

print("Starting Model Training...")

# Locate dataset
df_path = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'Student Mental health.csv')
df = pd.read_csv(df_path)

print(f"Loaded {len(df)} rows from dataset.")

# Clean Column Names
df.columns = ['Timestamp', 'Gender', 'Age', 'Course', 'Year', 'CGPA', 'Married', 'Depression', 'Anxiety', 'Panic_Attack', 'Treatment']

# Target: Burnout = 1 if (Depression == Yes OR Anxiety == Yes OR Panic == Yes)
df['Burnout'] = ((df['Depression'] == 'Yes') | (df['Anxiety'] == 'Yes') | (df['Panic_Attack'] == 'Yes')).astype(int)

# Features mapping
df['Gender'] = df['Gender'].map({'Female': 0, 'Male': 1}).fillna(0)
df['Married'] = df['Married'].map({'No': 0, 'Yes': 1}).fillna(0)

# Process Age
df['Age'] = pd.to_numeric(df['Age'], errors='coerce').fillna(20)

# Process Year (Extract number)
df['Year'] = df['Year'].str.extract(r'(\d+)').astype(float).fillna(1)

# Process CGPA (take median of range like '3.00 - 3.49')
def parse_cgpa(val):
    try:
        val = str(val).strip()
        if '-' in val:
            parts = val.split('-')
            return (float(parts[0]) + float(parts[1])) / 2
        return float(val)
    except:
        return 3.0

df['CGPA'] = df['CGPA'].apply(parse_cgpa)

# Features: Gender, Age, Year, CGPA, Married
X = df[['Gender', 'Age', 'Year', 'CGPA', 'Married']]
y = df['Burnout']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

clf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
clf.fit(X_train, y_train)

score = clf.score(X_test, y_test)
print(f"Model Training Complete! Accuracy: {score:.2f}")

model_out = os.path.join(os.path.dirname(__file__), 'burnout_model.pkl')
with open(model_out, 'wb') as f:
    pickle.dump(clf, f)

print(f"Model saved to {model_out}")
