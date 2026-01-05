from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import csv
import os
from datetime import datetime
from pathlib import Path
from openai import OpenAI
import json

# ================== APP INIT ==================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== PATHS ==================
BASE_DIR = Path(__file__).parent.resolve()
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

USERS_FILE = BASE_DIR / "users.csv"
HISTORY_FILE = BASE_DIR / "history.csv"

# ================== OPENAI CLIENT ==================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = None
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)

# ================== HELPERS ==================
def save_user(name: str, email: str):
    new_file = not USERS_FILE.exists()
    with USERS_FILE.open("a", newline="") as f:
        writer = csv.writer(f)
        if new_file:
            writer.writerow(["name", "email"])
        writer.writerow([name, email])


def save_history(user_email: str, prompt: str, file_name: str):
    new_file = not HISTORY_FILE.exists()
    with HISTORY_FILE.open("a", newline="") as f:
        writer = csv.writer(f)
        if new_file:
            writer.writerow(["user_email", "prompt", "file_name", "timestamp"])
        writer.writerow([user_email, prompt, file_name, datetime.now().isoformat()])


def get_history(user_email: str):
    if not HISTORY_FILE.exists():
        return []
    df = pd.read_csv(HISTORY_FILE)
    return df[df["user_email"] == user_email].to_dict(orient="records")

# ================== AI DASHBOARD INTERPRETER ==================
def interpret_prompt_with_ai(user_prompt: str, columns: list):
    """
    Uses OpenAI to convert a natural language prompt into a
    dashboard specification JSON.
    Falls back to a default dashboard if AI fails.
    """

    # ---------- SAFE FALLBACK (ALWAYS WORKS) ----------
    fallback_spec = {
        "dashboard_title": "Industry Analysis Dashboard",
        "charts": [
            {
                "type": "bar",
                "title": "Industry Distribution",
                "column": columns[0],
                "aggregation": "count",
                "filters": []
            },
            {
                "type": "pie",
                "title": "Industry Share",
                "column": columns[0],
                "aggregation": "count",
                "filters": []
            },
            {
                "type": "heatmap",
                "title": "Industry Heatmap",
                "column": columns[0],
                "aggregation": "count",
                "filters": []
            }
        ]
    }

    # ---------- If no API key ----------
    if not client:
        return fallback_spec

    system_prompt = f"""
You are an AI dashboard planner.

Rules:
- Return ONLY valid JSON
- No explanations
- Support multiple charts
- Chart types allowed: bar, pie, line, heatmap
- Use only given dataset columns

Dataset columns:
{columns}

JSON format:
{{
  "dashboard_title": "...",
  "charts": [
    {{
      "type": "bar | pie | line | heatmap",
      "title": "...",
      "column": "...",
      "aggregation": "count | sum | avg | none",
      "filters": []
    }}
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )

        content = response.choices[0].message.content

        # Ensure valid JSON
        return json.loads(content)

    except Exception:
        # ---------- QUOTA / API FAILURE ----------
        return fallback_spec

# ================== ROUTES ==================
@app.get("/")
def home():
    return {"message": "BiSol backend running successfully"}

@app.post("/create-user")
def create_user(name: str = Form(...), email: str = Form(...)):
    save_user(name, email)
    return {"status": "success"}

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
def generate_dashboard(
    user_email: str = Form(...),
    prompt: str = Form(...),
    file_name: str = Form(...),
):
    # ---------- Load Dataset ----------
    file_path = UPLOAD_DIR / file_name
    try:
        if file_name.lower().endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        return {
            "status": "error",
            "message": f"Dataset loading failed: {str(e)}"
        }

    # ---------- Save History ----------
    save_history(user_email, prompt, file_name)

    # ---------- AI / Fallback ----------
    dashboard_spec = interpret_prompt_with_ai(prompt, list(df.columns))

    # ---------- RESPONSE ----------
    return {
        "status": "success",
        "dashboard_spec": dashboard_spec,
        "columns": list(df.columns),
        "preview_rows": df.head(5).to_dict(orient="records")
    }
