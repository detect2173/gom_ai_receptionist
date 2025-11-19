from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
from typing import cast
from contextlib import asynccontextmanager
import os

# -----------------------------------------------------------
# Constants
# -----------------------------------------------------------
API_VERSION = "1.0.0"

# -----------------------------------------------------------
# Load environment
# -----------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=ROOT_DIR / ".env")

# -----------------------------------------------------------
# Lifespan (Startup + Shutdown)
# -----------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 GOM AI Receptionist API started")
    print("📁 Working directory:", ROOT_DIR)
    print("🔑 OpenAI Key Loaded:", bool(os.getenv("OPENAI_API_KEY")))
    yield

# -----------------------------------------------------------
# FastAPI App
# -----------------------------------------------------------
app = FastAPI(
    title="GOM AI Receptionist API",
    version=API_VERSION,
    lifespan=lifespan
)

# -----------------------------------------------------------
# CORS CONFIG
# -----------------------------------------------------------
FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    cast(type, CORSMiddleware),  # Fixes JetBrains IDE type warning
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------
# ROUTES (Streaming AI Chat)
# -----------------------------------------------------------
from backend.api.chat import router as chat_router
app.include_router(chat_router, prefix="/api")

# -----------------------------------------------------------
# ROOT ROUTE
# -----------------------------------------------------------
@app.get("/")
def root():
    return {
        "message": "GOM AI Receptionist API is running",
        "version": API_VERSION,
        "docs": "/docs",
        "health": "/api/health",
    }

# -----------------------------------------------------------
# HEALTH CHECK
# -----------------------------------------------------------
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "ai_connected": bool(os.getenv("OPENAI_API_KEY")),
        "cwd": str(ROOT_DIR),
        "version": API_VERSION,
    }
