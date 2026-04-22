/**
Forgot Password Confirmation component.

Responsibilities:
- Inform the user that a password reset email has been sent
- Display the email address used for the request
- Provide navigation back to the login page

This component is shown after the user submits
a forgot password request.
*/


// ---------- IMPORTS ----------
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/ForgotPasswordSent.css";


// ---------- COMPONENT ----------
/**
Displays confirmation message after a password
reset request is submitted.
*/
export default function ForgotPasswordSent() {

  // ---------- ROUTER HOOKS ----------
  /**
  Retrieves navigation helpers and
  state passed from the previous page.
  */
  const location = useLocation();
  const navigate = useNavigate();


  // ---------- EMAIL EXTRACTION ----------
  /**
  Extracts the email from router state.
  If no email is provided, a fallback
  placeholder is displayed.
  */
  const email = location.state?.email || "your email address";


  // ---------- UI RENDER ----------
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

        {/* ---------- NAVIGATION ---------- */}
        <button onClick={() => navigate("/login")}>
          Back to login
        </button>

      </div>
    </div>
  );
}