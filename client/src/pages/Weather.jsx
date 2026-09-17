import { useState } from "react";

function Weather() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const checkWeather = async () => {
    if (!city.trim()) {
      setMessage("⚠️ Please enter a city.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setWeather(null);

      // 1. Find city coordinates
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=1&language=en&format=json`
      );

      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        setMessage("❌ City not found. Please try another city.");
        return;
      }

      const location = geoData.results[0];

      // 2. Get current weather
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm`
      );

      const weatherData = await weatherResponse.json();

      const current = weatherData.current;

      setWeather({
        city: location.name,
        country: location.country,
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        rainfall: current.precipitation,
        wind: current.wind_speed_10m,
        condition: getWeatherCondition(current.weather_code),
      });
    } catch (error) {
      console.error(error);
      setMessage("❌ Unable to fetch weather data.");
    } finally {
      setLoading(false);
    }
  };

  const getWeatherCondition = (code) => {
    if (code === 0) return "Clear Sky";
    if (code >= 1 && code <= 3) return "Partly Cloudy";
    if (code >= 45 && code <= 48) return "Foggy";
    if (code >= 51 && code <= 57) return "Drizzle";
    if (code >= 61 && code <= 67) return "Rainy";
    if (code >= 71 && code <= 77) return "Snowy";
    if (code >= 80 && code <= 82) return "Rain Showers";
    if (code >= 95 && code <= 99) return "Thunderstorm";

    return "Unknown";
  };

  return (
    <div className="page">

      <div className="page-header">
        <p className="small-title">LIVE WEATHER</p>

        <h1>🌦️ Weather</h1>

        <p>
          Get real-time weather conditions for your farming location.
        </p>
      </div>

      <div className="form-card">

        <h2>📍 Search Location</h2>

        <div className="form-grid">

          <div>
            <label>Enter City</label>

            <input
              type="text"
              placeholder="Example: Chennai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

        </div>

        <button
          className="primary-btn"
          onClick={checkWeather}
          disabled={loading}
        >
          {loading ? "🔄 Loading..." : "🌦️ Check Live Weather"}
        </button>

        {message && (
          <p style={{ marginTop: "15px" }}>
            {message}
          </p>
        )}

      </div>

      {weather && (
        <div
          className="dashboard-panel"
          style={{ marginTop: "25px" }}
        >

          <div className="panel-header">

            <div>
              <p className="small-title">CURRENT WEATHER</p>

              <h2>
                📍 {weather.city}, {weather.country}
              </h2>
            </div>

            <span className="ai-badge">
              LIVE
            </span>

          </div>

          <div className="weather-main">

            <div>

              <div className="weather-icon">
                🌤️
              </div>

              <h1>
                {weather.temperature}°C
              </h1>

              <p>
                {weather.condition}
              </p>

            </div>

          </div>

          <div className="dashboard-stats">

            <div className="dashboard-card">
              <span>💧 Humidity</span>
              <h2>{weather.humidity}%</h2>
            </div>

            <div className="dashboard-card">
              <span>🌧️ Rainfall</span>
              <h2>{weather.rainfall} mm</h2>
            </div>

            <div className="dashboard-card">
              <span>💨 Wind</span>
              <h2>{weather.wind} km/h</h2>
            </div>

          </div>

          <div
            className="info-box"
            style={{ marginTop: "20px" }}
          >

            <strong>🌱 Farming Insight</strong>

            <p>
              Live weather data can help farmers plan
              irrigation, spraying, harvesting and other
              agricultural activities.
            </p>

          </div>

        </div>
      )}

    </div>
  );
}

export default Weather;