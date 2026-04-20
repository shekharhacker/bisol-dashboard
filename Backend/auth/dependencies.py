"""
Authentication dependency module.

Provides reusable logic for extracting and validating
the currently authenticated user using JWT tokens.

Used across protected routes via FastAPI's dependency injection system.
"""

# ---------- FASTAPI ----------
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# ---------- JWT ----------
from jose import JWTError, jwt

# ---------- DATABASE ----------
from sqlalchemy.orm import Session
from database import get_db

# ---------- MODELS ----------
from models.models import User

# ---------- CONFIG ----------
from auth.jwt import SECRET_KEY, ALGORITHM


# ---------- OAUTH2 SCHEME ----------
"""
Defines how the token will be extracted from incoming requests.

- Looks for: Authorization: Bearer <token>
- tokenUrl is used by Swagger UI for login
"""
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ---------- GET CURRENT USER ----------
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Validates JWT token and returns the authenticated user.

    Flow:
    1. Extract token from Authorization header
    2. Decode token using SECRET_KEY and ALGORITHM
    3. Extract user identifier (email from 'sub' field)
    4. Fetch user from database
    5. Raise exception if token is invalid or user not found

    Args:
        token (str): JWT token extracted from request
        db (Session): Database session

    Returns:
        User: Authenticated user object

    Raises:
        HTTPException: If token is invalid or user does not exist
    """

    # ---------- COMMON AUTH ERROR ----------
    """
    Standard exception for authentication failure.
    Returned for:
    - Invalid token
    - Expired token
    - Missing user
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # ---------- DECODE JWT ----------
        """
        Decode the JWT token using secret key.

        Expected payload:
        {
            "sub": user_email,
            ...
        }
        """
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # ---------- EXTRACT USER IDENTITY ----------
        email = payload.get("sub")

        if email is None:
            raise credentials_exception

    except JWTError:
        # ---------- INVALID TOKEN ----------
        raise credentials_exception

    # ---------- FETCH USER FROM DATABASE ----------
    user = db.query(User).filter(User.email == email).first()

    # ---------- USER NOT FOUND ----------
    if user is None:
        raise credentials_exception

    # ---------- SUCCESS ----------
    return user
