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
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        if email is None:
            raise credentials_exception

    except JWTError as e:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise credentials_exception

    return user