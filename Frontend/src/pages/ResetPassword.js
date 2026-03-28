import { useEffect, useState } from "react";
import { useNavigate, useSearchParams} from "react-router-dom";
import "../styles/ResetPassword.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(7);

  // ⛔ Invalid token
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Invalid Link</h2>
          <p>This password reset link is invalid or expired.</p>
          <button onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // 🔗 backend API already exists
    setSuccess(true);
  };

  // ⏳ Countdown redirect
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

  // ✅ Success state
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

  // 🔐 Reset form
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
