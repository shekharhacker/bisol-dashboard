from pydantic import BaseModel, EmailStr

# -------- REGISTER --------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

# -------- LOGIN --------
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# -------- RESPONSE --------
class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True
