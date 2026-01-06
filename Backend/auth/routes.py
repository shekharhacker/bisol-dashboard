from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User
from auth.schemas import UserCreate, UserLogin
from auth.hashing import hash_password, verify_password
from auth.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

# -------- DB Dependency --------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------- REGISTER --------
@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    print("Register called with:", user.email)

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    print("User saved with id:", new_user.id)

    return {"message": "User registered successfully"}
# -------- LOGIN --------
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token = create_access_token({"sub": db_user.email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }
