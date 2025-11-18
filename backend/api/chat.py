from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
from typing import cast
import os

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=ROOT_DIR / ".env")

API_VERSION = "1.0.0"

app = FastAPI(
    title="GOM AI Receptionist API",
)

# CORS
app.add_middleware(
    cast(type, CORSMiddleware),
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from backend.api.chat import router as chat_router
app.include_router(chat_router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "ai_connected": bool(os.getenv("OPENAI_API_KEY")),
        "cwd": str(ROOT_DIR),
        "version": API_VERSION,
    }
