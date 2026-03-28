from sqlalchemy import Column, Integer, String , JSON , TIMESTAMP , ForeignKey ,BigInteger,DateTime,Text,Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

class Dashboard(Base):
    __tablename__ = "dashboards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    dashboard_spec = Column(JSON, nullable=False)
    preview_rows = Column(JSON, nullable=False)

    prompt = Column(Text)
    background_color = Column(String(20), default="#ffffff")

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )
    # relationship (optional but recommended)
    user = relationship("User", backref="dashboards")

class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    filename = Column(String(255), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    token = Column(String(255), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)

    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())