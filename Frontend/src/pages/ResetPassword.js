import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/ResetPassword.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(7);
  const [invalidToken, setInvalidToken] = useState(false);

  // ⏳ Countdown after success
  useEffect(() => {
    if (!success) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate("/login");
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [success, navigate]);

  // ⛔ Invalid link (no token)
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Invalid Link</h2>
          <p>This reset link is invalid.</p>
        </div>
      </div>
    );
  }

  // ⛔ Token expired / invalid (from backend)
  if (invalidToken) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Link Expired</h2>
          <p>This password reset link is invalid or has expired.
            Try again with a new link.
          </p>
          <button onClick={() => navigate("/forgot-password")}>
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  // 🔗 Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          new_password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Invalid or expired link");
        setInvalidToken(true);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again later.");
    }
  };

  // ✅ Success UI
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Password Updated</h2>
          <p>Your password has been reset successfully.</p>
          <p className="countdown">
            Redirecting to login in {countdown} seconds…
          </p>
        </div>
      </div>
    );
  }

  // 🔐 Reset Form
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Set a new password</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm new password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button type="submit">Update Password</button>
        </form>
      </div>
    </div>
  );
}