/**
Reset Password component.

Responsibilities:
- Allow users to set a new password using reset token
- Validate password confirmation
- Send reset request to backend reset-password API
- Handle expired or invalid reset links
- Redirect user to login page after successful reset

This component completes the password reset flow
after the user clicks the reset link from email.
*/


// ---------- IMPORTS ----------
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/ResetPassword.css";
const API_URL = process.env.REACT_APP_API_URL;


// ---------- COMPONENT ----------
/**
Handles password reset using token received
from the reset link.

Flow:
1. Extract token from URL
2. Allow user to enter new password
3. Submit reset request to backend
4. Show success or error state
*/
export default function ResetPassword() {

  // ---------- ROUTER HOOKS ----------
  const navigate = useNavigate();
  const { token } = useParams();


  // ---------- STATE MANAGEMENT ----------
  /**
  Stores password inputs and UI state flags.
  */
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(7);
  const [invalidToken, setInvalidToken] = useState(false);


  // ---------- SUCCESS REDIRECT COUNTDOWN ----------
  /**
  Starts countdown after password reset success
  and automatically redirects user to login page.
  */
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


  // ---------- INVALID LINK CHECK ----------
  /**
  Handles cases where reset token
  is missing from the URL.
  */
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


  // ---------- TOKEN EXPIRED STATE ----------
  /**
  Displays message when backend confirms
  that the reset token is invalid or expired.
  */
  if (invalidToken) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Link Expired</h2>
          <p>
            This password reset link is invalid or has expired.
            Try again with a new link.
          </p>

          <button onClick={() => navigate("/forgot-password")}>
            Request New Link
          </button>
        </div>
      </div>
    );
  }


  // ---------- RESET PASSWORD HANDLER ----------
  /**
  Sends new password to backend reset API.

  Flow:
  1. Validate password confirmation
  2. Send reset request with token
  3. Handle success or invalid token response
  */
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {

      // ---------- RESET PASSWORD API ----------
      const res = await fetch(`${API_URL}/reset-password`, {
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

      // ---------- ERROR HANDLING ----------
      console.error(err);
      alert("Server error. Please try again later.");

    }
  };


  // ---------- SUCCESS UI ----------
  /**
  Displayed when password reset
  is completed successfully.
  */
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


  // ---------- RESET FORM ----------
  /**
  Password reset input form.
  */
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