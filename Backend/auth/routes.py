"""
Authentication routes module.

Handles:
- User registration
- User login (JWT-based authentication)
- OAuth2 token generation (Swagger support)
- Protected route testing

All routes are grouped under '/auth'.
"""

# ---------- FASTAPI ----------
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

# ---------- DATABASE ----------
from sqlalchemy.orm import Session
from database import get_db

# ---------- MODELS ----------
from models.models import User

# ---------- AUTH ----------
from auth.schemas import UserCreate, UserLogin
from auth.hashing import hash_password, verify_password
from auth.jwt import create_access_token
from auth.dependencies import get_current_user


# ---------- ROUTER ----------
router = APIRouter(prefix="/auth", tags=["Authentication"])


# ---------- REGISTER ----------
@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user in the system.

    Flow:
    1. Check if user email already exists
    2. Hash the password securely
    3. Store user in database

    Args:
        user (UserCreate): User input data (name, email, password)
        db (Session): Database session

    Returns:
        dict: Success message

    Raises:
        HTTPException: If email is already registered
    """

    # --- Check for existing user ---
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # --- Create new user ---
    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


# ---------- LOGIN ----------
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates user and generates JWT token.

    Flow:
    1. Fetch user from database using email
    2. Verify password using hashing utility
    3. Generate JWT token
    4. Return token along with user details

    Args:
        user (UserLogin): Login credentials (email, password)
        db (Session): Database session

    Returns:
        dict: Access token and user info

    Raises:
        HTTPException: If credentials are invalid
    """

    # --- Fetch user ---
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # --- Verify password ---
    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # --- Generate JWT token ---
    token = create_access_token({"sub": db_user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "name": db_user.name,
            "email": db_user.email
        }
    }


# ---------- PROTECTED TEST ROUTE ----------
@router.get("/secure-test")
def secure_test(current_user: User = Depends(get_current_user)):
    """
    Protected route to verify authentication.

    Requires a valid JWT token.
    Used for testing whether authentication dependency is working correctly.

    Args:
        current_user (User): Authenticated user injected via dependency

    Returns:
        dict: Message and user email
    """

    return {
        "message": "Secure route accessed successfully",
        "user": current_user.email
    }


# ---------- OAUTH2 TOKEN ----------
@router.post("/token")
def token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2-compatible token endpoint.

    Used by Swagger UI for authentication testing.

    Flow:
    1. Accept credentials via form data
    2. Validate user credentials
    3. Generate JWT token
    4. Return token in OAuth2 format

    Args:
        form_data: OAuth2 form (username=email, password)
        db (Session): Database session

    Returns:
        dict: Access token and token type

    Raises:
        HTTPException: If credentials are invalid
    """

    # --- Fetch user ---
    user = db.query(User).filter(User.email == form_data.username).first()

    # --- Validate credentials ---
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # --- Generate token ---
    access_token = create_access_token({"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
    