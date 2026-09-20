import { useEffect, useState } from "react";

function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    farmName: "",
    location: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const savedUser = localStorage.getItem("smartAgriUser");

        if (!savedUser) {
          setError("User information not found. Please login again.");
          return;
        }

        const user = JSON.parse(savedUser);

        const response = await fetch(
          `http://localhost:5000/api/profile/${user.id}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load profile.");
          return;
        }

        setProfile({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          farmName: data.user.farmName || "",
          location: data.user.location || "",
        });
      } catch (error) {
        console.error("Profile loading error:", error);

        setError(
          "Unable to connect to the SmartAgri server."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const savedUser = localStorage.getItem("smartAgriUser");

      if (!savedUser) {
        setError("User information not found. Please login again.");
        return;
      }

      const user = JSON.parse(savedUser);

      const response = await fetch(
        `http://localhost:5000/api/profile/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profile),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update profile.");
        return;
      }

      const updatedProfile = {
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || "",
        farmName: data.user.farmName || "",
        location: data.user.location || "",
      };

      setProfile(updatedProfile);

      localStorage.setItem(
        "smartAgriProfile",
        JSON.stringify(updatedProfile)
      );

      localStorage.setItem(
        "smartAgriUser",
        JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
        })
      );

      window.dispatchEvent(
        new Event("smartAgriProfileUpdated")
      );

      setMessage("Profile updated successfully.");

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error("Profile update error:", error);

      setError(
        "Unable to connect to the SmartAgri server."
      );
    } finally {
      setSaving(false);
    }
  };

  const pageStyle = {
    width: "100%",
    maxWidth: "1000px",
    boxSizing: "border-box",
  };

  const panelStyle = {
    marginBottom: "22px",
    padding: "32px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "#0c1713",
    boxSizing: "border-box",
  };

  const formStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "22px",
    marginTop: "24px",
  };

  const fieldStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
    minWidth: 0,
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "700",
    color: "rgba(255,255,255,0.82)",
  };

  const inputStyle = {
    display: "block",
    width: "100%",
    height: "46px",
    boxSizing: "border-box",
    padding: "0 14px",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "11px",
    background: "rgba(255,255,255,0.045)",
    color: "#ffffff",
    outline: "none",
    fontSize: "14px",
  };

  const summaryGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
    marginTop: "20px",
  };

  const summaryItemStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.025)",
    minWidth: 0,
  };

  return (
    <section style={pageStyle}>

      <header className="dashboard-header">
        <div>
          <p className="small-title">SMART AGRICULTURE</p>

          <h1>
            My Profile 👤
          </h1>

          <p className="dashboard-subtitle">
            Manage your SmartAgri farmer profile.
          </p>
        </div>

        <div className="profile">
          👨‍🌾

          <div>
            <strong>
              {profile.name || "Farmer"}
            </strong>

            <span>
              SmartAgri User
            </span>
          </div>
        </div>
      </header>

      <div style={panelStyle}>

        <div className="panel-header">
          <div>
            <p className="small-title">
              FARMER INFORMATION
            </p>

            <h2>
              Personal Details
            </h2>
          </div>

          <span className="ai-badge">
            PROFILE
          </span>
        </div>

        {loading ? (
          <p style={{ marginTop: "25px" }}>
            Loading profile...
          </p>
        ) : (
          <>
            <div style={formStyle}>

              <div style={fieldStyle}>
                <label style={labelStyle}>
                  Full Name
                </label>

                <input
                  style={inputStyle}
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>
                  Email
                </label>

                <input
                  style={inputStyle}
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>
                  Phone Number
                </label>

                <input
                  style={inputStyle}
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>
                  Farm Name
                </label>

                <input
                  style={inputStyle}
                  type="text"
                  name="farmName"
                  value={profile.farmName}
                  onChange={handleChange}
                  placeholder="Enter your farm name"
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>
                  Farm Location
                </label>

                <input
                  style={inputStyle}
                  type="text"
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  placeholder="Enter your farm location"
                />
              </div>

            </div>

            {message && (
              <div className="profile-success">
                ✅ {message}
              </div>
            )}

            {error && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(255,80,80,0.10)",
                  border: "1px solid rgba(255,80,80,0.25)",
                  color: "#ff8f8f",
                  fontSize: "14px",
                }}
              >
                ❌ {error}
              </div>
            )}

            <button
              className="primary-btn"
              onClick={handleSave}
              disabled={saving}
              style={{
                marginTop: "24px",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving
                ? "⏳ Saving..."
                : "💾 Save Profile"}
            </button>
          </>
        )}

      </div>

      <div style={panelStyle}>

        <div className="panel-header">
          <div>
            <p className="small-title">
              PROFILE SUMMARY
            </p>

            <h2>
              Your Information
            </h2>
          </div>
        </div>

        <div style={summaryGridStyle}>

          <div style={summaryItemStyle}>
            <span style={{ opacity: 0.65, fontSize: "12px" }}>
              👤 Name
            </span>

            <strong>
              {profile.name || "Not provided"}
            </strong>
          </div>

          <div style={summaryItemStyle}>
            <span style={{ opacity: 0.65, fontSize: "12px" }}>
              📧 Email
            </span>

            <strong>
              {profile.email || "Not provided"}
            </strong>
          </div>

          <div style={summaryItemStyle}>
            <span style={{ opacity: 0.65, fontSize: "12px" }}>
              📱 Phone
            </span>

            <strong>
              {profile.phone || "Not provided"}
            </strong>
          </div>

          <div style={summaryItemStyle}>
            <span style={{ opacity: 0.65, fontSize: "12px" }}>
              🚜 Farm
            </span>

            <strong>
              {profile.farmName || "Not provided"}
            </strong>
          </div>

          <div style={summaryItemStyle}>
            <span style={{ opacity: 0.65, fontSize: "12px" }}>
              📍 Location
            </span>

            <strong>
              {profile.location || "Not provided"}
            </strong>
          </div>

          <div style={summaryItemStyle}>
            <span style={{ opacity: 0.65, fontSize: "12px" }}>
              🌱 Platform
            </span>

            <strong>
              SmartAgri
            </strong>
          </div>

        </div>

      </div>

    </section>
  );
}

export default Profile;