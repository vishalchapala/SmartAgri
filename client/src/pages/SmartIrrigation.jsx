import { useState } from "react";

function SmartIrrigation() {
  const [moisture, setMoisture] = useState("");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [rainfall, setRainfall] = useState("");
  const [result, setResult] = useState(null);

  const calculateIrrigation = () => {
    if (
      moisture === "" ||
      temperature === "" ||
      humidity === "" ||
      rainfall === ""
    ) {
      alert("Please fill all fields.");
      return;
    }

    let recommendation = "";
    let amount = "";
    let status = "";

    const soilMoisture = Number(moisture);
    const temp = Number(temperature);
    const rain = Number(rainfall);

    if (soilMoisture < 30 && rain < 20) {
      status = "High Water Requirement";
      recommendation =
        "The soil is dry. Irrigation is recommended immediately.";
      amount = "25–30 mm";
    } else if (soilMoisture < 50 && rain < 40) {
      status = "Moderate Water Requirement";
      recommendation =
        "The soil has moderate moisture. Light irrigation is recommended.";
      amount = "15–20 mm";
    } else {
      status = "Low Water Requirement";
      recommendation =
        "The soil has sufficient moisture. Irrigation can be reduced or skipped.";
      amount = "0–10 mm";
    }

    setResult({
      status,
      recommendation,
      amount,
      temperature: temp,
      humidity: Number(humidity),
      moisture: soilMoisture,
      rainfall: rain,
    });
  };

  return (
    <div className="page">

      <div className="page-header">
        <p className="small-title">SMART AGRICULTURE</p>

        <h1>💧 Smart Irrigation</h1>

        <p>
          Analyze soil and environmental conditions to determine
          the irrigation requirement for your crop.
        </p>
      </div>

      <div className="form-card">

        <h2>🌱 Farm Conditions</h2>

        <div className="form-grid">

          <div>
            <label>Soil Moisture (%)</label>
            <input
              type="number"
              placeholder="Example: 35"
              value={moisture}
              onChange={(e) => setMoisture(e.target.value)}
            />
          </div>

          <div>
            <label>Temperature (°C)</label>
            <input
              type="number"
              placeholder="Example: 30"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
          </div>

          <div>
            <label>Humidity (%)</label>
            <input
              type="number"
              placeholder="Example: 65"
              value={humidity}
              onChange={(e) => setHumidity(e.target.value)}
            />
          </div>

          <div>
            <label>Rainfall (mm)</label>
            <input
              type="number"
              placeholder="Example: 10"
              value={rainfall}
              onChange={(e) => setRainfall(e.target.value)}
            />
          </div>

        </div>

        <button
          className="primary-btn"
          onClick={calculateIrrigation}
        >
          💧 Calculate Irrigation
        </button>

      </div>

      {result && (
        <div
          className="dashboard-panel"
          style={{ marginTop: "25px" }}
        >

          <div className="panel-header">

            <div>
              <p className="small-title">IRRIGATION ANALYSIS</p>
              <h2>Water Requirement</h2>
            </div>

            <span className="ai-badge">
              SMART
            </span>

          </div>

          <div className="recommendation">

            <div className="crop-image">
              💧
            </div>

            <div>
              <p className="small-title">STATUS</p>

              <h3>
                {result.status}
              </h3>

              <p style={{ marginTop: "8px" }}>
                Recommended Water:{" "}
                <strong>{result.amount}</strong>
              </p>
            </div>

          </div>

          <div className="info-box">
            <strong>💡 Recommendation</strong>

            <p>
              {result.recommendation}
            </p>
          </div>

          <div className="dashboard-stats">

            <div className="dashboard-card">
              <span>🌱 Soil Moisture</span>
              <h2>{result.moisture}%</h2>
            </div>

            <div className="dashboard-card">
              <span>🌡️ Temperature</span>
              <h2>{result.temperature}°C</h2>
            </div>

            <div className="dashboard-card">
              <span>💦 Humidity</span>
              <h2>{result.humidity}%</h2>
            </div>

            <div className="dashboard-card">
              <span>🌧️ Rainfall</span>
              <h2>{result.rainfall} mm</h2>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default SmartIrrigation;