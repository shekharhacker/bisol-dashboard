from fastapi import FastAPI, UploadFile, File, Form,Depends, HTTPException
from auth.dependencies import get_current_user
from models import User, Dashboard
from sqlalchemy.orm import Session
from database import get_db
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd
from datetime import datetime
import os
import json

#------------UPLOADS SECURITY VALIDS-----------
Max_File_Size=10*1024

Allowed_extensions={".csv",".xls",".xlsx"}

ALLOWED_MIME_TYPES = {
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
# ---------- IMPORT AUTH ROUTER ----------
from auth.routes import router as auth_router

# ---------- APP ----------
app = FastAPI(title="BiSol Backend")

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- REGISTER AUTH ----------
app.include_router(auth_router, tags=["Authentication"])

# ---------- PATHS ----------
BASE_DIR = Path(__file__).parent.resolve()
UPLOAD_ROOT = Path("uploads")
UPLOAD_ROOT.mkdir(exist_ok=True)
"""UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)"""

HISTORY_FILE = BASE_DIR / "history.csv"

# ---------- HELPERS ----------
def save_history(user_email: str, prompt: str, file_name: str):
    new_file = not HISTORY_FILE.exists()
    with HISTORY_FILE.open("a", newline="") as f:
        import csv
        writer = csv.writer(f)
        if new_file:
            writer.writerow(["user_email", "prompt", "file_name", "timestamp"])
        writer.writerow([user_email, prompt, file_name, datetime.now().isoformat()])


def get_history(user_email: str):
    if not HISTORY_FILE.exists():
        return []
    df = pd.read_csv(HISTORY_FILE)
    return df[df["user_email"] == user_email].to_dict(orient="records")


# ---------- HEALTH ----------
@app.get("/")
def root():
    return {"status": "BiSol backend running"}


# ---------- FILE UPLOAD ----------
@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    ):
     #----------Extension validation----------
    ext = Path(file.filename).suffix.lower()
    if ext not in Allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only CSV and Excel files are allowed."
        )
    #-----------MIME type validation----------
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid MIME type for uploaded file."
        )
    #----------File size validation------------
    file_bytes = file.file.read()
    if len(file_bytes) > Max_File_Size:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum allowed size is 10 MB."
        )
    file.file.seek(0)

     # Create user-specific directory
    user_dir = UPLOAD_ROOT / f"user_{current_user.id}"
    user_dir.mkdir(exist_ok=True)

    # Final file path
    file_path = user_dir / file.filename

    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    return {
        "status": "success",
        "filename": file.filename,
        "stored_path": str(file_path),
    }


# ---------- DASHBOARD ----------
@app.post("/generate-dashboard")
def generate_dashboard(
    prompt: str = Form(...),
    file_name: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_dir = UPLOAD_ROOT / f"user_{current_user.id}"
    file_path = user_dir / file_name

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Uploaded file not found")

    try:
        if file_name.lower().endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    dashboard_spec = {
        "dashboard_title": "Generated Dashboard",
        "charts": [
            {
                "type": "bar",
                "title": "Column Distribution",
                "column": df.columns[0],
                "aggregation": "count",
                "filters": []
            }
        ]
    }

    preview_rows = df.head(5).to_dict(orient="records")

    existing_dashboard = (
        db.query(Dashboard)
        .filter(Dashboard.user_id == current_user.id)
        .first()
    )

    if existing_dashboard:
        existing_dashboard.dashboard_spec = dashboard_spec
        existing_dashboard.preview_rows = preview_rows
    else:
        db.add(Dashboard(
            user_id=current_user.id,
            dashboard_spec=dashboard_spec,
            preview_rows=preview_rows
        ))

    db.commit()

    return {"status": "success"}

#---------Dashboard data-----------
@app.get("/dashboard-data")
def get_dashboard_data(
     current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dashboard = (
        db.query(Dashboard)
        .filter(Dashboard.user_id == current_user.id)
        .first()
    )

    if not dashboard:
        raise HTTPException(
            status_code=404,
            detail="No dashboard found for this user"
        )

    return {
        "dashboard_spec": dashboard.dashboard_spec,
        "preview_rows": dashboard.preview_rows
    }