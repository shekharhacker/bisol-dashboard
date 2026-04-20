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
"""
Loads environment variables from .env file.

Expected variables:
- MAIL_USER: Sender email address
- MAIL_PASS: App password or email password
"""
load_dotenv()

MAIL_USER = os.getenv("MAIL_USER")
MAIL_PASS = os.getenv("MAIL_PASS")


# ---------- SEND RESET EMAIL ----------
def send_reset_email(to_email: str, token: str):
    """
    Sends a password reset email to the user.

    Flow:
    1. Generate reset link using token
    2. Create email subject and body
    3. Establish SMTP connection
    4. Authenticate using sender credentials
    5. Send email
    6. Close connection

    Args:
        to_email (str): Recipient email address
        token (str): Password reset token

    Returns:
        None

    Raises:
        Exception: Prints error if email sending fails
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

    try:
        # --- Connect to SMTP server ---
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()  # Secure connection

        # --- Login to email account ---
        server.login(MAIL_USER, MAIL_PASS)

        # --- Send email ---
        server.sendmail(MAIL_USER, to_email, msg.as_string())

        # --- Close connection ---
        server.quit()

    except Exception as e:
        # --- Error handling ---
        print("❌ EMAIL ERROR:", e)