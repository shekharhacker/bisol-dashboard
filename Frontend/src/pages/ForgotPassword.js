/**
Forgot Password component.

Responsibilities:
- Allow users to request a password reset link
- Send registered email to backend reset-password API
- Redirect user to confirmation page after request

This component initiates the password reset flow
by collecting the user's registered email address.
*/


// ---------- IMPORTS ----------
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ForgotPassword.css";
const API_URL = import.meta.env.VITE_API_URL;


// ---------- COMPONENT ----------
/**
Handles password reset request.

Features:
- Email input collection
- Backend API call for reset link
- Redirect to confirmation screen
*/
function ForgotPassword() {

  // ---------- STATE MANAGEMENT ----------
  /**
  Stores the email entered by the user.
  */
  const [email, setEmail] = useState("");

  const navigate = useNavigate();


  // ---------- SUBMIT HANDLER ----------
  /**
  Sends reset password request to backend.

  Flow:
  1. Prevent default form submission
  2. Send email to backend reset endpoint
  3. Redirect user to confirmation page
  */
  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      // ---------- API REQUEST ----------
      const res = await fetch("${API_URL}/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
      });

      console.log("Sending email:", email);

      if (res.ok) {

        // ---------- REDIRECT ----------
        navigate("/forgot-password/sent", { state: { email } });

      } else {

        console.error("Failed to send reset link");

      }

    } catch (err) {

      // ---------- ERROR HANDLING ----------
      console.error("Error:", err);

    }
  };


  // ---------- UI RENDER ----------
  return (
    <div className="auth-page">      {/* PAGE WRAPPER */}
      <div className="auth-container"> {/* CARD */}

        <h2>Forgot Password</h2>
        <p>Enter your registered email address.</p>

        <form>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          <button type="submit" onClick={handleSubmit}>
            Send Reset Link
          </button>

        </form>

        {/* ---------- NAVIGATION ---------- */}
        <button
          className="link-btn"
          onClick={() => navigate("/login")}
        >
          Back to Login
        </button>

      </div>
    </div>
  );
}


// ---------- EXPORT ----------
export default ForgotPassword;