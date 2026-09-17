import { useState } from "react";

function DiseaseDetection() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setPrediction(null);
    setMessage("");
  };

  const analyzeImage = async () => {
    if (!image) {
      setMessage("⚠️ Please select a crop image first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("🔍 AI is analyzing the crop image...");
      setPrediction(null);

      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch(
        "http://localhost:5000/api/disease-detection",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ AI analysis completed!");
        setPrediction(data.prediction);

// Save latest disease result for Dashboard
localStorage.setItem(
  "diseaseResult",
  JSON.stringify(data.prediction)
);

window.dispatchEvent(
  new Event("diseaseResultUpdated")
);
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

      {/* PAGE HEADER */}

      <div className="page-header">
        <p className="small-title">AI VISION</p>

        <h1>🔬 Crop Disease Detection</h1>

        <p>
          Upload a crop leaf image and let the AI model
          identify possible diseases.
        </p>
      </div>


      {/* UPLOAD CARD */}

      <div className="upload-card">

        <div className="upload-icon">📷</div>

        <h2>Upload Crop Image</h2>

        <p>
          Select a clear image of the affected crop leaf.
        </p>


        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />


        {/* IMAGE PREVIEW */}

        {preview && (
          <div style={{ marginTop: "20px" }}>

            <img
              src={preview}
              alt="Selected crop leaf"
              style={{
                width: "320px",
                maxWidth: "100%",
                borderRadius: "15px",
                border:
                  "1px solid rgba(255,255,255,0.1)",
              }}
            />

            <p style={{ marginTop: "10px" }}>
              📄 {image.name}
            </p>

          </div>
        )}


        {/* ANALYZE BUTTON */}

        <button
          className="primary-btn"
          onClick={analyzeImage}
          disabled={!image || loading}
        >
          {loading
            ? "🔄 Analyzing..."
            : "🔍 Analyze Image"}
        </button>


        {/* MESSAGE */}

        {message && (
          <p style={{ marginTop: "15px" }}>
            {message}
          </p>
        )}

      </div>


      {/* AI RESULT */}

      {prediction && (
        <div
          className="dashboard-panel"
          style={{ marginTop: "25px" }}
        >

          <div className="panel-header">

            <div>
              <p className="small-title">
                AI RESULT
              </p>

              <h2>Disease Analysis</h2>
            </div>

            <span className="ai-badge">
              AI
            </span>

          </div>


          {/* CROP */}

          <div className="recommendation">

            <div className="crop-image">
              🌱
            </div>

            <div>

              <p className="small-title">
                CROP
              </p>

              <h3>
                {prediction.crop}
              </h3>

            </div>

          </div>


          {/* STATUS */}

          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              borderRadius: "12px",
              background:
                "rgba(255,255,255,0.03)",
            }}
          >

            <p className="small-title">
              STATUS
            </p>

            <h3>
              {prediction.status === "Healthy"
                ? "✅ Healthy"
                : "⚠️ Disease Detected"}
            </h3>

          </div>


          {/* DISEASE */}

          <div
            style={{
              marginTop: "20px",
            }}
          >

            <p className="small-title">
              DETECTED CONDITION
            </p>

            <h2>
              {prediction.disease}
            </h2>

          </div>


          {/* CONFIDENCE */}

          <div
            style={{
              marginTop: "20px",
            }}
          >

            <div className="confidence">

              <span>
                AI Confidence
              </span>

              <strong>
                {prediction.confidence}%
              </strong>

            </div>


            <div className="progress">

              <div
                style={{
                  width:
                    `${prediction.confidence}%`,
                }}
              ></div>

            </div>

          </div>


          {/* RECOMMENDATION */}

          <div
            className="info-box"
            style={{
              marginTop: "20px",
            }}
          >

            <strong>
              💡 Recommendation
            </strong>

            <p>
              {prediction.recommendation}
            </p>

          </div>

        </div>
      )}


      {/* DISCLAIMER */}

      <div className="info-box">

        ⚠️ This is an AI-assisted educational tool.
        Results should be verified with agricultural
        experts before making important farming decisions.

      </div>

    </div>
  );
}

export default DiseaseDetection;