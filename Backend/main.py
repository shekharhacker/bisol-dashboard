"""
Main entry point for BiSol backend.

Responsibilities:
- Initialize FastAPI app
- Configure middleware (CORS)
- Register routers (authentication)
- Handle core features:
    - File upload & validation
    - Dashboard generation
    - Dashboard retrieval
    - Password reset flow

Note:
This file currently contains both routing and business logic.
For better scalability, heavy logic should be moved to service layers.
"""
# ---------- FASTAPI ----------
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

# ---------- DATABASE ----------
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db

# ---------- AUTH ----------
from auth.dependencies import get_current_user
from auth.schemas import ForgotPasswordRequest, ResetPasswordRequest
from auth.hashing import hash_password
from auth.routes import router as auth_router

# ---------- MODELS ----------
from models.models import User, Dashboard, Upload, PasswordResetToken

# ---------- UTILITIES ----------
from utils.security import generate_password_reset_token, hash_reset_token,validate_password
from utils.emails import send_reset_email

# ---------- STANDARD LIB ----------
from pathlib import Path
import pandas as pd
from datetime import datetime
import os
import json

# ---------- FILE UPLOAD CONFIGURATION ----------
"""
Defines constraints for uploaded files to ensure:
- Security (no malicious file types)
- Controlled resource usage (file size limit)
"""

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS={".csv", ".xls", ".xlsx"}

