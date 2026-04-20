"""
Password hashing utility module.

Handles:
- Secure password hashing
- Password verification

Uses Passlib's CryptContext with PBKDF2-SHA256 algorithm
to ensure passwords are stored securely and not in plain text.
"""

# ---------- PASSLIB ----------
from passlib.context import CryptContext


# ---------- HASHING CONFIGURATION ----------
"""
Defines hashing configuration.

- schemes: hashing algorithms used
- deprecated: marks older algorithms for future migration
"""
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)


# ---------- HASH PASSWORD ----------
def hash_password(password: str) -> str:
    """
    Hashes a plain text password.

    Flow:
    1. Take user password input
    2. Apply secure hashing algorithm (PBKDF2)
    3. Return hashed password for storage

    Args:
        password (str): Plain text password

    Returns:
        str: Hashed password
    """

    return pwd_context.hash(password)


# ---------- VERIFY PASSWORD ----------
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a password against its hashed version.

    Flow:
    1. Take user input password
    2. Compare with stored hashed password
    3. Return True if match, else False

    Args:
        plain_password (str): Password entered by user
        hashed_password (str): Stored hashed password

    Returns:
        bool: True if passwords match, False otherwise
    """

    return pwd_context.verify(plain_password, hashed_password)