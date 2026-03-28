import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Tuple

RESET_TOKEN_EXPIRY_MINUTES = 15


def generate_password_reset_token() -> Tuple[str, str, datetime]:
    """
    Generates a secure password reset token.

    Returns:
        raw_token (str): Token to be sent via email
        hashed_token (str): Token to be stored in DB
        expires_at (datetime): Expiry timestamp
    """

    # 1️⃣ Generate secure random token (URL-safe)
    raw_token = secrets.token_urlsafe(32)

    # 2️⃣ Hash token before storing
    hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()

    # 3️⃣ Set expiry
    expires_at = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRY_MINUTES)

    return raw_token, hashed_token, expires_at

def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
