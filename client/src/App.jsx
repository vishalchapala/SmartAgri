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
          console.error(
            "Failed to fetch dashboard weather:",
            error
          );
        });
    };

    // Get weather immediately
    fetchDashboardWeather();

    // Refresh every 10 minutes
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

  window.addEventListener(
    "diseaseResultUpdated",
    updateDiseaseResult
  );

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
    if (code === 0) {
      return {
        icon: "☀️",
        text: "Clear Sky",
      };
    }

    if (code === 1 || code === 2) {
      return {
        icon: "🌤️",
        text: "Partly Cloudy",
      };
    }

    if (code === 3) {
      return {
        icon: "☁️",
        text: "Cloudy",
      };
    }

    if (code >= 45 && code <= 48) {
      return {
        icon: "🌫️",
        text: "Foggy",
      };
    }

    if (code >= 51 && code <= 67) {
      return {
        icon: "🌧️",
        text: "Rainy",
      };
    }

    if (code >= 71 && code <= 77) {
      return {
        icon: "❄️",
        text: "Snowy",
      };
    }

    if (code >= 80 && code <= 82) {
      return {
        icon: "🌦️",
        text: "Rain Showers",
      };
    }

    if (code >= 95) {
      return {
        icon: "⛈️",
        text: "Thunderstorm",
      };
    }

    return {
      icon: "🌤️",
      text: "Unknown",
    };
  };

  // =========================================
  // FORECAST WEATHER ICON
  // =========================================

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
  // CURRENT WEATHER CONDITION
  // =========================================

  const weatherCondition = dashboardWeather
    ? getWeatherCondition(dashboardWeather.weather_code)
    : {
        icon: "🌤️",
        text: "Loading...",
      };

  // =========================================
  // WEATHER RISK
  // =========================================

  const getWeatherRisk = () => {
    if (!weatherForecast) {
      return {
        level: "Analyzing",
        icon: "🔄",
        message:
          "Analyzing upcoming weather conditions.",
      };
    }

    const maxTemperatures =
      weatherForecast.temperature_2m_max || [];

    const rainfallValues =
      weatherForecast.precipitation_sum || [];

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
        message:
          "Analyzing current farm conditions.",
      };
    }

    const moisture = Number(soilMoisture);

    const temperature = Number(
      dashboardWeather.temperature_2m
    );

    const humidity = Number(
      dashboardWeather.relative_humidity_2m
    );

    const rainfall = Number(
      dashboardWeather.precipitation
    );

    if (moisture < 30 || temperature > 38) {
      return {
        status: "Needs Attention",
        icon: "⚠️",
        message:
          "Your farm may need attention. Check soil moisture and protect crops from heat stress.",
      };
    }

    if (humidity > 90 || rainfall > 10) {
      return {
        status: "Monitor Conditions",
        icon: "👀",
        message:
          "Current weather conditions may increase crop stress or disease risk. Monitor your field.",
      };
    }

    if (
      moisture >= 40 &&
      moisture <= 70 &&
      temperature <= 35
    ) {
      return {
        status: "Healthy",
        icon: "🌱",
        message:
          "Current soil moisture and environmental conditions are favorable for crop growth.",
      };
    }

    return {
      status: "Moderate",
      icon: "🌿",
      message:
        "Farm conditions are moderate. Continue monitoring soil and weather conditions.",
    };
  };

  const farmHealth = getFarmHealth();

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

    const rainfall = Number(
      dashboardWeather.precipitation
    );

    const temperature = Number(
      dashboardWeather.temperature_2m
    );

    // Rainfall currently present
    if (rainfall > 5) {
      return {
        status: "Not Required",
        icon: "🌧️",
        message:
          "Rainfall is currently sufficient. Avoid unnecessary irrigation.",
      };
    }

    // Soil already wet
    if (moisture > 70) {
      return {
        status: "Not Required",
        icon: "💧",
        message:
          "Soil moisture is already high. Avoid irrigation and monitor drainage.",
      };
    }

    // Very dry soil
    if (moisture < 30) {
      return {
        status: "Urgent",
        icon: "🚨",
        message:
          "Soil moisture is critically low. Irrigation should be considered soon.",
      };
    }

    // Dry soil + high temperature
    if (moisture < 40 && temperature > 32) {
      return {
        status: "Recommended",
        icon: "🚿",
        message:
          "Low soil moisture combined with high temperature. Irrigation is recommended.",
      };
    }

    // Dry soil
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
  // CROP RECOMMENDATION
  // =========================================

  useEffect(() => {
    if (!dashboardWeather || !soilData) {
      return;
    }

    fetch(
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

          temperature:
            dashboardWeather.temperature_2m,

          humidity:
            dashboardWeather.relative_humidity_2m,

          ph: Number(soilData.ph),

          rainfall:
            dashboardWeather.precipitation,

          soilType: soilData.soilType,
        }),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        setCropRecommendation(data);
      })
      .catch((error) => {
        console.error(
          "Dashboard crop recommendation failed:",
          error
        );
      });
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
      setFertilizerRecommendation(
        data.recommendation
      );
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

  return (
    <div className="dashboard">

      {/* =====================================
          SIDEBAR
          ===================================== */}

      <aside className="sidebar">

        <div className="logo">
          🌱 SmartAgri
        </div>

        <nav>

          <a
            className={
              page === "dashboard" ? "active" : ""
            }
            onClick={() => setPage("dashboard")}
          >
            📊 Dashboard
          </a>

          <a
            className={
              page === "crop" ? "active" : ""
            }
            onClick={() => setPage("crop")}
          >
            🌾 Crop Recommendation
          </a>

          <a
            className={
              page === "disease" ? "active" : ""
            }
            onClick={() => setPage("disease")}
          >
            🔬 Disease Detection
          </a>

          <a
            className={
              page === "irrigation"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("irrigation")
            }
          >
            💧 Smart Irrigation
          </a>

          <a
            className={
              page === "weather" ? "active" : ""
            }
            onClick={() => setPage("weather")}
          >
            ☁️ Weather
          </a>

          <a
            className={
              page === "soil" ? "active" : ""
            }
            onClick={() => setPage("soil")}
          >
            🌱 Soil Analysis
          </a>

          <a
            className={
              page === "fertilizer"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("fertilizer")
            }
          >
            🌿 Fertilizer Recommendation
          </a>

          <a
            className={
              page === "farm" ? "active" : ""
            }
            onClick={() => setPage("farm")}
          >
            🚜 My Farm
          </a>

        </nav>

        <div className="sidebar-bottom">
          <a>⚙️ Settings</a>
          <a>🚪 Logout</a>
        </div>

      </aside>

      {/* =====================================
          MAIN CONTENT
          ===================================== */}

      <main className="dashboard-main">

        {/* ===================================
            DASHBOARD PAGE
            =================================== */}

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
                  Here is your farm overview for
                  today.
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
                  <span>
                    SmartAgri User
                  </span>
                </div>

              </div>

            </header>

            {/* =================================
                STATISTICS
                ================================= */}

            <section className="dashboard-stats">

              {/* Temperature */}

              <div className="dashboard-card">

                <div className="card-icon">
                  🌡️
                </div>

                <p>Temperature</p>

                <h2>
                  {dashboardWeather
                    ? `${dashboardWeather.temperature_2m}°C`
                    : "--"}
                </h2>

                <span>Live</span>

              </div>

              {/* Soil Moisture */}

              <div className="dashboard-card">

                <div className="card-icon">
                  💧
                </div>

                <p>Soil Moisture</p>

                <h2>
                  {soilMoisture}%
                </h2>

                <span>
                  From Soil Analysis
                </span>

              </div>

              {/* Humidity */}

              <div className="dashboard-card">

                <div className="card-icon">
                  ☁️
                </div>

                <p>Humidity</p>

                <h2>
                  {dashboardWeather
                    ? `${dashboardWeather.relative_humidity_2m}%`
                    : "--"}
                </h2>

                <span>Live</span>

              </div>

              {/* Rainfall */}

              <div className="dashboard-card">

                <div className="card-icon">
                  🌧️
                </div>

                <p>Rainfall</p>

                <h2>
                  {dashboardWeather
                    ? `${dashboardWeather.precipitation} mm`
                    : "--"}
                </h2>

                <span>Live</span>

              </div>

              {/* My Farms */}

              <div
                className="dashboard-card clickable-card"
                onClick={() => setPage("farm")}
              >

                <div className="card-icon">
                  🚜
                </div>

                <p>My Farms</p>

                <h2>
                  {farmCount}
                </h2>

                <span>
                  Registered →
                </span>

              </div>

            </section>

            {/* =================================
                MAIN DASHBOARD GRID
                ================================= */}

            <section className="dashboard-grid">

              {/* =================================
                  ANALYTICS
                  ================================= */}

              <div className="dashboard-panel analytics-panel">

                <div className="panel-header">

                  <div>

                    <span className="section-label">
                      SMART ANALYTICS
                    </span>

                    <h2>
                      Farm Analytics
                    </h2>

                  </div>

                  <span className="ai-badge">
                    LIVE
                  </span>

                </div>

                <div className="analytics-grid">

                  {/* Soil Moisture */}

                  <div className="analytics-card">

                    <span className="analytics-icon">
                      💧
                    </span>

                    <p>Soil Moisture</p>

                    <h3>
                      {soilMoisture}%
                    </h3>

                    <span className="analytics-status">
                      {Number(soilMoisture) < 30
                        ? "Low"
                        : Number(soilMoisture) > 70
                        ? "High"
                        : "Optimal"}
                    </span>

                  </div>

                  {/* Temperature */}

                  <div className="analytics-card">

                    <span className="analytics-icon">
                      🌡️
                    </span>

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

                  {/* Humidity */}

                  <div className="analytics-card">

                    <span className="analytics-icon">
                      💨
                    </span>

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

                  {/* Rainfall */}

                  <div className="analytics-card">

                    <span className="analytics-icon">
                      🌧️
                    </span>

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

              {/* =================================
                  FARM HEALTH
                  ================================= */}

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
                      {farmHealth.icon}
                    </span>

                    {farmHealth.status}

                  </div>

                </div>

                <div className="farm-health-content">

                  <div className="health-score">

                    <div className="health-circle">
                      <span>🌱</span>
                    </div>

                    <div>

                      <h3>
                        {farmHealth.status}
                      </h3>

                      <p>
                        {farmHealth.message}
                      </p>

                    </div>

                  </div>

                  <div className="health-checks">

                    {/* Moisture */}

                    <div className="health-check">

                      <span>💧</span>

                      <div>

                        <strong>
                          Soil Moisture
                        </strong>

                        <p>
                          {Number(soilMoisture) >= 40 &&
                          Number(soilMoisture) <= 70
                            ? "Optimal"
                            : Number(soilMoisture) < 40
                            ? "Low"
                            : "High"}
                        </p>

                      </div>

                    </div>

                    {/* Temperature */}

                    <div className="health-check">

                      <span>🌡️</span>

                      <div>

                        <strong>
                          Temperature
                        </strong>

                        <p>
                          {dashboardWeather &&
                          Number(
                            dashboardWeather.temperature_2m
                          ) <= 35
                            ? "Suitable"
                            : "High"}
                        </p>

                      </div>

                    </div>

                    {/* Humidity */}

                    <div className="health-check">

                      <span>💨</span>

                      <div>

                        <strong>
                          Humidity
                        </strong>

                        <p>
                          {dashboardWeather &&
                          Number(
                            dashboardWeather.relative_humidity_2m
                          ) <= 85
                            ? "Normal"
                            : "High"}
                        </p>

                      </div>

                    </div>

                    {/* Rainfall */}

                    <div className="health-check">

                      <span>🌧️</span>

                      <div>

                        <strong>
                          Rainfall
                        </strong>

                        <p>
                          {dashboardWeather &&
                          Number(
                            dashboardWeather.precipitation
                          ) > 5
                            ? "High"
                            : "Normal"}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

              {/* =================================
                  IRRIGATION INTELLIGENCE
                  ================================= */}

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

                      <span>
                        Soil Moisture
                      </span>

                      <strong>
                        {soilMoisture}%
                      </strong>

                    </div>

                    <div>

                      <span>
                        Rainfall
                      </span>

                      <strong>
                        {dashboardWeather
                          ? `${dashboardWeather.precipitation} mm`
                          : "--"}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Temperature
                      </span>

                      <strong>
                        {dashboardWeather
                          ? `${dashboardWeather.temperature_2m}°C`
                          : "--"}
                      </strong>

                    </div>

                  </div>

                </div>

              </div>

              {/* =================================
                  7 DAY WEATHER FORECAST
                  ================================= */}

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
                              : new Date(
                                  date
                                ).toLocaleDateString(
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
                                  weatherForecast
                                    .weather_code[
                                    index
                                  ]
                                )}
                              </span>

                              <div className="forecast-temperature">

                                <strong>
                                  {Math.round(
                                    weatherForecast
                                      .temperature_2m_max[
                                      index
                                    ]
                                  )}
                                  °
                                </strong>

                                <span>
                                  {Math.round(
                                    weatherForecast
                                      .temperature_2m_min[
                                      index
                                    ]
                                  )}
                                  °
                                </span>

                              </div>

                              <span className="forecast-rain">

                                🌧️{" "}

                                {
                                  weatherForecast
                                    .precipitation_sum[
                                    index
                                  ]
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

              {/* =================================
                  CROP RECOMMENDATION
                  ================================= */}

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

                      {/* Soil Data Used */}

                      <div className="crop-input-summary">

                        <div>

                          <span>N</span>

                          <strong>
                            {soilData?.nitrogen ??
                              "--"}
                          </strong>

                        </div>

                        <div>

                          <span>P</span>

                          <strong>
                            {soilData?.phosphorus ??
                              "--"}
                          </strong>

                        </div>

                        <div>

                          <span>K</span>

                          <strong>
                            {soilData?.potassium ??
                              "--"}
                          </strong>

                        </div>

                        <div>

                          <span>pH</span>

                          <strong>
                            {soilData?.ph ?? "--"}
                          </strong>

                        </div>

                        <div>

                          <span>
                            Moisture
                          </span>

                          <strong>
                            {soilData?.moisture !=
                            null
                              ? `${soilData.moisture}%`
                              : "--"}
                          </strong>

                        </div>

                      </div>

                    </div>

                    {/* Confidence */}

                    <div className="confidence">

                      <span>
                        Confidence
                      </span>

                      <strong>

                        {cropRecommendation
                          ?.recommendation
                          ?.confidence
                          ? `${cropRecommendation.recommendation.confidence}%`
                          : "--"}

                      </strong>

                    </div>

                    {/* Progress */}

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
                  onClick={() =>
                    setPage("crop")
                  }
                >
                  View Recommendation →
                </button>

              </div>
              {/* =========================================
    FERTILIZER INTELLIGENCE
    ========================================= */}

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

  {/* Fertilizer Result */}

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

  {/* Soil Values */}

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

  {/* Application Guidance */}

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
        {diseaseResult?.disease || "No Analysis Yet"}
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
              {/* =================================
                  CURRENT WEATHER
                  ================================= */}

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

                    <span>
                      Humidity
                    </span>

                    <strong>
                      {dashboardWeather
                        ? `${dashboardWeather.relative_humidity_2m}%`
                        : "--"}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Wind
                    </span>

                    <strong>
                      {dashboardWeather
                        ? `${dashboardWeather.wind_speed_10m} km/h`
                        : "--"}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Rain
                    </span>

                    <strong>
                      {dashboardWeather
                        ? `${dashboardWeather.precipitation} mm`
                        : "--"}
                    </strong>

                  </div>

                </div>

              </div>

            </section>

            {/* =================================
                SMART RECOMMENDATIONS
                ================================= */}

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

                <span>
                  ✨
                </span>

              </div>

              <div className="recommendation-list">

                {/* Irrigation */}

                <div className="recommendation-item">

                  <span>💧</span>

                  <div>

                    <strong>
                      Irrigation
                    </strong>

                    <p>

                      {dashboardWeather
                        ? dashboardWeather.precipitation >
                          2
                          ? "Rainfall is currently present. Irrigation may not be required."
                          : "No significant rainfall detected. Check soil moisture before irrigation."
                        : "Checking current weather conditions..."}

                    </p>

                  </div>

                </div>

                {/* Crop Health */}

                <div className="recommendation-item">

                  <span>🌱</span>

                  <div>

                    <strong>
                      Crop Health
                    </strong>

                    <p>

                      {dashboardWeather
                        ? dashboardWeather.temperature_2m >
                          35
                          ? "High temperature detected. Monitor crops for heat stress and provide adequate irrigation."
                          : dashboardWeather.relative_humidity_2m >
                            85
                          ? "High humidity detected. Monitor crops for fungal diseases and leaf moisture."
                          : "Current temperature and humidity conditions are favorable for crop health."
                        : "Checking current conditions..."}

                    </p>

                  </div>

                </div>

                {/* Weather Alert */}

                <div className="recommendation-item">

                  <span>☁️</span>

                  <div>

                    <strong>
                      Weather Alert
                    </strong>

                    <p>

                      {dashboardWeather
                        ? dashboardWeather.precipitation >
                          5
                          ? "Heavy rainfall is currently detected. Avoid unnecessary irrigation."
                          : dashboardWeather.precipitation >
                            0
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

        {/* =====================================
            OTHER PAGES
            ===================================== */}

        {page === "crop" && (
          <CropRecommendation />
        )}

        {page === "disease" && (
          <DiseaseDetection />
        )}

        {page === "irrigation" && (
          <SmartIrrigation />
        )}

        {page === "weather" && (
          <Weather />
        )}

        {page === "soil" && (
          <SoilAnalysis />
        )}

        {page === "fertilizer" && (
          <FertilizerRecommendation />
        )}

        {page === "farm" && (
          <MyFarm />
        )}

      </main>

    </div>
  );
}

export default App;