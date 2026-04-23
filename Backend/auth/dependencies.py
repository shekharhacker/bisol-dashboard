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

    print("RAW TOKEN:", token)

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("TOKEN PAYLOAD:", payload)
        email = payload.get("sub")
        print("EMAIL FROM TOKEN:", email)

        if email is None:
            print("TOKEN HAS NO SUB")
            raise credentials_exception

    except JWTError as e:
        print("JWT DECODE ERROR:", str(e))
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    print("DB USER FOUND:", user.email if user else None)

    if user is None:
        print("NO USER MATCHED TOKEN EMAIL")
        raise credentials_exception

    return user