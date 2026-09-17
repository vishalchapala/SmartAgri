import { useState } from "react";

function SoilAnalysis() {
  const [nitrogen, setNitrogen] = useState("");
  const [phosphorus, setPhosphorus] = useState("");
  const [potassium, setPotassium] = useState("");
  const [ph, setPh] = useState("");
  const [moisture, setMoisture] = useState("");
  const [soilType, setSoilType] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const analyzeSoil = async () => {
    if (
      nitrogen === "" ||
      phosphorus === "" ||
      potassium === "" ||
      ph === "" ||
      moisture === "" ||
      soilType === ""
    ) {
      setMessage("⚠️ Please fill all soil details.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setResult(null);

      const response = await fetch(
        "http://localhost:5000/api/soil-analysis",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nitrogen: Number(nitrogen),
            phosphorus: Number(phosphorus),
            potassium: Number(potassium),
            ph: Number(ph),
            moisture: Number(moisture),
            soilType: soilType,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
  setResult(data.result);
  setMessage("✅ Soil analysis completed successfully!");

  // Save soil moisture for Dashboard
  localStorage.setItem("soilMoisture", data.result.moisture);

  // Tell Dashboard that soil moisture was updated
  window.dispatchEvent(new Event("soilMoistureUpdated"));
  localStorage.setItem(
  "soilData",
  JSON.stringify({
    nitrogen: data.result.nitrogen,
    phosphorus: data.result.phosphorus,
    potassium: data.result.potassium,
    ph: data.result.ph,
    moisture: data.result.moisture,
    soilType: data.result.soilType,
  })
);

window.dispatchEvent(new Event("soilDataUpdated"));
} else {
        setMessage("❌ " + data.message);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Cannot connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">

      <div className="page-header">
        <p className="small-title">SMART AGRICULTURE</p>

        <h1>🧪 Soil Analysis</h1>

        <p>
          Analyze soil nutrients and conditions to understand
          the health of your farmland.
        </p>
      </div>

      <div className="form-card">

        <h2>🌱 Soil Information</h2>

        <div className="form-grid">

          <div>
            <label>Nitrogen (N)</label>

            <input
              type="number"
              placeholder="Example: 70"
              value={nitrogen}
              onChange={(e) => setNitrogen(e.target.value)}
            />
          </div>

          <div>
            <label>Phosphorus (P)</label>

            <input
              type="number"
              placeholder="Example: 35"
              value={phosphorus}
              onChange={(e) => setPhosphorus(e.target.value)}
            />
          </div>

          <div>
            <label>Potassium (K)</label>

            <input
              type="number"
              placeholder="Example: 40"
              value={potassium}
              onChange={(e) => setPotassium(e.target.value)}
            />
          </div>

          <div>
            <label>Soil pH</label>

            <input
              type="number"
              step="0.1"
              placeholder="Example: 6.5"
              value={ph}
              onChange={(e) => setPh(e.target.value)}
            />
          </div>

          <div>
            <label>Soil Moisture (%)</label>

            <input
              type="number"
              placeholder="Example: 55"
              value={moisture}
              onChange={(e) => setMoisture(e.target.value)}
            />
          </div>

          <div>
            <label>Soil Type</label>

            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
            >
              <option value="">Select Soil Type</option>
              <option value="Loamy">Loamy</option>
              <option value="Clay">Clay</option>
              <option value="Sandy">Sandy</option>
              <option value="Silty">Silty</option>
              <option value="Black Soil">Black Soil</option>
              <option value="Red Soil">Red Soil</option>
            </select>
          </div>

        </div>

        <button
          className="primary-btn"
          onClick={analyzeSoil}
          disabled={loading}
        >
          {loading
            ? "🔄 Analyzing..."
            : "🧪 Analyze Soil"}
        </button>

        {message && (
          <p style={{ marginTop: "15px" }}>
            {message}
          </p>
        )}

      </div>

      {result && (
        <div
          className="dashboard-panel"
          style={{ marginTop: "25px" }}
        >

          <div className="panel-header">

            <div>
              <p className="small-title">
                SOIL HEALTH REPORT
              </p>

              <h2>🌱 Soil Analysis Result</h2>
            </div>

            <span className="ai-badge">
              ANALYSIS
            </span>

          </div>

          <div className="recommendation">

            <div className="crop-image">
              🌱
            </div>

            <div>

              <p className="small-title">
                SOIL CONDITION
              </p>

              <h3>
                {result.condition}
              </h3>

              <p style={{ marginTop: "8px" }}>
                Soil Type:{" "}
                <strong>{result.soilType}</strong>
              </p>

            </div>

          </div>

          <div className="dashboard-stats">

            <div className="dashboard-card">
              <span>🧪 Nitrogen</span>
              <h2>{result.nitrogen}</h2>
            </div>

            <div className="dashboard-card">
              <span>🧪 Phosphorus</span>
              <h2>{result.phosphorus}</h2>
            </div>

            <div className="dashboard-card">
              <span>🧪 Potassium</span>
              <h2>{result.potassium}</h2>
            </div>

            <div className="dashboard-card">
              <span>⚗️ Soil pH</span>
              <h2>{result.ph}</h2>
            </div>

          </div>

          <div className="dashboard-stats">

            <div className="dashboard-card">
              <span>💧 Moisture</span>
              <h2>{result.moisture}%</h2>
            </div>

          </div>

          <div
            className="info-box"
            style={{ marginTop: "20px" }}
          >

            <strong>💡 Soil Recommendation</strong>

            <p>
              {result.recommendation}
            </p>

          </div>

        </div>
      )}

      <div className="info-box">

        ⚠️ This is an educational soil analysis tool.
        Actual fertilizer and soil-treatment decisions
        should be based on a professional soil test.

      </div>

    </div>
  );
}

export default SoilAnalysis;