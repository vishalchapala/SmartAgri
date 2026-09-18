import { useState, useEffect } from "react";

import CropRecommendation from "./pages/CropRecommendation";
import DiseaseDetection from "./pages/DiseaseDetection";
import SmartIrrigation from "./pages/SmartIrrigation";
import Weather from "./pages/Weather";
import SoilAnalysis from "./pages/SoilAnalysis";
import MyFarm from "./pages/MyFarm";
import FertilizerRecommendation from "./pages/FertilizerRecommendation";

function App() {
  // =========================================
  // STATE
  // =========================================

  const [page, setPage] = useState("dashboard");
  const [farmCount, setFarmCount] = useState(0);
  const [dashboardWeather, setDashboardWeather] = useState(null);
  const [weatherForecast, setWeatherForecast] = useState(null);
  const [backendMessage, setBackendMessage] = useState("");
  const [cropRecommendation, setCropRecommendation] = useState(null);
  const [fertilizerRecommendation, setFertilizerRecommendation] =
    useState(null);

  const [diseaseResult, setDiseaseResult] = useState(() => {
    try {
      const savedDisease = localStorage.getItem("diseaseResult");
      return savedDisease ? JSON.parse(savedDisease) : null;
    } catch (error) {
      console.error("Failed to load disease result:", error);
      return null;
    }
  });

  const [soilMoisture, setSoilMoisture] = useState(
    localStorage.getItem("soilMoisture") || 64
  );

  const [soilData, setSoilData] = useState(() => {
    try {
      const savedSoilData = localStorage.getItem("soilData");
      return savedSoilData ? JSON.parse(savedSoilData) : null;
    } catch (error) {
      console.error("Failed to read soil data:", error);
      return null;
    }
  });

  // =========================================
  // GET FARM COUNT FROM MONGODB
  // =========================================

  useEffect(() => {
    fetch("http://localhost:5000/api/farms")
      .then((response) => response.json())
      .then((data) => {
        setFarmCount(data.farms?.length || 0);
      })
      .catch((error) => {
        console.error("Failed to fetch farms:", error);
      });
  }, []);

  // =========================================
  // LIVE WEATHER + 7 DAY FORECAST
  // =========================================

  useEffect(() => {
    const fetchDashboardWeather = () => {
      fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=13.0827&longitude=80.2707&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto"
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Weather API request failed");
          }
          return response.json();
        })
        .then((data) => {
          setDashboardWeather(data.current);
          setWeatherForecast(data.daily);
        })
        .catch((error) => {
          console.error("Failed to fetch dashboard weather:", error);
        });
    };

    fetchDashboardWeather();

    const weatherInterval = setInterval(
      fetchDashboardWeather,
      10 * 60 * 1000
    );

    return () => clearInterval(weatherInterval);
  }, []);

  // =========================================
  // CHECK BACKEND CONNECTION
  // =========================================

  useEffect(() => {
    fetch("http://localhost:5000/")
      .then((response) => response.json())
      .then((data) => {
        setBackendMessage(data.message);
      })
      .catch((error) => {
        console.error("Backend connection failed:", error);
      });
  }, []);

  // =========================================
  // DISEASE RESULT UPDATE
  // =========================================

  useEffect(() => {
    const updateDiseaseResult = () => {
      try {
        const savedDisease = localStorage.getItem("diseaseResult");
        if (savedDisease) {
          setDiseaseResult(JSON.parse(savedDisease));
        }
      } catch (error) {
        console.error("Failed to update disease result:", error);
      }
    };

    window.addEventListener("diseaseResultUpdated", updateDiseaseResult);

    return () => {
      window.removeEventListener(
        "diseaseResultUpdated",
        updateDiseaseResult
      );
    };
  }, []);

  // =========================================
  // WEATHER CONDITION
  // =========================================

  const getWeatherCondition = (code) => {
    if (code === 0) return { icon: "☀️", text: "Clear Sky" };
    if (code === 1 || code === 2)
      return { icon: "🌤️", text: "Partly Cloudy" };
    if (code === 3) return { icon: "☁️", text: "Cloudy" };
    if (code >= 45 && code <= 48)
      return { icon: "🌫️", text: "Foggy" };
    if (code >= 51 && code <= 67)
      return { icon: "🌧️", text: "Rainy" };
    if (code >= 71 && code <= 77)
      return { icon: "❄️", text: "Snowy" };
    if (code >= 80 && code <= 82)
      return { icon: "🌦️", text: "Rain Showers" };
    if (code >= 95)
      return { icon: "⛈️", text: "Thunderstorm" };

    return { icon: "🌤️", text: "Unknown" };
  };

  const getForecastCondition = (code) => {
    if (code === 0) return "☀️";
    if (code === 1 || code === 2) return "🌤️";
    if (code === 3) return "☁️";
    if (code >= 45 && code <= 48) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 77) return "❄️";
    if (code >= 80 && code <= 82) return "🌦️";
    if (code >= 95) return "⛈️";
    return "🌤️";
  };

  // =========================================
  // WEATHER RISK
  // =========================================

  const getWeatherRisk = () => {
    if (!weatherForecast) {
      return {
        level: "Analyzing",
        icon: "🔄",
        message: "Analyzing upcoming weather conditions.",
      };
    }

    const maxTemperatures = weatherForecast.temperature_2m_max || [];
    const rainfallValues = weatherForecast.precipitation_sum || [];

    const maxTemp =
      maxTemperatures.length > 0
        ? Math.max(...maxTemperatures)
        : 0;

    const totalRain = rainfallValues.reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );

    if (maxTemp > 38) {
      return {
        level: "High",
        icon: "🔥",
        message:
          "High temperatures are expected. Monitor crops for heat stress and maintain adequate soil moisture.",
      };
    }

    if (totalRain > 50) {
      return {
        level: "High",
        icon: "🌧️",
        message:
          "Significant rainfall is expected. Monitor drainage and avoid unnecessary irrigation.",
      };
    }

    if (totalRain < 5 && maxTemp > 32) {
      return {
        level: "Moderate",
        icon: "☀️",
        message:
          "Low rainfall and warmer temperatures may increase irrigation requirements.",
      };
    }

    return {
      level: "Low",
      icon: "✅",
      message:
        "Upcoming weather conditions appear generally favorable for farming activities.",
    };
  };

  const weatherRisk = getWeatherRisk();

  // =========================================
  // FARM HEALTH
  // =========================================

  const getFarmHealth = () => {
    if (!dashboardWeather) {
      return {
        status: "Analyzing...",
        icon: "🔄",
        score: 0,
        message: "Analyzing current farm conditions.",
      };
    }

    let score = 100;

    const moisture = Number(soilMoisture);
    const temperature = Number(dashboardWeather.temperature_2m);
    const humidity = Number(dashboardWeather.relative_humidity_2m);
    const rainfall = Number(dashboardWeather.precipitation);

    if (moisture < 30) score -= 20;
    else if (moisture < 40) score -= 10;
    else if (moisture > 80) score -= 15;
    else if (moisture > 70) score -= 5;

    if (temperature > 38) score -= 15;
    else if (temperature > 35) score -= 5;
    else if (temperature < 10) score -= 10;

    if (humidity > 90) score -= 10;
    else if (humidity > 85) score -= 5;
    else if (humidity < 25) score -= 5;

    if (rainfall > 10) score -= 10;
    else if (rainfall > 5) score -= 5;

    if (soilData) {
      const nitrogen = Number(soilData.nitrogen);
      const phosphorus = Number(soilData.phosphorus);
      const potassium = Number(soilData.potassium);
      const ph = Number(soilData.ph);

      if (nitrogen < 40 || nitrogen > 140) score -= 5;
      if (phosphorus < 20 || phosphorus > 100) score -= 5;
      if (potassium < 20 || potassium > 100) score -= 5;
      if (ph < 5.5 || ph > 8) score -= 10;
    }

    if (diseaseResult) {
      const status = String(
        diseaseResult.status || ""
      ).toLowerCase();

      const disease = String(
        diseaseResult.disease || ""
      ).toLowerCase();

      const isHealthy =
        status.includes("healthy") ||
        disease.includes("healthy") ||
        disease.includes("no disease");

      if (!isHealthy) score -= 20;
    }

    score = Math.max(0, Math.min(100, score));

    let status = "Healthy";
    let icon = "🌱";
    let message =
      "Current soil moisture and environmental conditions are favorable for crop growth.";

    if (score < 50) {
      status = "Needs Attention";
      icon = "⚠️";
      message =
        "Your farm may need attention. Check soil, moisture, and environmental conditions.";
    } else if (score < 70) {
      status = "Monitor Conditions";
      icon = "👀";
      message =
        "Some farm conditions need monitoring. Check your soil and weather conditions.";
    } else if (score < 85) {
      status = "Moderate";
      icon = "🌿";
      message =
        "Farm conditions are moderate. Continue monitoring your soil and weather.";
    }

    return { status, icon, score, message };
  };

  const farmHealth = getFarmHealth();

  // =========================================
  // HEALTH FACTORS
  // =========================================

  const getHealthFactor = (type) => {
    if (type === "moisture") {
      const moisture = Number(soilMoisture);

      if (moisture < 30) return { status: "Low", icon: "⚠️" };
      if (moisture < 40) return { status: "Below Optimal", icon: "🟡" };
      if (moisture <= 70) return { status: "Optimal", icon: "✅" };
      if (moisture <= 80) return { status: "High", icon: "🟡" };
      return { status: "Too High", icon: "⚠️" };
    }

    if (type === "temperature") {
      if (!dashboardWeather) return { status: "Loading...", icon: "🔄" };

      const temperature = Number(dashboardWeather.temperature_2m);

      if (temperature < 10 || temperature > 38)
        return { status: "Critical", icon: "⚠️" };

      if (temperature > 35)
        return { status: "Warm", icon: "🟡" };

      return { status: "Suitable", icon: "✅" };
    }

    if (type === "humidity") {
      if (!dashboardWeather) return { status: "Loading...", icon: "🔄" };

      const humidity = Number(
        dashboardWeather.relative_humidity_2m
      );

      if (humidity < 25 || humidity > 90)
        return { status: "High Risk", icon: "⚠️" };

      if (humidity > 85)
        return { status: "High", icon: "🟡" };

      return { status: "Normal", icon: "✅" };
    }

    if (type === "rainfall") {
      if (!dashboardWeather) return { status: "Loading...", icon: "🔄" };

      const rainfall = Number(dashboardWeather.precipitation);

      if (rainfall > 10)
        return { status: "High", icon: "⚠️" };

      if (rainfall > 5)
        return { status: "Moderate", icon: "🟡" };

      return { status: "Normal", icon: "✅" };
    }

    if (type === "soil") {
      if (!soilData)
        return { status: "Not Analyzed", icon: "⚪" };

      const nitrogen = Number(soilData.nitrogen);
      const phosphorus = Number(soilData.phosphorus);
      const potassium = Number(soilData.potassium);
      const ph = Number(soilData.ph);
      const issues = [];

      if (nitrogen < 40 || nitrogen > 140) issues.push("N");
      if (phosphorus < 20 || phosphorus > 100) issues.push("P");
      if (potassium < 20 || potassium > 100) issues.push("K");
      if (ph < 5.5 || ph > 8) issues.push("pH");

      if (issues.length > 0)
        return {
          status: `Check ${issues.join(", ")}`,
          icon: "⚠️",
        };

      return { status: "Balanced", icon: "✅" };
    }

    if (type === "crop") {
      if (!diseaseResult)
        return { status: "Not Analyzed", icon: "⚪" };

      const status = String(
        diseaseResult.status || ""
      ).toLowerCase();

      const disease = String(
        diseaseResult.disease || ""
      ).toLowerCase();

      const healthy =
        status.includes("healthy") ||
        disease.includes("healthy") ||
        disease.includes("no disease");

      return healthy
        ? { status: "Healthy", icon: "✅" }
        : { status: "Disease Detected", icon: "⚠️" };
    }

    return { status: "Unknown", icon: "ℹ️" };
  };

  const healthMoisture = getHealthFactor("moisture");
  const healthTemperature = getHealthFactor("temperature");
  const healthHumidity = getHealthFactor("humidity");
  const healthRainfall = getHealthFactor("rainfall");
  const healthSoil = getHealthFactor("soil");
  const healthCrop = getHealthFactor("crop");

  // =========================================
  // STEP 3 - SMART ALERTS
  // =========================================

  const getSmartAlerts = () => {
    const alerts = [];

    const moisture = Number(soilMoisture);

    const temperature = dashboardWeather
      ? Number(dashboardWeather.temperature_2m)
      : null;

    const humidity = dashboardWeather
      ? Number(dashboardWeather.relative_humidity_2m)
      : null;

    const rainfall = dashboardWeather
      ? Number(dashboardWeather.precipitation)
      : null;

    if (moisture < 30) {
      alerts.push({
        type: "warning",
        icon: "💧",
        title: "Low Soil Moisture",
        message:
          "Soil moisture is low. Consider irrigation to prevent crop stress.",
      });
    } else if (moisture > 80) {
      alerts.push({
        type: "warning",
        icon: "💧",
        title: "High Soil Moisture",
        message:
          "Soil moisture is high. Avoid unnecessary irrigation and monitor drainage.",
      });
    } else {
      alerts.push({
        type: "success",
        icon: "💧",
        title: "Soil Moisture Normal",
        message:
          "Current soil moisture is within a suitable range.",
      });
    }

    if (temperature !== null) {
      if (temperature > 38) {
        alerts.push({
          type: "warning",
          icon: "🌡️",
          title: "High Temperature",
          message:
            "High temperature detected. Monitor crops for heat stress and maintain adequate irrigation.",
        });
      } else if (temperature < 10) {
        alerts.push({
          type: "warning",
          icon: "🥶",
          title: "Low Temperature",
          message:
            "Low temperature detected. Monitor crops for cold-related stress.",
        });
      } else {
        alerts.push({
          type: "success",
          icon: "🌡️",
          title: "Temperature Suitable",
          message:
            "Current temperature is suitable for normal crop monitoring.",
        });
      }
    }

    if (rainfall !== null) {
      if (rainfall > 10) {
        alerts.push({
          type: "info",
          icon: "🌧️",
          title: "High Rainfall",
          message:
            "Rainfall is high. Reduce or delay irrigation if the soil is already wet.",
        });
      } else if (rainfall > 5) {
        alerts.push({
          type: "info",
          icon: "🌦️",
          title: "Moderate Rainfall",
          message:
            "Moderate rainfall detected. Check soil moisture before irrigation.",
        });
      }
    }

    if (humidity !== null && humidity > 85) {
      alerts.push({
        type: "warning",
        icon: "💨",
        title: "High Humidity",
        message:
          "High humidity detected. Monitor crops regularly for possible disease conditions.",
      });
    }

    if (soilData) {
      const nitrogen = Number(soilData.nitrogen);
      const phosphorus = Number(soilData.phosphorus);
      const potassium = Number(soilData.potassium);
      const ph = Number(soilData.ph);

      if (nitrogen < 40) {
        alerts.push({
          type: "info",
          icon: "🧪",
          title: "Low Nitrogen",
          message:
            "Nitrogen level is low. Check the fertilizer recommendation.",
        });
      }

      if (phosphorus < 20) {
        alerts.push({
          type: "info",
          icon: "🧪",
          title: "Low Phosphorus",
          message:
            "Phosphorus level is low. Review the fertilizer recommendation.",
        });
      }

      if (potassium < 20) {
        alerts.push({
          type: "info",
          icon: "🧪",
          title: "Low Potassium",
          message:
            "Potassium level is low. Review the fertilizer recommendation.",
        });
      }

      if (ph < 5.5 || ph > 8) {
        alerts.push({
          type: "warning",
          icon: "⚗️",
          title: "Soil pH Needs Attention",
          message:
            "Soil pH is outside the monitored range. Review your soil analysis.",
        });
      }
    }

    if (diseaseResult) {
      const status = String(
        diseaseResult.status || ""
      ).toLowerCase();

      const disease = String(
        diseaseResult.disease || ""
      ).toLowerCase();

      const isHealthy =
        status.includes("healthy") ||
        disease.includes("healthy") ||
        disease.includes("no disease");

      if (!isHealthy) {
        alerts.push({
          type: "danger",
          icon: "🦠",
          title: "Crop Disease Detected",
          message:
            diseaseResult.disease ||
            "The AI disease detection system identified a possible crop disease.",
        });
      } else {
        alerts.push({
          type: "success",
          icon: "🌱",
          title: "Crop Health Good",
          message:
            "The latest AI disease analysis indicates healthy crop conditions.",
        });
      }
    }

    return alerts;
  };

  const smartAlerts = getSmartAlerts();

  // =========================================
  // IRRIGATION INTELLIGENCE
  // =========================================

  const getIrrigationStatus = () => {
    if (!dashboardWeather) {
      return {
        status: "Analyzing...",
        icon: "🔄",
        message:
          "Checking current weather and soil conditions.",
      };
    }

    const moisture = Number(soilMoisture);
    const rainfall = Number(dashboardWeather.precipitation);
    const temperature = Number(dashboardWeather.temperature_2m);

    if (rainfall > 5) {
      return {
        status: "Not Required",
        icon: "🌧️",
        message:
          "Rainfall is currently sufficient. Avoid unnecessary irrigation.",
      };
    }

    if (moisture > 70) {
      return {
        status: "Not Required",
        icon: "💧",
        message:
          "Soil moisture is already high. Avoid irrigation and monitor drainage.",
      };
    }

    if (moisture < 30) {
      return {
        status: "Urgent",
        icon: "🚨",
        message:
          "Soil moisture is critically low. Irrigation should be considered soon.",
      };
    }

    if (moisture < 40 && temperature > 32) {
      return {
        status: "Recommended",
        icon: "🚿",
        message:
          "Low soil moisture combined with high temperature. Irrigation is recommended.",
      };
    }

    if (moisture < 40) {
      return {
        status: "Recommended",
        icon: "🚿",
        message:
          "Soil moisture is below the preferred range. Consider irrigation.",
      };
    }

    return {
      status: "Not Required",
      icon: "✅",
      message:
        "Current soil moisture is within a suitable range. Continue monitoring.",
    };
  };

  const irrigationStatus = getIrrigationStatus();

  // =========================================
  // AI CROP RECOMMENDATION
  // =========================================

  useEffect(() => {
    if (!dashboardWeather || !soilData) {
      setCropRecommendation(null);
      return;
    }

    const requestCropRecommendation = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/crop-recommendation",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nitrogen: Number(soilData.nitrogen),
              phosphorus: Number(soilData.phosphorus),
              potassium: Number(soilData.potassium),
              temperature: Number(
                dashboardWeather.temperature_2m
              ),
              humidity: Number(
                dashboardWeather.relative_humidity_2m
              ),
              ph: Number(soilData.ph),
              rainfall: Number(
                dashboardWeather.precipitation
              ),
              soilType: soilData.soilType,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Crop recommendation API failed");
        }

        const data = await response.json();

        console.log(
          "🌱 Dashboard AI Crop Recommendation:",
          data
        );

        setCropRecommendation(data);
      } catch (error) {
        console.error(
          "Dashboard crop recommendation failed:",
          error
        );
        setCropRecommendation(null);
      }
    };

    requestCropRecommendation();
  }, [dashboardWeather, soilData]);

  // =========================================
  // FERTILIZER RECOMMENDATION
  // =========================================

  useEffect(() => {
    if (!soilData) {
      setFertilizerRecommendation(null);
      return;
    }

    fetch(
      "http://localhost:5000/api/fertilizer-recommendation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nitrogen: Number(soilData.nitrogen),
          phosphorus: Number(soilData.phosphorus),
          potassium: Number(soilData.potassium),
          ph: Number(soilData.ph),
          moisture: Number(soilData.moisture),
          soilType: soilData.soilType,
        }),
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Fertilizer API request failed"
          );
        }
        return response.json();
      })
      .then((data) => {
        setFertilizerRecommendation(data.recommendation);
      })
      .catch((error) => {
        console.error(
          "Dashboard fertilizer recommendation failed:",
          error
        );
        setFertilizerRecommendation(null);
      });
  }, [soilData]);

  // =========================================
  // SOIL MOISTURE UPDATE
  // =========================================

  useEffect(() => {
    const updateSoilMoisture = () => {
      const savedMoisture =
        localStorage.getItem("soilMoisture");

      if (savedMoisture !== null) {
        setSoilMoisture(savedMoisture);
      }
    };

    window.addEventListener(
      "soilMoistureUpdated",
      updateSoilMoisture
    );

    return () => {
      window.removeEventListener(
        "soilMoistureUpdated",
        updateSoilMoisture
      );
    };
  }, []);

  // =========================================
  // SOIL DATA UPDATE
  // =========================================

  useEffect(() => {
    const updateSoilData = () => {
      try {
        const savedSoilData =
          localStorage.getItem("soilData");

        if (savedSoilData) {
          setSoilData(JSON.parse(savedSoilData));
        }
      } catch (error) {
        console.error(
          "Failed to update soil data:",
          error
        );
      }
    };

    window.addEventListener(
      "soilDataUpdated",
      updateSoilData
    );

    return () => {
      window.removeEventListener(
        "soilDataUpdated",
        updateSoilData
      );
    };
  }, []);

  // =========================================
  // RENDER
  // =========================================

  const weatherCondition = dashboardWeather
    ? getWeatherCondition(dashboardWeather.weather_code)
    : {
        icon: "🌤️",
        text: "Loading...",
      };

  return (
    <div className="dashboard">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">
          🌱 SmartAgri
        </div>

        <nav>

          <a
            className={page === "dashboard" ? "active" : ""}
            onClick={() => setPage("dashboard")}
          >
            📊 Dashboard
          </a>

          <a
            className={page === "crop" ? "active" : ""}
            onClick={() => setPage("crop")}
          >
            🌾 Crop Recommendation
          </a>

          <a
            className={page === "disease" ? "active" : ""}
            onClick={() => setPage("disease")}
          >
            🔬 Disease Detection
          </a>

          <a
            className={page === "irrigation" ? "active" : ""}
            onClick={() => setPage("irrigation")}
          >
            💧 Smart Irrigation
          </a>

          <a
            className={page === "weather" ? "active" : ""}
            onClick={() => setPage("weather")}
          >
            ☁️ Weather
          </a>

          <a
            className={page === "soil" ? "active" : ""}
            onClick={() => setPage("soil")}
          >
            🌱 Soil Analysis
          </a>

          <a
            className={page === "fertilizer" ? "active" : ""}
            onClick={() => setPage("fertilizer")}
          >
            🌿 Fertilizer Recommendation
          </a>

          <a
            className={page === "farm" ? "active" : ""}
            onClick={() => setPage("farm")}
          >
            🚜 My Farm
          </a>

        </nav>

        <div className="sidebar-bottom">

          <a
            className={page === "settings" ? "active" : ""}
            onClick={() => setPage("settings")}
          >
            ⚙️ Settings
          </a>

          <a
            onClick={() => {
              localStorage.removeItem("soilMoisture");
              localStorage.removeItem("soilData");
              localStorage.removeItem("diseaseResult");
              setPage("dashboard");
              window.location.reload();
            }}
          >
            🚪 Logout
          </a>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="dashboard-main">

        {/* DASHBOARD */}

        {page === "dashboard" && (
          <>

            {/* HEADER */}

            <header className="dashboard-header">

              <div>

                <p className="small-title">
                  SMART AGRICULTURE
                </p>

                <h1>
                  Good Morning, Farmer 👋
                </h1>

                <p className="dashboard-subtitle">
                  Here is your farm overview for today.
                </p>

                {backendMessage && (
                  <p className="dashboard-subtitle">
                    🟢 {backendMessage}
                  </p>
                )}

              </div>

              <div className="profile">

                👨‍🌾

                <div>
                  <strong>Farmer</strong>
                  <span>SmartAgri User</span>
                </div>

              </div>

            </header>

            {/* STATISTICS */}

            <section className="dashboard-stats">

              <div className="dashboard-card">
                <div className="card-icon">🌡️</div>
                <p>Temperature</p>
                <h2>
                  {dashboardWeather
                    ? `${dashboardWeather.temperature_2m}°C`
                    : "--"}
                </h2>
                <span>Live</span>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">💧</div>
                <p>Soil Moisture</p>
                <h2>{soilMoisture}%</h2>
                <span>From Soil Analysis</span>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">☁️</div>
                <p>Humidity</p>
                <h2>
                  {dashboardWeather
                    ? `${dashboardWeather.relative_humidity_2m}%`
                    : "--"}
                </h2>
                <span>Live</span>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">🌧️</div>
                <p>Rainfall</p>
                <h2>
                  {dashboardWeather
                    ? `${dashboardWeather.precipitation} mm`
                    : "--"}
                </h2>
                <span>Live</span>
              </div>

              <div
                className="dashboard-card clickable-card"
                onClick={() => setPage("farm")}
              >
                <div className="card-icon">🚜</div>
                <p>My Farms</p>
                <h2>{farmCount}</h2>
                <span>Registered →</span>
              </div>

            </section>

            {/* MAIN DASHBOARD GRID */}

            <section className="dashboard-grid">

              {/* ANALYTICS */}

              <div className="dashboard-panel analytics-panel">

                <div className="panel-header">

                  <div>
                    <span className="section-label">
                      SMART ANALYTICS
                    </span>

                    <h2>Farm Analytics</h2>
                  </div>

                  <span className="ai-badge">
                    LIVE
                  </span>

                </div>

                <div className="analytics-grid">

                  <div className="analytics-card">
                    <span className="analytics-icon">💧</span>
                    <p>Soil Moisture</p>
                    <h3>{soilMoisture}%</h3>
                    <span className="analytics-status">
                      {Number(soilMoisture) < 30
                        ? "Low"
                        : Number(soilMoisture) > 70
                        ? "High"
                        : "Optimal"}
                    </span>
                  </div>

                  <div className="analytics-card">
                    <span className="analytics-icon">🌡️</span>
                    <p>Temperature</p>
                    <h3>
                      {dashboardWeather
                        ? `${dashboardWeather.temperature_2m}°C`
                        : "--"}
                    </h3>
                    <span className="analytics-status">
                      Live
                    </span>
                  </div>

                  <div className="analytics-card">
                    <span className="analytics-icon">💨</span>
                    <p>Humidity</p>
                    <h3>
                      {dashboardWeather
                        ? `${dashboardWeather.relative_humidity_2m}%`
                        : "--"}
                    </h3>
                    <span className="analytics-status">
                      Live
                    </span>
                  </div>

                  <div className="analytics-card">
                    <span className="analytics-icon">🌧️</span>
                    <p>Rainfall</p>
                    <h3>
                      {dashboardWeather
                        ? `${dashboardWeather.precipitation} mm`
                        : "--"}
                    </h3>
                    <span className="analytics-status">
                      Live
                    </span>
                  </div>

                </div>

              </div>

              {/* FARM HEALTH */}

              <div className="dashboard-panel farm-health-panel">

                <div className="panel-header">

                  <div>
                    <span className="section-label">
                      FARM INTELLIGENCE
                    </span>

                    <h2>
                      Farm Health Overview
                    </h2>
                  </div>

                  <div className="health-status">
                    <span>
                      {farmHealth.status === "Healthy" ||
                      farmHealth.status === "Moderate"
                        ? "🟢"
                        : farmHealth.status === "Monitor Conditions"
                        ? "🟡"
                        : farmHealth.status === "Needs Attention"
                        ? "🔴"
                        : "🔄"}
                    </span>

                    {farmHealth.status}
                  </div>

                </div>

                <div className="farm-health-content">

                  <div className="health-score">

                    <div className="health-circle">
                      <strong>{farmHealth.score}</strong>
                      <span>/100</span>
                    </div>

                    <div>
                      <h3>{farmHealth.status}</h3>
                      <p>{farmHealth.message}</p>
                    </div>

                  </div>

                  <div className="health-checks">

                    <div className="health-check">
                      <span>💧</span>
                      <div>
                        <strong>Soil Moisture</strong>
                        <p>{Number(soilMoisture)}%</p>
                        <small>
                          {Number(soilMoisture) >= 40 &&
                          Number(soilMoisture) <= 70
                            ? "Optimal"
                            : Number(soilMoisture) < 40
                            ? "Low"
                            : "High"}
                        </small>
                      </div>
                    </div>

                    <div className="health-check">
                      <span>🌡️</span>
                      <div>
                        <strong>Temperature</strong>
                        <p>
                          {dashboardWeather
                            ? `${Number(
                                dashboardWeather.temperature_2m
                              ).toFixed(1)}°C`
                            : "--"}
                        </p>
                        <small>
                          {dashboardWeather
                            ? Number(
                                dashboardWeather.temperature_2m
                              ) <= 35
                              ? "Suitable"
                              : Number(
                                  dashboardWeather.temperature_2m
                                ) <= 38
                              ? "Warm"
                              : "High"
                            : "Loading..."}
                        </small>
                      </div>
                    </div>

                    <div className="health-check">
                      <span>💨</span>
                      <div>
                        <strong>Humidity</strong>
                        <p>
                          {dashboardWeather
                            ? `${Number(
                                dashboardWeather.relative_humidity_2m
                              ).toFixed(0)}%`
                            : "--"}
                        </p>
                        <small>
                          {dashboardWeather
                            ? Number(
                                dashboardWeather.relative_humidity_2m
                              ) >= 40 &&
                              Number(
                                dashboardWeather.relative_humidity_2m
                              ) <= 85
                              ? "Normal"
                              : Number(
                                  dashboardWeather.relative_humidity_2m
                                ) > 85
                              ? "High"
                              : "Low"
                            : "Loading..."}
                        </small>
                      </div>
                    </div>

                    <div className="health-check">
                      <span>🌧️</span>
                      <div>
                        <strong>Rainfall</strong>
                        <p>
                          {dashboardWeather
                            ? `${Number(
                                dashboardWeather.precipitation
                              ).toFixed(1)} mm`
                            : "--"}
                        </p>
                        <small>
                          {dashboardWeather
                            ? Number(
                                dashboardWeather.precipitation
                              ) > 10
                              ? "High"
                              : Number(
                                  dashboardWeather.precipitation
                                ) > 5
                              ? "Moderate"
                              : "Normal"
                            : "Loading..."}
                        </small>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

              {/* HEALTH FACTORS */}

              <div className="dashboard-panel health-factors-panel">

                <div className="panel-header">

                  <div>
                    <span className="section-label">
                      AI HEALTH ANALYSIS
                    </span>

                    <h2>Health Factors</h2>

                    <p className="dashboard-subtitle">
                      SmartAgri analyzes your farm conditions
                      to explain the current health score.
                    </p>
                  </div>

                  <span className="ai-badge">
                    AI
                  </span>

                </div>

                <div className="health-checks">

                  <div className="health-check">
                    <span>{healthMoisture.icon}</span>
                    <div>
                      <strong>💧 Soil Moisture</strong>
                      <p>{healthMoisture.status}</p>
                    </div>
                  </div>

                  <div className="health-check">
                    <span>{healthTemperature.icon}</span>
                    <div>
                      <strong>🌡️ Temperature</strong>
                      <p>{healthTemperature.status}</p>
                    </div>
                  </div>

                  <div className="health-check">
                    <span>{healthHumidity.icon}</span>
                    <div>
                      <strong>💨 Humidity</strong>
                      <p>{healthHumidity.status}</p>
                    </div>
                  </div>

                  <div className="health-check">
                    <span>{healthRainfall.icon}</span>
                    <div>
                      <strong>🌧️ Rainfall</strong>
                      <p>{healthRainfall.status}</p>
                    </div>
                  </div>

                  <div className="health-check">
                    <span>{healthSoil.icon}</span>
                    <div>
                      <strong>🧪 Soil NPK &amp; pH</strong>
                      <p>{healthSoil.status}</p>
                    </div>
                  </div>

                  <div className="health-check">
                    <span>{healthCrop.icon}</span>
                    <div>
                      <strong>🌱 Crop Health</strong>
                      <p>{healthCrop.status}</p>
                    </div>
                  </div>

                </div>

              </div>

              {/* SMART ALERTS */}

              <div className="dashboard-panel smart-alerts-panel">

                <div className="panel-header">

                  <div>
                    <span className="section-label">
                      SMART FARM MONITORING
                    </span>

                    <h2>
                      Alerts &amp; Recommendations
                    </h2>

                    <p className="dashboard-subtitle">
                      SmartAgri continuously checks your
                      farm conditions and provides useful
                      recommendations.
                    </p>
                  </div>

                  <span className="ai-badge">
                    AI
                  </span>

                </div>

                <div className="smart-alerts-list">

                  {smartAlerts.map((alert, index) => (
                    <div
                      className={`smart-alert ${alert.type}`}
                      key={`${alert.title}-${index}`}
                    >

                      <div className="smart-alert-icon">
                        {alert.icon}
                      </div>

                      <div className="smart-alert-content">
                        <strong>
                          {alert.title}
                        </strong>

                        <p>
                          {alert.message}
                        </p>
                      </div>

                    </div>
                  ))}

                </div>

              </div>

              {/* IRRIGATION */}

              <div className="dashboard-panel irrigation-intelligence-panel">

                <div className="panel-header">

                  <div>
                    <span className="section-label">
                      SMART FARM AI
                    </span>

                    <h2>
                      Irrigation Intelligence
                    </h2>
                  </div>

                  <div className="irrigation-status-badge">
                    {irrigationStatus.icon}{" "}
                    {irrigationStatus.status}
                  </div>

                </div>

                <div className="irrigation-content">

                  <div className="irrigation-main">

                    <div className="irrigation-icon">
                      {irrigationStatus.icon}
                    </div>

                    <div>
                      <span className="irrigation-label">
                        CURRENT RECOMMENDATION
                      </span>

                      <h3>
                        {irrigationStatus.status}
                      </h3>

                      <p>
                        {irrigationStatus.message}
                      </p>
                    </div>

                  </div>

                  <div className="irrigation-data">

                    <div>
                      <span>Soil Moisture</span>
                      <strong>{soilMoisture}%</strong>
                    </div>

                    <div>
                      <span>Rainfall</span>
                      <strong>
                        {dashboardWeather
                          ? `${dashboardWeather.precipitation} mm`
                          : "--"}
                      </strong>
                    </div>

                    <div>
                      <span>Temperature</span>
                      <strong>
                        {dashboardWeather
                          ? `${dashboardWeather.temperature_2m}°C`
                          : "--"}
                      </strong>
                    </div>

                  </div>

                </div>

              </div>

              {/* 7 DAY FORECAST */}

              <div className="dashboard-panel forecast-panel">

                <div className="panel-header">

                  <div>
                    <span className="section-label">
                      WEATHER INTELLIGENCE
                    </span>

                    <h2>
                      7-Day Forecast
                    </h2>
                  </div>

                  <div className="weather-risk-badge">
                    {weatherRisk.icon}{" "}
                    {weatherRisk.level} Risk
                  </div>

                </div>

                <div className="forecast-risk">
                  <strong>
                    Agricultural Weather Risk
                  </strong>

                  <p>
                    {weatherRisk.message}
                  </p>
                </div>

                {weatherForecast &&
                  weatherForecast.time &&
                  weatherForecast.time.length > 0 && (
                    <div className="forecast-grid">

                      {weatherForecast.time.map(
                        (date, index) => {

                          const dayName =
                            index === 0
                              ? "Today"
                              : new Date(date).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "short",
                                  }
                                );

                          return (
                            <div
                              className="forecast-card"
                              key={date}
                            >

                              <span className="forecast-day">
                                {dayName}
                              </span>

                              <span className="forecast-icon">
                                {getForecastCondition(
                                  weatherForecast.weather_code[index]
                                )}
                              </span>

                              <div className="forecast-temperature">

                                <strong>
                                  {Math.round(
                                    weatherForecast.temperature_2m_max[index]
                                  )}
                                  °
                                </strong>

                                <span>
                                  {Math.round(
                                    weatherForecast.temperature_2m_min[index]
                                  )}
                                  °
                                </span>

                              </div>

                              <span className="forecast-rain">
                                🌧️{" "}
                                {
                                  weatherForecast.precipitation_sum[index]
                                }{" "}
                                mm
                              </span>

                            </div>
                          );
                        }
                      )}

                    </div>
                  )}

              </div>

              {/* CROP RECOMMENDATION */}

              <div className="dashboard-panel">

                <div className="panel-header">

                  <div>
                    <p className="small-title">
                      AI ASSISTANT
                    </p>

                    <h2>
                      Crop Recommendation
                    </h2>
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

                    <div className="crop-ai-result">

                      <div className="crop-result-header">

                        <div>
                          <span className="ai-result-label">
                            AI RECOMMENDATION
                          </span>

                          <h3>
                            {cropRecommendation
                              ?.recommendation
                              ?.crop ||
                              (soilData
                                ? "Analyzing..."
                                : "Complete Soil Analysis")}
                          </h3>
                        </div>

                        <span className="ai-status">
                          🤖 AI
                        </span>

                      </div>

                      <p className="crop-reason">
                        {cropRecommendation
                          ?.recommendation
                          ?.reason ||
                          (soilData
                            ? "Analyzing your latest soil and environmental conditions..."
                            : "Complete Soil Analysis to receive a crop recommendation.")}
                      </p>

                      <div className="crop-input-summary">

                        <div>
                          <span>N</span>
                          <strong>
                            {soilData?.nitrogen ?? "--"}
                          </strong>
                        </div>

                        <div>
                          <span>P</span>
                          <strong>
                            {soilData?.phosphorus ?? "--"}
                          </strong>
                        </div>

                        <div>
                          <span>K</span>
                          <strong>
                            {soilData?.potassium ?? "--"}
                          </strong>
                        </div>

                        <div>
                          <span>pH</span>
                          <strong>
                            {soilData?.ph ?? "--"}
                          </strong>
                        </div>

                        <div>
                          <span>Moisture</span>
                          <strong>
                            {soilData?.moisture != null
                              ? `${soilData.moisture}%`
                              : "--"}
                          </strong>
                        </div>

                      </div>

                    </div>

                    <div className="confidence">
                      <span>Confidence</span>

                      <strong>
                        {cropRecommendation
                          ?.recommendation
                          ?.confidence
                          ? `${cropRecommendation.recommendation.confidence}%`
                          : "--"}
                      </strong>
                    </div>

                    <div className="progress">
                      <div
                        style={{
                          width: `${
                            cropRecommendation
                              ?.recommendation
                              ?.confidence || 0
                          }%`,
                        }}
                      ></div>
                    </div>

                  </div>

                </div>

                <button
                  className="primary-btn"
                  onClick={() => setPage("crop")}
                >
                  View Recommendation →
                </button>

              </div>

              {/* FERTILIZER INTELLIGENCE */}

              <div className="dashboard-panel">

                <div className="panel-header">

                  <div>
                    <p className="small-title">
                      AI ASSISTANT
                    </p>

                    <h2>
                      Fertilizer Intelligence
                    </h2>
                  </div>

                  <span className="ai-badge">
                    AI
                  </span>

                </div>

                <div className="fertilizer-result">

                  <div className="fertilizer-icon">
                    🌿
                  </div>

                  <div>

                    <span className="ai-result-label">
                      RECOMMENDED FERTILIZER
                    </span>

                    <h3>
                      {fertilizerRecommendation?.fertilizer ||
                        (soilData
                          ? "Analyzing..."
                          : "Complete Soil Analysis")}
                    </h3>

                    <p>
                      {fertilizerRecommendation?.reason ||
                        "Complete Soil Analysis to receive an AI fertilizer recommendation."}
                    </p>

                  </div>

                </div>

                {fertilizerRecommendation && (
                  <div className="fertilizer-details">

                    <div>
                      <span>Nitrogen</span>
                      <strong>
                        {fertilizerRecommendation.nitrogen}
                      </strong>
                    </div>

                    <div>
                      <span>Phosphorus</span>
                      <strong>
                        {fertilizerRecommendation.phosphorus}
                      </strong>
                    </div>

                    <div>
                      <span>Potassium</span>
                      <strong>
                        {fertilizerRecommendation.potassium}
                      </strong>
                    </div>

                    <div>
                      <span>Soil pH</span>
                      <strong>
                        {fertilizerRecommendation.ph}
                      </strong>
                    </div>

                  </div>
                )}

                {fertilizerRecommendation && (
                  <div className="fertilizer-usage">

                    <strong>
                      💡 Application Guidance
                    </strong>

                    <p>
                      {fertilizerRecommendation.usage}
                    </p>

                  </div>
                )}

                <button
                  className="primary-btn"
                  onClick={() => setPage("fertilizer")}
                >
                  View Fertilizer Recommendation →
                </button>

              </div>

              {/* DISEASE INTELLIGENCE */}

              <div className="dashboard-panel">

                <div className="panel-header">

                  <div>
                    <p className="small-title">
                      AI CROP HEALTH
                    </p>

                    <h2>
                      Disease Detection
                    </h2>
                  </div>

                  <span className="ai-badge">
                    AI
                  </span>

                </div>

                <div className="disease-result">

                  <div className="disease-icon">
                    🔬
                  </div>

                  <div>

                    <span className="ai-result-label">
                      LATEST AI ANALYSIS
                    </span>

                    <h3>
                      {diseaseResult?.disease ||
                        "No Analysis Yet"}
                    </h3>

                    <p>
                      {diseaseResult
                        ? diseaseResult.recommendation ||
                          "AI disease analysis completed."
                        : "Upload a crop leaf image in Disease Detection to analyze crop health."}
                    </p>

                  </div>

                </div>

                {diseaseResult && (
                  <div className="disease-details">

                    <div>
                      <span>Crop</span>
                      <strong>
                        {diseaseResult.crop || "--"}
                      </strong>
                    </div>

                    <div>
                      <span>Status</span>
                      <strong>
                        {diseaseResult.status || "--"}
                      </strong>
                    </div>

                    <div>
                      <span>Confidence</span>
                      <strong>
                        {diseaseResult.confidence
                          ? `${diseaseResult.confidence}%`
                          : "--"}
                      </strong>
                    </div>

                  </div>
                )}

                <button
                  className="primary-btn"
                  onClick={() => setPage("disease")}
                >
                  Open Disease Detection →
                </button>

              </div>

              {/* CURRENT WEATHER */}

              <div className="dashboard-panel">

                <div className="panel-header">

                  <div>
                    <p className="small-title">
                      WEATHER
                    </p>

                    <h2>
                      Today's Weather
                    </h2>
                  </div>

                  <span className="weather-icon">
                    {weatherCondition.icon}
                  </span>

                </div>

                <div className="weather-main">

                  <strong>
                    {dashboardWeather
                      ? `${dashboardWeather.temperature_2m}°C`
                      : "--"}
                  </strong>

                  <span>
                    {weatherCondition.text}
                  </span>

                </div>

                <div className="weather-details">

                  <div>
                    <span>Humidity</span>
                    <strong>
                      {dashboardWeather
                        ? `${dashboardWeather.relative_humidity_2m}%`
                        : "--"}
                    </strong>
                  </div>

                  <div>
                    <span>Wind</span>
                    <strong>
                      {dashboardWeather
                        ? `${dashboardWeather.wind_speed_10m} km/h`
                        : "--"}
                    </strong>
                  </div>

                  <div>
                    <span>Rain</span>
                    <strong>
                      {dashboardWeather
                        ? `${dashboardWeather.precipitation} mm`
                        : "--"}
                    </strong>
                  </div>

                </div>

              </div>

            </section>

            {/* SMART RECOMMENDATIONS */}

            <section className="dashboard-panel recommendations">

              <div className="panel-header">

                <div>
                  <p className="small-title">
                    SMART INSIGHTS
                  </p>

                  <h2>
                    Today's Recommendations
                  </h2>
                </div>

                <span>✨</span>

              </div>

              <div className="recommendation-list">

                <div className="recommendation-item">

                  <span>💧</span>

                  <div>
                    <strong>Irrigation</strong>

                    <p>
                      {dashboardWeather
                        ? dashboardWeather.precipitation > 2
                          ? "Rainfall is currently present. Irrigation may not be required."
                          : "No significant rainfall detected. Check soil moisture before irrigation."
                        : "Checking current weather conditions..."}
                    </p>
                  </div>

                </div>

                <div className="recommendation-item">

                  <span>🌱</span>

                  <div>
                    <strong>Crop Health</strong>

                    <p>
                      {dashboardWeather
                        ? dashboardWeather.temperature_2m > 35
                          ? "High temperature detected. Monitor crops for heat stress and provide adequate irrigation."
                          : dashboardWeather.relative_humidity_2m > 85
                          ? "High humidity detected. Monitor crops for fungal diseases and leaf moisture."
                          : "Current temperature and humidity conditions are favorable for crop health."
                        : "Checking current conditions..."}
                    </p>
                  </div>

                </div>

                <div className="recommendation-item">

                  <span>☁️</span>

                  <div>
                    <strong>Weather Alert</strong>

                    <p>
                      {dashboardWeather
                        ? dashboardWeather.precipitation > 5
                          ? "Heavy rainfall is currently detected. Avoid unnecessary irrigation."
                          : dashboardWeather.precipitation > 0
                          ? "Rainfall is currently detected. Monitor your field conditions."
                          : "No rainfall is currently detected. Continue monitoring the weather."
                        : "Checking current weather conditions..."}
                    </p>
                  </div>

                </div>

              </div>

            </section>

          </>
        )}

        {/* OTHER PAGES */}

        {page === "crop" && <CropRecommendation />}
        {page === "disease" && <DiseaseDetection />}
        {page === "irrigation" && <SmartIrrigation />}
        {page === "weather" && <Weather />}
        {page === "soil" && <SoilAnalysis />}
        {page === "fertilizer" && <FertilizerRecommendation />}
        {page === "farm" && <MyFarm />}

        {page === "settings" && (
          <section className="settings-page">

            <header className="dashboard-header">

              <div>
                <p className="small-title">
                  SMART AGRICULTURE
                </p>

                <h1>
                  Settings ⚙️
                </h1>

                <p className="dashboard-subtitle">
                  Manage your SmartAgri preferences and application data.
                </p>
              </div>

              <div className="profile">
                👨‍🌾

                <div>
                  <strong>Farmer</strong>
                  <span>SmartAgri User</span>
                </div>
              </div>

            </header>

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>
                  <p className="small-title">
                    PROFILE
                  </p>

                  <h2>
                    Farmer Profile
                  </h2>
                </div>

              </div>

              <div className="settings-grid">

                <div className="settings-item">
                  <span>👤 Name</span>
                  <strong>Farmer</strong>
                </div>

                <div className="settings-item">
                  <span>🌱 Platform</span>
                  <strong>SmartAgri</strong>
                </div>

                <div className="settings-item">
                  <span>🤖 AI Features</span>
                  <strong>Enabled</strong>
                </div>

                <div className="settings-item">
                  <span>🌦️ Weather</span>
                  <strong>Live Weather</strong>
                </div>

              </div>

            </div>

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>
                  <p className="small-title">
                    APPLICATION
                  </p>

                  <h2>
                    Preferences
                  </h2>
                </div>

              </div>

              <div className="settings-options">

                <div className="settings-option">

                  <div>
                    <strong>
                      Live Weather Updates
                    </strong>

                    <p>
                      SmartAgri automatically refreshes dashboard weather information.
                    </p>
                  </div>

                  <span className="setting-status">
                    ON
                  </span>

                </div>

                <div className="settings-option">

                  <div>
                    <strong>
                      AI Recommendations
                    </strong>

                    <p>
                      Crop and fertilizer recommendations use your latest soil information.
                    </p>
                  </div>

                  <span className="setting-status">
                    ON
                  </span>

                </div>

                <div className="settings-option">

                  <div>
                    <strong>
                      Saved Farm Data
                    </strong>

                    <p>
                      Farm information is stored through the SmartAgri backend and database.
                    </p>
                  </div>

                  <span className="setting-status">
                    ACTIVE
                  </span>

                </div>

              </div>

            </div>

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>
                  <p className="small-title">
                    ACCOUNT
                  </p>

                  <h2>
                    Session
                  </h2>
                </div>

              </div>

              <p className="dashboard-subtitle">
                Login and account authentication will be connected here in the next development step.
              </p>

              <button
                className="primary-btn"
                onClick={() => setPage("dashboard")}
              >
                ← Back to Dashboard
              </button>

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default App;
