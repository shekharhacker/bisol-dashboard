"""
Email utility module.

Handles:
- Sending password reset emails to users
- Formatting email content
- Connecting to SMTP server securely

Uses environment variables for email credentials to ensure security.
"""

# ---------- STANDARD LIB ----------
import os
import smtplib
from email.mime.text import MIMEText

# ---------- ENV CONFIG ----------
from dotenv import load_dotenv

# ---------- LOAD ENV VARIABLES ----------
load_dotenv()

MAIL_USER = os.getenv("MAIL_USER")
MAIL_PASS = os.getenv("MAIL_PASS")


# ---------- SEND RESET EMAIL ----------
def send_reset_email(to_email: str, token: str):
    """
    Sends a password reset email to the user.
    """

    # --- Generate reset link ---
    FRONTEND_URL = os.getenv("FRONTEND_URL")
    reset_link = f"{FRONTEND_URL}/reset-password/{token}"

    # --- Email content ---
    subject = "Password Reset Request"
    body = f"""
Greetings,

This is a password reset request from BiSol.
Click the link below to reset your password:

{reset_link}

If you did not request this, please ignore this email.
"""

    # --- Construct email message ---
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = MAIL_USER
    msg["To"] = to_email

    server = None

    try:
        # --- Connect to SMTP server with timeout ---
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=10)
        server.starttls()

        # --- Login to email account ---
        server.login(MAIL_USER, MAIL_PASS)

        # --- Send email ---
        server.sendmail(MAIL_USER, to_email, msg.as_string())

        print(f"✅ Reset email sent to {to_email}")

    except Exception as e:
        print("❌ EMAIL ERROR:", e)

    finally:
        if server:
            try:
                server.quit()
            except Exception:
                pass