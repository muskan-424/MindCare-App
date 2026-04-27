import unittest
from fastapi.testclient import TestClient
import warnings

# Import the FastAPI app and the explicit model loading function
from server import app, load_all_models

class TestMindCareMLServer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Suppress generic scikit-learn warnings during tests
        warnings.filterwarnings("ignore")
        
        print("\n[Test Setup] Loading ML Models before running tests...")
        # explicitly load the latest trained .pkl models into the global state
        load_all_models()
        cls.client = TestClient(app)
        print("[Test Setup] TestClient initialized and ready.\n")

    def test_1_health_check(self):
        """Test health endpoint and that all models are successfully loaded into memory"""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        # Ensure that the models are registered as loaded
        self.assertTrue(data["models_loaded"]["burnout"])
        self.assertTrue(data["models_loaded"]["vision"])
        self.assertTrue(data["models_loaded"]["text"])

    def test_2_burnout_prediction_normal(self):
        """Test the Burnout model with a calm, well-rested profile (Should result in LOW risk)"""
        payload = {
            "age": 20, 
            "gender": "Female", 
            "academic_stress": 2, 
            "anxiety": 2, 
            "depression": 2, 
            "general_stress": 2, 
            "sleep_quality": 8.0, 
            "behavioral_activity": 85.0, 
            "social_interaction": 20.0
        }
        response = self.client.post("/predict/burnout", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("burnoutRiskScore", data)
        self.assertEqual(data["riskLevel"], "LOW")

    def test_3_predict_burnout_high_risk(self):
        """Test the Burnout model with a highly stressed profile (Should result in CRITICAL/HIGH risk)"""
        payload = {
            "age": 21, 
            "gender": "Male", 
            "academic_stress": 40, 
            "anxiety": 40, 
            "depression": 40, 
            "general_stress": 40, 
            "sleep_quality": 2.0, 
            "behavioral_activity": 10.0, 
            "social_interaction": 2.0
        }
        response = self.client.post("/predict/burnout", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["riskLevel"], ["HIGH", "CRITICAL"])

    def test_4_predict_vision_anxious(self):
        """Test the Vision CV endpoint with an anxious face detection"""
        payload = {
            "emotion": "Fear",
            "confidence": 0.85,
            "faceDetectedRatio": 0.90
        }
        response = self.client.post("/analyze/vision", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("riskLevel", data)
        self.assertTrue(data["riskScore"] > 0)
        
    def test_5_predict_text_sentiment_critical(self):
        """Test the Text Logging NLP model with distress keywords"""
        payload = {
            "statement": "I feel hopeless and completely numb, I can't go on like this."
        }
        response = self.client.post("/analyze/text-local", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Expecting the model to correctly categorize this extreme phrase
        self.assertIn(data["riskLevel"], ["HIGH", "CRITICAL"])

    def test_6_predict_voice_calm(self):
        """Test the Voice Analysis endpoint with optimal prosodic metrics"""
        payload = {
            "speechRate": 120.0, 
            "pauseRatio": 0.1, 
            "pitchVariance": 0.4,
            "durationSec": 5.0, 
            "snr": 20.0, 
            "energyLevel": 0.6
        }
        response = self.client.post("/analyze/voice", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["riskLevel"], "LOW")

if __name__ == '__main__':
    # Running via `python test_server.py` will execute all unittests
    unittest.main(verbosity=2)
