from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import csv
import os
from datetime import datetime
from pathlib import Path

app = FastAPI()

# === CORS Setup ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development; restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Define base backend directory ===
BASE_DIR = Path(__file__).parent.resolve()

# === File paths inside backend folder ===
USERS_FILE = BASE_DIR / "users.csv"
HISTORY_FILE = BASE_DIR / "history.csv"
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# === Helper Functions ===
def save_user(name: str, email: str):
    is_new_file = not USERS_FILE.exists()
    with USERS_FILE.open("a", newline="") as file:
        writer = csv.writer(file)
        if is_new_file:
            writer.writerow(["name", "email"])
        writer.writerow([name, email])

def get_users():
    if not USERS_FILE.exists():
        return []
    df = pd.read_csv(USERS_FILE)
    return df.to_dict(orient="records")

def save_history(user_email: str, prompt: str, file_name: str):
    is_new = not HISTORY_FILE.exists()
    with HISTORY_FILE.open("a", newline="") as file:
        writer = csv.writer(file)
        if is_new:
            writer.writerow(["user_email", "prompt", "file_name", "timestamp"])
        writer.writerow([user_email, prompt, file_name, datetime.now().isoformat()])

def get_history(user_email: str):
    if not HISTORY_FILE.exists():
        return []
    df = pd.read_csv(HISTORY_FILE)
    df_user = df[df["user_email"] == user_email]
    return df_user.to_dict(orient="records")

# === Routes ===
@app.get("/")
def home():
    return {"message": "Backend is running"}

@app.post("/create-user")
def create_user(name: str = Form(...), email: str = Form(...)):
    save_user(name, email)
    return {"status": "success", "message": "User created"}

@app.get("/get-history/{user_email}")
def fetch_history(user_email: str):
    return {"history": get_history(user_email)}

@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename
    with file_path.open("wb") as f:
        f.write(await file.read())
    return {"status": "success", "filename": file.filename}

@app.post("/generate-dashboard")
def generate_dashboard(user_email: str = Form(...), prompt: str = Form(...), file_name: str = Form(...)):
    save_history(user_email, prompt, file_name)
    # Placeholder AI output
    return {
        "status": "success",
        "message": "Mock dashboard generated",
        "charts": [
            {"type": "bar", "title": "Sales by Region"},
            {"type": "line", "title": "Trends Over Time"}
        ]
    }
