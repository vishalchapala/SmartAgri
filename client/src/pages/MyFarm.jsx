import { useEffect, useState } from "react";

function MyFarm() {
  const [farmName, setFarmName] = useState("");
  const [area, setArea] = useState("");
  const [mainCrop, setMainCrop] = useState("");
  const [soilType, setSoilType] = useState("");

  const [farms, setFarms] = useState([]);
  const [message, setMessage] = useState("");

  // Fetch farms from MongoDB
  const fetchFarms = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/farms");
      const data = await response.json();

      if (response.ok) {
        setFarms(data.farms);
      }
    } catch (error) {
      setMessage("❌ Cannot connect to backend.");
    }
  };

  // Load farms when page opens
  useEffect(() => {
    fetchFarms();
  }, []);

  const saveFarm = async () => {
    if (!farmName || !area || !mainCrop || !soilType) {
      setMessage("⚠️ Please fill all fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/farms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          farmName,
          area: Number(area),
          mainCrop,
          soilType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Farm saved successfully!");

        setFarmName("");
        setArea("");
        setMainCrop("");
        setSoilType("");

        // Refresh farm list
        fetchFarms();
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
        <p className="small-title">FARM MANAGEMENT</p>

        <h1>🚜 My Farm</h1>

        <p>
          Manage your farm information and monitor your crop activities.
        </p>
      </div>

      {/* Add Farm Form */}

      <div className="form-card">
        <h2>Add Farm</h2>

        <div className="form-grid">

          <div>
            <label>Farm Name</label>

            <input
              type="text"
              placeholder="Enter farm name"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
            />
          </div>

          <div>
            <label>Farm Area (Acres)</label>

            <input
              type="number"
              placeholder="Example: 5"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </div>

          <div>
            <label>Main Crop</label>

            <select
              value={mainCrop}
              onChange={(e) => setMainCrop(e.target.value)}
            >
              <option value="">Select crop</option>
              <option value="Rice">Rice</option>
              <option value="Wheat">Wheat</option>
              <option value="Cotton">Cotton</option>
              <option value="Maize">Maize</option>
              <option value="Tomato">Tomato</option>
              <option value="Groundnut">Groundnut</option>
            </select>
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
          onClick={saveFarm}
        >
          💾 Save Farm
        </button>

        {message && (
          <p style={{ marginTop: "15px" }}>
            {message}
          </p>
        )}
      </div>


      {/* Saved Farms */}

      <div className="dashboard-panel" style={{ marginTop: "25px" }}>

        <div className="panel-header">

          <div>
            <p className="small-title">DATABASE</p>
            <h2>Saved Farms</h2>
          </div>

          <span className="ai-badge">
            {farms.length}
          </span>

        </div>


        {farms.length === 0 ? (

          <p>No farms saved yet.</p>

        ) : (

          <div className="recommendation-list">

            {farms.map((farm) => (

              <div
                className="recommendation-item"
                key={farm._id}
              >

                <span>🚜</span>

                <div>

                  <strong>{farm.farmName}</strong>

                  <p>
                    🌾 Crop: {farm.mainCrop}
                    <br />
                    📐 Area: {farm.area} acres
                    <br />
                    🌱 Soil: {farm.soilType}
                  </p>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default MyFarm;