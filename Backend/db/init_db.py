"""
Database initialization module.

Responsibilities:
- Create all database tables based on defined ORM models
- Ensure schema is created before application starts

This script should be run once during setup or when
new models are added to the project.
"""

# ---------- DATABASE ENGINE ----------
from database import engine

# ---------- MODELS BASE ----------
from models import Base


# ---------- CREATE TABLES ----------
"""
Creates all tables defined in SQLAlchemy models.

Flow:
1. Read metadata from all imported models
2. Generate corresponding tables in database
3. Execute CREATE TABLE statements if tables do not exist

Note:
- This will NOT overwrite existing tables
- For schema migrations, use tools like Alembic (future improvement)
"""
Base.metadata.create_all(bind=engine)