from pydantic import BaseModel, EmailStr, Field

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

#--------FORGOT PASSWORD-----
class ForgotPasswordRequest(BaseModel):
     email: EmailStr

#--------RESET PASSWORD-------
class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8)
