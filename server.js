/**
 * server.js  –  Express server with built-in ONNX inference (no Python needed)
 *
 * Install deps:  npm install express onnxruntime-node
 * Start:         node server.js
 */
const express = require("express");
const ort     = require("onnxruntime-node");
const path    = require("path");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// Load the ONNX session once at startup
let sess;
(async () => {
  sess = await ort.InferenceSession.create(path.join(__dirname, "heart_model2.onnx"));
  console.log("✅ ONNX model loaded. Inputs:", sess.inputNames);
})();

app.post("/predict", async (req, res) => {
  if (!sess) {
    return res.status(503).json({ error: "Model not loaded yet, please retry." });
  }

  const d = req.body;
  try {
    const feeds = {
      Age:            new ort.Tensor("float32", [parseFloat(d.Age)],            [1, 1]),
      RestingBP:      new ort.Tensor("float32", [parseFloat(d.RestingBP)],      [1, 1]),
      Cholesterol:    new ort.Tensor("float32", [parseFloat(d.Cholesterol)],    [1, 1]),
      MaxHR:          new ort.Tensor("float32", [parseFloat(d.MaxHR)],          [1, 1]),
      Oldpeak:        new ort.Tensor("float32", [parseFloat(d.Oldpeak)],        [1, 1]),
      Sex:            new ort.Tensor("string",  [String(d.Sex)],                [1, 1]),
      ChestPainType:  new ort.Tensor("string",  [String(d.ChestPainType)],      [1, 1]),
      FastingBS:      new ort.Tensor("string",  [String(d.FastingBS)],          [1, 1]),
      RestingECG:     new ort.Tensor("string",  [String(d.RestingECG)],         [1, 1]),
      ExerciseAngina: new ort.Tensor("string",  [String(d.ExerciseAngina)],     [1, 1]),
      ST_Slope:       new ort.Tensor("string",  [String(d.ST_Slope)],           [1, 1]),
    };

    const results = await sess.run(feeds);

    // --- prediction label ---
    const label = Number(results["output_label"].data[0]);

    // --- probability (optional output) ---
    let probability = null;
    if (results["output_probability"]) {
      // onnxruntime-node returns ZipMap as a JS Map or plain object
      const probEntry = results["output_probability"].data[0];
      if (probEntry instanceof Map) {
        probability = probEntry.get(1) ?? probEntry.get(1.0) ?? null;
      } else if (probEntry && typeof probEntry === "object") {
        probability = probEntry[1] ?? probEntry["1"] ?? null;
      }
      if (probability !== null) probability = parseFloat(probability);
    }

    res.json({ prediction: label, probability });
  } catch (err) {
    console.error("Inference error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () =>
  console.log("🫀 Server running at http://localhost:3000")
);
