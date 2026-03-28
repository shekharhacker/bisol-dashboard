import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await fetch("http://localhost:8000/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email }),
    });

    console.log("Sending email:", email);

    if (res.ok) {
      navigate("/forgot-password/sent", { state: { email } });
    } else {
      console.error("Failed to send reset link");
    }
  } catch (err) {
    console.error("Error:", err);
  }
};

  return (
     <div className="auth-page">      {/* ✅ PAGE WRAPPER */}
      <div className="auth-container"> {/* ✅ CARD */}
        <h2>Forgot Password</h2>
        <p>Enter your registered email address.</p>

        <form >
          <input
            type="email"
            placeholder="Email address"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          <button type="submit" onClick={handleSubmit}>Send Reset Link</button>
        </form>

        <button className="link-btn" onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;