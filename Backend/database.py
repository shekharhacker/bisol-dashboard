"""
Database configuration module.

Responsibilities:
- Configure database connection (engine)
- Create session factory for ORM operations
- Provide database dependency for FastAPI routes

This module ensures proper database session handling
for each incoming request.
"""
#------------Imports-----------
import os
from dotenv import load_dotenv

# ---------- SQLALCHEMY ----------
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# ---------- DATABASE CONFIGURATION ----------
"""
Defines the database connection string.

Format:
mysql+mysqlconnector://<user>:<password>@<host>:<port>/<database>
"""
load_dotenv()
DATABASE_URL =  os.getenv("DATABASE_URL")


# ---------- DATABASE ENGINE ----------
"""
Creates the core connection to the database.

- Acts as the entry point for all DB operations
"""
engine = create_engine(DATABASE_URL,pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=5,
    max_overflow=10)


# ---------- SESSION FACTORY ----------
"""
Creates a new database session for each request.

- autocommit=False → manual commit required
- autoflush=False → prevents automatic DB flush
"""
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ---------- BASE CLASS ----------
"""
Base class for all ORM models.

All models will inherit from this to get metadata tracking.
"""
Base = declarative_base()


# ---------- DATABASE DEPENDENCY ----------
def get_db():
    """
    Provides a database session to API routes.

    Flow:
    1. Create new DB session
    2. Yield session to route
    3. Close session after request completes

    Yields:
        Session: SQLAlchemy database session
    """

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()