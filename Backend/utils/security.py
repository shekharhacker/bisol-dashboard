"""
Security utility module.

Handles:
- Generation of secure password reset tokens
- Hashing of reset tokens before database storage
- Expiry management for tokens

Ensures that raw tokens are never stored in the database,
enhancing security against token leakage.
"""

# ---------- STANDARD LIB ----------
import secrets
import re
import hashlib
from datetime import datetime, timedelta
from typing import Tuple

# ---------- PASSWORD VALIDATION ----------
def validate_password(password: str) -> None:
    """
    Validates password strength.

    Rules:
    - Minimum 8 characters
    - At least one letter
    - At least one digit

    Raises:
        ValueError: If password does not meet requirements
    """

    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")

    if not re.search(r"[A-Za-z]", password):
        raise ValueError("Password must contain at least one letter")

    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one number")


# ---------- CONFIGURATION ----------
"""
Configuration for password reset tokens.

- RESET_TOKEN_EXPIRY_MINUTES: Defines how long the token remains valid
"""
RESET_TOKEN_EXPIRY_MINUTES = 10


# ---------- GENERATE RESET TOKEN ----------
def generate_password_reset_token() -> Tuple[str, str, datetime]:
    """
    Generates a secure password reset token.

    Flow:
    1. Generate a cryptographically secure random token
    2. Hash the token using SHA-256 for safe storage
    3. Set an expiration timestamp
    4. Return raw token (for email) and hashed token (for DB)

    Returns:
        Tuple:
            raw_token (str): Token sent to user via email
            hashed_token (str): Token stored securely in database
            expires_at (datetime): Expiration time of the token
    """

    # --- Generate secure random token (URL-safe) ---
    raw_token = secrets.token_urlsafe(32)

    # --- Hash token before storing in DB ---
    hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()

    # --- Set token expiry ---
    expires_at = datetime.utcnow() + timedelta(
        minutes=RESET_TOKEN_EXPIRY_MINUTES
    )

    return raw_token, hashed_token, expires_at


# ---------- HASH RESET TOKEN ----------
def hash_reset_token(token: str) -> str:
    """
    Hashes a reset token for comparison.

    Flow:
    1. Take raw token from user request
    2. Apply SHA-256 hashing
    3. Return hashed value for DB comparison

    Args:
        token (str): Raw token received from user

    Returns:
        str: Hashed token
    """

    return hashlib.sha256(token.encode()).hexdigest()
