"""
Pydantic schemas for authentication module.

Defines request and response models for:
- User registration
- User login
- User response formatting
- Password reset flow (forgot + reset)

These schemas are used for:
- Input validation
- Data serialization/deserialization
- Ensuring API contract consistency
"""

# ---------- PYDANTIC ----------
from pydantic import BaseModel, EmailStr, Field


# ---------- REGISTER SCHEMA ----------
class UserCreate(BaseModel):
    """
    Schema for user registration.

    Fields:
        name (str): Full name of the user
        email (EmailStr): Valid email address
        password (str): Plain text password
    """

    name: str
    email: EmailStr
    password: str


# ---------- LOGIN SCHEMA ----------
class UserLogin(BaseModel):
    """
    Schema for user login.

    Fields:
        email (EmailStr): User email
        password (str): Plain text password
    """

    email: EmailStr
    password: str


# ---------- USER RESPONSE SCHEMA ----------
class UserResponse(BaseModel):
    """
    Schema for returning user details in responses.

    Fields:
        id (int): Unique user ID
        name (str): User name
        email (EmailStr): User email

    Config:
        from_attributes: Allows compatibility with ORM models
    """

    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


# ---------- FORGOT PASSWORD SCHEMA ----------
class ForgotPasswordRequest(BaseModel):
    """
    Schema for initiating password reset.

    Fields:
        email (EmailStr): Registered user email
    """

    email: EmailStr


# ---------- RESET PASSWORD SCHEMA ----------
class ResetPasswordRequest(BaseModel):
    """
    Schema for resetting password using token.

    Fields:
        token (str): Reset token (minimum length enforced)
        new_password (str): New password (minimum 8 characters)
    """

    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8)
    