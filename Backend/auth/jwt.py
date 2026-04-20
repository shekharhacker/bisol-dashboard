"""
JWT utility module.

Handles:
- Creation of access tokens
- Configuration of JWT settings (secret key, algorithm, expiry)

Used for stateless authentication across the application.
"""

# ---------- STANDARD LIB ----------
from datetime import datetime, timedelta
import os

# ---------- JWT ----------
from jose import JWTError, jwt


# ---------- CONFIGURATION ----------
"""
JWT configuration settings.

- SECRET_KEY: Used to sign tokens (must be kept secure)
- ALGORITHM: Encryption algorithm used for token encoding
- ACCESS_TOKEN_EXPIRE_MINUTES: Token validity duration
"""

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ---------- CREATE ACCESS TOKEN ----------
def create_access_token(data: dict):
    """
    Generates a JWT access token.

    Flow:
    1. Copy input payload data
    2. Add expiration timestamp (exp)
    3. Encode payload using SECRET_KEY and ALGORITHM
    4. Return signed JWT token

    Args:
        data (dict): Payload data to include in token
                     (typically contains 'sub' → user identifier)

    Returns:
        str: Encoded JWT access token
    """

    # --- Copy payload ---
    to_encode = data.copy()

    # --- Set expiration time ---
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # --- Add expiry to payload ---
    to_encode.update({"exp": expire})

    # --- Encode JWT ---
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)