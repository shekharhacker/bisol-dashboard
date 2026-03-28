from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from auth.dependencies import get_current_user

from database import get_db
from models import User
from auth.schemas import UserCreate, UserLogin
from auth.hashing import hash_password, verify_password
from auth.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

# -------- REGISTER --------
@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}
# -------- LOGIN --------
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        print("USER NOT FOUND")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not verify_password(user.password, db_user.password_hash):
        print("PASSWORD MISMATCH")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token = create_access_token({"sub": db_user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
        "name": db_user.name,
        "email": db_user.email
        }
    }
#-------Dashboard--------
@router.get("/generate-dashboard")
def generate_dashboard(current_user = Depends(get_current_user)):
    return {
        "message": "Secure dashboard data",
        "user": current_user.email
    }

#--------oauth--------
@router.post("/token")
def token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access_token = create_access_token({"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
