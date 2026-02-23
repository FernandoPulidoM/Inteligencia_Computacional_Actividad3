/**
 * server.js  –  Express frontend server
 * Serves index.html and proxies /predict → Python ONNX microservice on :5001
 *
 * Start order:
 *   1. python predict_service.py
 *   2. node server.js
 */
const express = require("express");
const http    = require("http");

const app            = express();
const PYTHON_PORT    = 5001;
const PYTHON_HOST    = "127.0.0.1";

app.use(express.json());
app.use(express.static(__dirname));

app.post("/predict", (req, res) => {
  const body = JSON.stringify(req.body);

  const options = {
    hostname: PYTHON_HOST,
    port:     PYTHON_PORT,
    path:     "/predict",
    method:   "POST",
    headers: {
      "Content-Type":   "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  const pyReq = http.request(options, (pyRes) => {
    let data = "";
    pyRes.on("data", chunk => (data += chunk));
    pyRes.on("end", () => {
      try {
        res.status(pyRes.statusCode).json(JSON.parse(data));
      } catch {
        res.status(500).json({ error: "Invalid response from Python service" });
      }
    });
  });

  pyReq.on("error", (err) => {
    console.error("❌ Could not reach Python service:", err.message);
    res.status(503).json({
      error: "Python ONNX service is not running. Start it with: python predict_service.py",
    });
  });

  pyReq.write(body);
  pyReq.end();
});

app.listen(3000, () =>
  console.log("🫀 Node server running at http://localhost:3000")
);