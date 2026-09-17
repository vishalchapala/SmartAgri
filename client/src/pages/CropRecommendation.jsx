import { useState } from "react";

function CropRecommendation() {
  const [nitrogen, setNitrogen] = useState("");
  const [phosphorus, setPhosphorus] = useState("");
  const [potassium, setPotassium] = useState("");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [ph, setPh] = useState("");
  const [rainfall, setRainfall] = useState("");
  const [soilType, setSoilType] = useState("");

  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  const getRecommendation = async () => {
    if (
      !nitrogen ||
      !phosphorus ||
      !potassium ||
      !temperature ||
      !humidity ||
      !ph ||
      !rainfall ||
      !soilType
    ) {
      setMessage("⚠️ Please fill all fields.");
      setResult(null);
      return;
    }

    if (Number(ph) < 0 || Number(ph) > 14) {
      setMessage("⚠️ Soil pH must be between 0 and 14.");
      setResult(null);
      return;
    }

    try {
      setMessage("🤖 Analyzing farm conditions...");
      setResult(null);

      const response = await fetch(
        "http://localhost:5000/api/crop-recommendation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nitrogen: Number(nitrogen),
            phosphorus: Number(phosphorus),
            potassium: Number(potassium),
            temperature: Number(temperature),
            humidity: Number(humidity),
            ph: Number(ph),
            rainfall: Number(rainfall),
            soilType,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult(data.recommendation);
        setMessage("✅ Recommendation generated successfully!");
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (error) {
      setMessage("❌ Cannot connect to backend.");
    }
  };

  return (
    <div className="page">

      <div className="page-header">
        <p className="small-title">AI ASSISTANT</p>

        <h1>🌾 Crop Recommendation</h1>

        <p>
          Enter your soil and environmental conditions to get
          an intelligent crop recommendation.
        </p>
      </div>

      <div className="form-card">

        <h2>Farm Conditions</h2>

        <div className="form-grid">

          <div>
            <label>Nitrogen (N)</label>
            <input
              type="number"
              placeholder="Example: 90"
              value={nitrogen}
              onChange={(e) => setNitrogen(e.target.value)}
            />
          </div>

          <div>
            <label>Phosphorus (P)</label>
            <input
              type="number"
              placeholder="Example: 42"
              value={phosphorus}
              onChange={(e) => setPhosphorus(e.target.value)}
            />
          </div>

          <div>
            <label>Potassium (K)</label>
            <input
              type="number"
              placeholder="Example: 43"
              value={potassium}
              onChange={(e) => setPotassium(e.target.value)}
            />
          </div>

          <div>
            <label>Temperature (°C)</label>
            <input
              type="number"
              placeholder="Example: 25"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
          </div>

          <div>
            <label>Humidity (%)</label>
            <input
              type="number"
              placeholder="Example: 70"
              value={humidity}
              onChange={(e) => setHumidity(e.target.value)}
            />
          </div>

          <div>
            <label>Soil pH</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="14"
              placeholder="Example: 6.5"
              value={ph}
              onChange={(e) => setPh(e.target.value)}
            />
          </div>

          <div>
            <label>Rainfall (mm)</label>
            <input
              type="number"
              placeholder="Example: 200"
              value={rainfall}
              onChange={(e) => setRainfall(e.target.value)}
            />
          </div>

          <div>
            <label>Soil Type</label>

            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
            >
              <option value="">Select soil type</option>
              <option value="Clay">Clay</option>
              <option value="Loamy">Loamy</option>
              <option value="Sandy">Sandy</option>
              <option value="Black Soil">Black Soil</option>
              <option value="Red Soil">Red Soil</option>
            </select>
          </div>

        </div>

        <button
          className="primary-btn"
          onClick={getRecommendation}
        >
          🤖 Get AI Recommendation
        </button>

        {message && (
          <p style={{ marginTop: "15px" }}>
            {message}
          </p>
        )}

      </div>


      {/* Recommendation Result */}

      {result && (
        <div
          className="dashboard-panel"
          style={{ marginTop: "25px" }}
        >

          <div className="panel-header">

            <div>
              <p className="small-title">AI RESULT</p>
              <h2>Recommended Crop</h2>
            </div>

            <span className="ai-badge">
              AI
            </span>

          </div>

          <div className="recommendation">

            <div className="crop-image">
              🌾
            </div>

            <div>

              <h3>{result.crop}</h3>

              <p>
                {result.reason}
              </p>

              <div className="confidence">

                <span>Recommendation Confidence</span>

                <strong>
                  {result.confidence}%
                </strong>

              </div>

              <div className="progress">

                <div
                  style={{
                    width: `${result.confidence}%`,
                  }}
                ></div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default CropRecommendation;