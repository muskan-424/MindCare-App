from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pickle
import os

app = FastAPI(title="MindCare ML Service")

# Load model on startup
model = None
model_path = os.path.join(os.path.dirname(__file__), 'burnout_model.pkl')

@app.on_event("startup")
def load_model():
    global model
    if os.path.exists(model_path):
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        print("Successfully loaded burnout_model.pkl")
    else:
        print("Warning: burnout_model.pkl not found! Please run train.py first.")

class PredictionRequest(BaseModel):
    gender: str = "Female"
    age: int = 20
    year: int = 1
    cgpa: float = 3.0
    married: str = "No"

@app.post("/predict/burnout")
def predict_burnout(req: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not trained/loaded yet.")
        
    # Map incoming strings to numeric mapping used in training
    g = 1 if str(req.gender).lower() == 'male' else 0
    m = 1 if str(req.married).lower() == 'yes' else 0
    
    # Predict probabilities (shape: [1, 2] -> [prob_class0, prob_class1])
    try:
        features = [[g, req.age, req.year, req.cgpa, m]]
        proba = model.predict_proba(features)[0]
        
        # We classify 'burnout' as class 1 likelihood
        risk_percentage = round(proba[1] * 100, 2)
        
        return {
            "burnoutRiskScore": risk_percentage,
            "status": "success",
            "model_active": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.1", port=5000)
