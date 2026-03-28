import { useLocation, useNavigate } from "react-router-dom";
import "../styles/ForgotPasswordSent.css";

export default function ForgotPasswordSent() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "your email address";

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Check your email</h2>

        <p>
          If an account exists for <strong>{email}</strong>, a password reset link
          has been sent.
        </p>

        <p className="hint">
          Please check your inbox and spam folder.
        </p>

        <button onClick={() => navigate("/login")}>
          Back to login
        </button>
      </div>
    </div>
  );
}
