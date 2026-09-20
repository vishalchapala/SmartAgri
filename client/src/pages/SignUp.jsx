import { useState } from "react";

function SignUp({ onGoToLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };
const handleSubmit = async (event) => {
  event.preventDefault();

  setMessage("");
  setError("");

  if (
    !form.name ||
    !form.email ||
    !form.password ||
    !form.confirmPassword
  ) {
    setError("Please fill in all fields.");
    return;
  }

  if (form.password.length < 6) {
    setError("Password must contain at least 6 characters.");
    return;
  }

  if (form.password !== form.confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/auth/signup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to create account.");
      return;
    }

    setMessage("Account created successfully!");

    setForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

  } catch (error) {
    console.error("Signup error:", error);

    setError(
      "Unable to connect to the SmartAgri server."
    );
  }
};
 
  return (
    <section
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "35px",
          borderRadius: "20px",
          background: "#0c1713",
          border: "1px solid rgba(255,255,255,0.10)",
          boxSizing: "border-box",
        }}
      >

        {/* Header */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              fontSize: "45px",
              marginBottom: "10px",
            }}
          >
            🌱
          </div>

          <p className="small-title">
            SMART AGRICULTURE
          </p>

          <h1 style={{ marginBottom: "10px" }}>
            Create Account
          </h1>

          <p className="dashboard-subtitle">
            Create your SmartAgri farmer account.
          </p>
        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >

          {/* Full Name */}

          <div>
            <label>Full Name</label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your name"
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: "8px",
                padding: "13px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.12)",
                background:
                  "rgba(255,255,255,0.04)",
                color: "white",
              }}
            />
          </div>

          {/* Email */}

          <div>
            <label>Email</label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: "8px",
                padding: "13px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.12)",
                background:
                  "rgba(255,255,255,0.04)",
                color: "white",
              }}
            />
          </div>

          {/* Password */}

          <div>
            <label>Password</label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: "8px",
                padding: "13px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.12)",
                background:
                  "rgba(255,255,255,0.04)",
                color: "white",
              }}
            />
          </div>

          {/* Confirm Password */}

          <div>
            <label>Confirm Password</label>

            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: "8px",
                padding: "13px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.12)",
                background:
                  "rgba(255,255,255,0.04)",
                color: "white",
              }}
            />
          </div>

          {/* Error */}

          {error && (
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                background:
                  "rgba(239,68,68,0.10)",
                color: "#fca5a5",
                fontSize: "13px",
              }}
            >
              ❌ {error}
            </div>
          )}

          {/* Success */}

          {message && (
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                background:
                  "rgba(34,197,94,0.10)",
                color: "#86efac",
                fontSize: "13px",
              }}
            >
              ✅ {message}
            </div>
          )}

          {/* Create Account */}

          <button
            type="submit"
            className="primary-btn"
            style={{
              width: "100%",
              marginTop: "5px",
            }}
          >
            🌱 Create Account
          </button>

        </form>

        {/* Login */}

        <div
          style={{
            textAlign: "center",
            marginTop: "25px",
            fontSize: "13px",
            opacity: 0.8,
          }}
        >
          Already have an account?

          <button
            type="button"
            onClick={onGoToLogin}
            style={{
              marginLeft: "6px",
              border: "0",
              background: "transparent",
              color: "#c7f45b",
              cursor: "pointer",
              fontWeight: "700",
            }}
          >
            Login
          </button>
        </div>

      </div>
    </section>
  );
}

export default SignUp;