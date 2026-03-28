from fastapi import FastAPI, UploadFile, File, Form,Depends, HTTPException,status
from auth.dependencies import get_current_user
from auth.schemas import ForgotPasswordRequest,ResetPasswordRequest
from auth.hashing import hash_password
from models import User, Dashboard ,Upload, PasswordResetToken
from utils.security import generate_password_reset_token, hash_reset_token
from utils.emails import send_reset_email
from sqlalchemy import desc
from sqlalchemy.orm import Session
from database import get_db
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd
from datetime import datetime
import os
import json

#------------UPLOADS SECURITY VALIDS-----------
Max_File_Size=10*1024*1024

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
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_ROOT = BASE_DIR / "uploads"
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
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

def make_json_safe(obj):
    """
    Recursively convert Pandas / NumPy objects to JSON-serializable types
    """
    if isinstance(obj, dict):
        return {k: make_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_safe(v) for v in obj]
    elif hasattr(obj, "isoformat"):  # handles pandas.Timestamp & datetime
        return obj.isoformat()
    else:
        return obj

def infer_chart_type(prompt: str) -> str:
    p = prompt.lower()

    # Pie chart indicators
    if any(word in p for word in ["share", "percentage", "ratio", "contribution"]):
        return "pie"

    # Line chart indicators (future-ready)
    if any(word in p for word in ["trend", "over time", "timeline", "growth"]):
        return "line"

    # Default
    return "bar"


# ---------- HEALTH ----------
@app.get("/")
def root():
    return {"status": "BiSol backend running"}


# ---------- FILE UPLOAD ----------
@app.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ---------- Extension validation ----------
    ext = Path(file.filename).suffix.lower()
    if ext not in Allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only CSV and Excel files are allowed."
        )

    # ---------- MIME type validation ----------
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid MIME type for uploaded file."
        )

    # ---------- User directory ----------
    user_dir = UPLOAD_ROOT / f"user_{current_user.id}"
    user_dir.mkdir(parents=True, exist_ok=True)

    file_path = user_dir / file.filename

    # ---------- Stream-safe file write ----------
    total_size = 0
    with open(file_path, "wb") as buffer:
        while True:
            chunk = await file.read(1024 * 1024)  # 1 MB
            if not chunk:
                break

            total_size += len(chunk)
            if total_size > Max_File_Size:
                buffer.close()
                file_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=400,
                    detail="File too large. Maximum allowed size is 10 MB."
                )

            buffer.write(chunk)
    await file.close()

    print("UPLOAD SAVED TO:", file_path)

    # ---------- Save metadata FIRST ----------
    new_upload = Upload(
        user_id=current_user.id,
        filename=file.filename,
        file_size=total_size,
    )
    db.add(new_upload)
    db.commit()
    db.refresh(new_upload)

    # ---------- Cleanup: KEEP ONLY LATEST ----------
    uploads = (
        db.query(Upload)
        .filter(Upload.user_id == current_user.id)
        .order_by(Upload.uploaded_at.desc())
        .all()
    )

    # Keep uploads[0] (latest), delete rest
    for old in uploads[1:]:
        if old.filename == new_upload.filename:
            continue

        old_file = user_dir / old.filename
        if old_file.exists():
            old_file.unlink()

        db.delete(old)

    db.commit()

    return {
        "status": "success",
        "filename": file.filename,
        "size_bytes": total_size,
    }

# ---------- DASHBOARD ----------
@app.post("/generate-dashboard")
def generate_dashboard(
    prompt: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1️⃣ Fetch latest uploaded file from DB
    latest_upload = (
        db.query(Upload)
        .filter(Upload.user_id == current_user.id)
        .order_by(Upload.uploaded_at.desc())
        .first()
    )

    if not latest_upload:
        raise HTTPException(
            status_code=400,
            detail="No uploaded file found. Please upload a file first."
        )
    
    file_name = latest_upload.filename

    # 2️⃣ Build file path
    user_dir = UPLOAD_ROOT / f"user_{current_user.id}"
    file_path = user_dir / file_name
    print("GENERATE DASHBOARD USER ID:", current_user.id)
    print("LATEST UPLOAD USER ID:", latest_upload.user_id)
    print("LOOKING FOR FILE AT:", file_path)

    """if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Uploaded file not found on server"
        )"""
    if not file_path.exists():
        print("WARNING: file_path.exists() returned False, continuing anyway")
   
    # 3️⃣ Read file (extension logic intact ✅)
    try:
        if file_name.lower().endswith(".csv"):
            df = pd.read_csv(file_path)
        elif file_name.lower().endswith((".xls", ".xlsx")):
            df = pd.read_excel(file_path)
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format"
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 4️⃣ Build dashboard spec
    chart_type = infer_chart_type(prompt)

    dashboard_spec = {
    "dashboard_title": "Generated Dashboard",
    "charts": 
        [
            {
            "id": "c1",
            "type": chart_type,
            "title": f"Distribution of Region",
            "x": "Region",
            "y": "__count__",
            "style":{
                    "color":"#2563eb"
                }
            }
        ]
    }

    dashboard_spec = make_json_safe(dashboard_spec)

    # 5️⃣ Preview rows
    raw_preview = df.head(5).to_dict(orient="records")
    preview_rows = make_json_safe(raw_preview)

    # 6️⃣ Save / update dashboard
    existing_dashboard = (
        db.query(Dashboard)
        .filter(Dashboard.user_id == current_user.id)
        .first()
    )

    if existing_dashboard:
        existing_dashboard.dashboard_spec = dashboard_spec
        existing_dashboard.preview_rows = preview_rows
    else:
        db.add(
            Dashboard(
                user_id=current_user.id,
                dashboard_spec=dashboard_spec,
                preview_rows=preview_rows
            )
        )

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
    
#---------------------Forgot Password -----------------------
@app.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        raw_token, hashed_token, expires_at = generate_password_reset_token()
        print("Original raw token:", raw_token)
        print("Stored hashed token:", hashed_token)
        reset_entry = PasswordResetToken(
            user_id=user.id,
            token=hashed_token,
            expires_at=expires_at
        )

        db.add(reset_entry)
        db.commit()
        
        # Send email (best effort)
        send_reset_email(
            to_email=user.email,
            token=raw_token
        )

    # ALWAYS return same response
    return {
        "message": "If the email exists, a reset link has been sent."
    }
    
#---------------------RESET Password -----------------------
@app.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    hashed_token = hash_reset_token(payload.token)
    print("Received token:", payload.token)
    print("Hashed received:", hash_reset_token(payload.token))
    reset_entry = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token == hashed_token,
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > datetime.utcnow()
        )
        .first()
    )

    if not reset_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    user = db.query(User).filter(User.id == reset_entry.user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )

    # 🔐 Update password
    user.password_hash = hash_password(payload.new_password)

    # 🔒 Invalidate token
    reset_entry.used = True

    db.commit()

    return {"message": "Password reset successful"}
