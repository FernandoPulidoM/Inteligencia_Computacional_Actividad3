"""
predict_service.py  –  Python microservice for ONNX inference
Run with:  python predict_service.py
Listens on http://localhost:5001/predict
"""
from flask import Flask, request, jsonify
import onnxruntime as ort
import numpy as np

app = Flask(__name__)
sess = ort.InferenceSession("heart_model2.onnx")

@app.post("/predict")
def predict():
    d = request.get_json()
    try:
        feeds = {
            "Age":           np.array([[float(d["Age"])]],           dtype=np.float32),
            "RestingBP":     np.array([[float(d["RestingBP"])]],     dtype=np.float32),
            "Cholesterol":   np.array([[float(d["Cholesterol"])]],   dtype=np.float32),
            "MaxHR":         np.array([[float(d["MaxHR"])]],         dtype=np.float32),
            "Oldpeak":       np.array([[float(d["Oldpeak"])]],       dtype=np.float32),
            "Sex":           np.array([[str(d["Sex"])]]),
            "ChestPainType": np.array([[str(d["ChestPainType"])]]),
            "FastingBS":     np.array([[str(d["FastingBS"])]]),
            "RestingECG":    np.array([[str(d["RestingECG"])]]),
            "ExerciseAngina":np.array([[str(d["ExerciseAngina"])]]),
            "ST_Slope":      np.array([[str(d["ST_Slope"])]]),
        }
        label = int(sess.run(["output_label"], feeds)[0][0])

        probability = None
        try:
            prob_result = sess.run(["output_probability"], feeds)[0]
            # prob_result is a list of dicts [{0: p0, 1: p1}, ...]
            probability = float(prob_result[0].get(1, prob_result[0].get(1.0, 0)))
        except Exception:
            pass

        return jsonify({"prediction": label, "probability": probability})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("🐍 Python ONNX service running on http://localhost:5001")
    app.run(port=5001)