from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd
from datetime import datetime
import os
import json

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
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

# ---------- PATHS ----------
BASE_DIR = Path(__file__).parent.resolve()
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

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
async def upload_file(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename
    with file_path.open("wb") as f:
        f.write(await file.read())
    return {"status": "success", "filename": file.filename}


# ---------- DASHBOARD ----------
@app.post("/generate-dashboard")
def generate_dashboard(
    user_email: str = Form(...),
    prompt: str = Form(...),
    file_name: str = Form(...),
):
    file_path = UPLOAD_DIR / file_name

    try:
        if file_name.lower().endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        return {"status": "error", "message": str(e)}

    save_history(user_email, prompt, file_name)

    # ---------- SAFE FALLBACK (NO OPENAI REQUIRED) ----------
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

    return {
        "status": "success",
        "dashboard_spec": dashboard_spec,
        "columns": list(df.columns),
        "preview_rows": df.head(5).to_dict(orient="records")
    }
