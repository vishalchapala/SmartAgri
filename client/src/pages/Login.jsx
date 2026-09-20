import { useState } from "react";

function Login({ onLogin, onGoToSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

 const handleSubmit = async (event) => {
  event.preventDefault();

  setError("");

  if (!email || !password) {
    setError("Please enter your email and password.");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Invalid email or password.");
      return;
    }

    // Store only login status.
    // Password is NOT stored in localStorage.
    localStorage.setItem(
      "smartAgriLoggedIn",
      "true"
    );

    // Save basic profile information
    // without storing the password.
    localStorage.setItem(
  "smartAgriUser",
  JSON.stringify({
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
  })
);

    onLogin(data.user);

  } catch (error) {
    console.error("Login error:", error);

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

        {/* Logo */}

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

          <h1>
            Welcome Back
          </h1>

          <p className="dashboard-subtitle">
            Login to your SmartAgri account.
          </p>
        </div>

        {/* Login Form */}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >

          {/* Email */}

          <div>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
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
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
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

          {/* Login Button */}

          <button
            type="submit"
            className="primary-btn"
            style={{
              width: "100%",
              marginTop: "5px",
            }}
          >
            🔐 Login
          </button>

        </form>

        {/* Sign Up */}

        <div
          style={{
            textAlign: "center",
            marginTop: "25px",
            fontSize: "13px",
            opacity: 0.8,
          }}
        >
          Don't have an account?

          <button
            type="button"
            onClick={onGoToSignUp}
            style={{
              marginLeft: "6px",
              border: "0",
              background: "transparent",
              color: "#c7f45b",
              cursor: "pointer",
              fontWeight: "700",
            }}
          >
            Create Account
          </button>
        </div>

      </div>
    </section>
  );
}

export default Login;