ALLOWED_MIME_TYPES = {
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

# ---------- FASTAPI APP ----------
app = FastAPI(title="BiSol Backend")

# ---------- CORS MIDDLEWARE ----------
"""
Allows frontend (possibly on different domain/port)
to communicate with backend APIs.
"""
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://bisol-dashboard.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- ROUTER REGISTRATION ----------
app.include_router(auth_router, tags=["Authentication"])

# ---------- PATH SETUP ----------
"""
Handles file storage paths dynamically.
Each user gets an isolated upload directory.
"""

BASE_DIR = Path(__file__).resolve().parent

UPLOAD_ROOT = BASE_DIR / "uploads"
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
HISTORY_FILE = BASE_DIR / "history.csv"

# ---------- HELPER FUNCTIONS ----------

def save_history(user_email: str, prompt: str, file_name: str):
    """
    Stores user dashboard generation history in CSV.

    Creates file with headers if it doesn't exist.
    """
    new_file = not HISTORY_FILE.exists()

    with HISTORY_FILE.open("a", newline="") as f:
        import csv
        writer = csv.writer(f)

        if new_file:
            writer.writerow(["user_email", "prompt", "file_name", "timestamp"])

        writer.writerow([user_email, prompt, file_name, datetime.now().isoformat()])


def get_history(user_email: str):
    """
    Retrieves dashboard history for a specific user.
    """
    if not HISTORY_FILE.exists():
        return []

    df = pd.read_csv(HISTORY_FILE)
    return df[df["user_email"] == user_email].to_dict(orient="records")


def make_json_safe(obj):
    """
    Converts Pandas/Datetime objects into JSON-serializable format.
    Prevents serialization errors in API responses.
    """
    if isinstance(obj, dict):
        return {k: make_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_safe(v) for v in obj]
    elif hasattr(obj, "isoformat"):
        return obj.isoformat()
    return obj


def infer_chart_type(prompt: str) -> str:
    """
    Infers chart type based on user prompt keywords.

    Returns:
        - 'pie' for distribution-related queries
        - 'line' for trends
        - default 'bar'
    """
    p = prompt.lower()
    
    if any(word in p for word in ["share", "percentage", "ratio", "contribution"]):
        return "pie"
    
    if any(word in p for word in ["trend", "over time", "timeline", "growth"]):
        return "line"
    
    return "bar"

def normalize_text(text: str) -> str:
    """
    Normalizes text for easier matching.

    Converts to lowercase and removes spaces/underscores.
    """
    return str(text).strip().lower().replace(" ", "").replace("_", "")


def infer_chart_spec(prompt: str, df: pd.DataFrame) -> dict:
    """
    Dynamically infers chart specification from prompt and dataset columns.

    Flow:
    1. Normalize prompt and dataframe columns
    2. Detect matching columns mentioned in prompt
    3. Choose x-axis and y-axis dynamically
    4. Use count if no numeric column is identified
    5. Return chart specification
    """

    prompt_words = prompt.lower().replace("_", " ").split()
    columns = list(df.columns)

    normalized_column_map = {
        normalize_text(col): col for col in columns
    }

    matched_columns = []
    for word in prompt_words:
        normalized_word = normalize_text(word)
        for norm_col, original_col in normalized_column_map.items():
            if normalized_word in norm_col or norm_col in normalized_word:
                if original_col not in matched_columns:
                    matched_columns.append(original_col)

    numeric_columns = df.select_dtypes(include="number").columns.tolist()
    categorical_columns = [col for col in columns if col not in numeric_columns]

    x_col = None
    y_col = None

    # Prefer first categorical column match as x-axis
    for col in matched_columns:
        if col in categorical_columns:
            x_col = col
            break

    # Prefer first numeric column match as y-axis
    for col in matched_columns:
        if col in numeric_columns:
            y_col = col
            break

    # If prompt has only numeric column, choose a default categorical x
    if not x_col and categorical_columns:
        x_col = categorical_columns[0]

    # If no numeric column matched, fallback to count
    if not y_col:
        y_col = "__count__"

    title = (
        f"{y_col if y_col != '__count__' else 'Count'} by {x_col}"
        if x_col else
        "Generated Chart"
    )

    return {
        "id": "c1",
        "type": infer_chart_type(prompt),
        "title": title,
        "x": x_col,
        "y": y_col,
    }

def build_chart_data(df: pd.DataFrame, chart_spec: dict):
    """
    Builds chart data from the full dataset based on chart specification.

    Supports:
    - count aggregation
    - sum aggregation for numeric columns
    """

    x_col = chart_spec.get("x")
    y_col = chart_spec.get("y")

    if not x_col or x_col not in df.columns:
        return []

    # Count-based chart
    if y_col == "__count__":
        # Choose aggregation intelligently
        agg_func = "sum"

        y_lower = y_col.lower()

        if "discount" in y_lower or "rate" in y_lower or "percentage" in y_lower:
            agg_func = "mean"

        grouped = (
            df.groupby(x_col)[y_col]
            .agg(agg_func)
            .reset_index()
        )
        return [
            {"label": str(row[x_col]), "value": int(row["value"])}
            for _, row in grouped.iterrows()
        ]

    # Numeric aggregation
    if y_col in df.columns:
        # Choose aggregation intelligently
        agg_func = "sum"

        y_lower = y_col.lower()

        if "discount" in y_lower or "rate" in y_lower or "percentage" in y_lower:
            agg_func = "mean"

        grouped = (
            df.groupby(x_col)[y_col]
            .agg(agg_func)
            .reset_index()
        )
        return [
            {
                "label": str(row[x_col]),
                "value": float(row[y_col]) if pd.notnull(row[y_col]) else 0
            }
            for _, row in grouped.iterrows()
        ]

    return []
# ---------- HEALTH CHECK ----------
@app.get("/")
def root():
    """
    Basic endpoint to verify backend is running.
    """
    return {"status": "BiSol backend running"}


# ---------- FILE UPLOAD ----------
@app.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Handles secure file upload.

    Flow:
    1. Validate extension & MIME type
    2. Store file in user-specific directory
    3. Enforce file size limit (stream-safe)
    4. Save metadata in DB
    5. Keep only latest uploaded file
    """

    # --- Validate extension ---
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type")

    # --- Validate MIME ---
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid MIME type")

    # --- Create user folder ---
    user_dir = UPLOAD_ROOT / f"user_{current_user.id}"
    user_dir.mkdir(parents=True, exist_ok=True)

    file_path = user_dir / file.filename

    # --- Stream-safe write ---
    total_size = 0
    with open(file_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            total_size += len(chunk)

            if total_size > MAX_FILE_SIZE:
                buffer.close()
                file_path.unlink(missing_ok=True)
                raise HTTPException(status_code=400, detail="File too large")

            buffer.write(chunk)

    await file.close()

    # --- Save metadata ---
    new_upload = Upload(
        user_id=current_user.id,
        filename=file.filename,
        file_size=total_size,
    )
    db.add(new_upload)
    db.commit()
    db.refresh(new_upload)

    # --- Keep only latest file ---
    uploads = (
        db.query(Upload)
        .filter(Upload.user_id == current_user.id)
        .order_by(Upload.uploaded_at.desc())
        .all()
    )
    
    for old in uploads[1:]:
        # If an older DB record has the same filename, delete only the DB row
        # and keep the current physical file.
        if old.filename == new_upload.filename:
            db.delete(old)
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

# ---------- GENERATE DASHBOARD ----------
@app.post("/generate-dashboard")
def generate_dashboard(
    prompt: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates dashboard configuration based on uploaded dataset.

    Flow:
    1. Fetch latest uploaded file
    2. Load dataset (CSV/Excel)
    3. Infer chart type
    4. Generate dashboard spec
    5. Store in DB
    """

    # --- Fetch latest upload ---
    latest_upload = (
        db.query(Upload)
        .filter(Upload.user_id == current_user.id)
        .order_by(Upload.uploaded_at.desc())
        .first()
    )

    if not latest_upload:
        raise HTTPException(status_code=400, detail="Upload file first")

    # --- Read dataset ---
    file_path = UPLOAD_ROOT / f"user_{current_user.id}" / latest_upload.filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Uploaded file not found on server"
        )

    try:
        if latest_upload.filename.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # --- Generate dashboard ---
    chart_spec = infer_chart_spec(prompt, df)
    
    chart_data = build_chart_data(df, chart_spec)
    
    dashboard_spec = {
        "dashboard_title": "Generated Dashboard",
    "charts": [
        {
            **chart_spec,
            "data": chart_data
        }
    ]
    }

    dashboard_spec = make_json_safe(dashboard_spec)
    preview_rows = make_json_safe(df.head(5).to_dict(orient="records"))
    
        # --- Build data health report from full dataset ---
    total_rows = int(df.shape[0])
    total_columns = int(df.shape[1])
    total_missing = int(df.isnull().sum().sum())

    completeness = 0.0
    if total_rows > 0 and total_columns > 0:
        completeness = round(
            ((total_rows * total_columns - total_missing) / (total_rows * total_columns)) * 100,
            1
        )

    column_analysis = []
    for col in df.columns:
        missing = int(df[col].isnull().sum())
        percent = round((missing / total_rows) * 100, 1) if total_rows > 0 else 0.0

        status = "Good"
        if percent > 20:
            status = "Critical"
        elif percent > 5:
            status = "Moderate"

        column_analysis.append({
            "column": str(col),
            "missing": missing,
            "percent": percent,
            "status": status,
        })

    data_health = {
        "summary": {
            "rows": total_rows,
            "columns": total_columns,
            "missing": total_missing,
            "completeness": completeness,
        },
        "columns": column_analysis,
    }

    # --- Save in DB ---
    existing = db.query(Dashboard).filter(Dashboard.user_id == current_user.id).first()

    if existing:
        existing.dashboard_spec = dashboard_spec
        existing.preview_rows = preview_rows
        existing.data_health = data_health
    else:
        db.add(Dashboard(
            user_id=current_user.id,
            dashboard_spec=dashboard_spec,
            preview_rows=preview_rows,
            data_health=data_health
        ))

    db.commit()

    return {
        "status": "success",
        "dashboard_spec": dashboard_spec,
        "preview_rows": preview_rows,
        "data_health": data_health,
    }

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
        "preview_rows": dashboard.preview_rows,
        "data_health": dashboard.data_health,
    }
    
# ---------- FORGOT PASSWORD ----------
@app.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiates password reset flow.

    - Generates token
    - Stores hashed token
    - Sends email (if user exists)
    """

    user = db.query(User).filter(User.email == payload.email).first()

    if user:
        raw_token, hashed_token, expires_at = generate_password_reset_token()

        db.add(PasswordResetToken(
            user_id=user.id,
            token=hashed_token,
            expires_at=expires_at
        ))
        db.commit()

        send_reset_email(to_email=user.email, token=raw_token)

    return {"message": "If the email exists, a reset link has been sent."}

#---------------------RESET Password -----------------------
@app.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    hashed_token = hash_reset_token(payload.token)
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
        
    try:
        validate_password(payload.new_password)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    # 🔐 Update password
    user.password_hash = hash_password(payload.new_password)

    # 🔒 Invalidate token
    reset_entry.used = True

    db.commit()

    return {"message": "Password reset successful"}
