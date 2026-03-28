import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText

load_dotenv()

MAIL_USER = os.getenv("MAIL_USER")
MAIL_PASS = os.getenv("MAIL_PASS")

def send_reset_email(to_email: str, token: str):
    
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    subject = "Password Reset Request"
    body = f"""
    Greetings this is a password reset request link from BiSol.Click on the link to reset password.

    {reset_link}
    """

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = MAIL_USER
    msg["To"] = to_email

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()

        server.login(MAIL_USER, MAIL_PASS)

        server.sendmail(MAIL_USER, to_email, msg.as_string())

        server.quit()

    except Exception as e:
        print("❌ EMAIL ERROR:", e)