"""
Chat API router

This module must ONLY expose an APIRouter named `router`.
The FastAPI application, CORS, and health routes are defined in backend/main.py.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


# -----------------------------
# Models
# -----------------------------
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    name: Optional[str] = None
    business_type: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str


class ResetRequest(BaseModel):
    session_id: Optional[str] = None


# -----------------------------
# Routes
# -----------------------------
@router.get("/chat/ping")
def ping():
    return {"ok": True}


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    # TODO: Replace with real LLM integration / streaming
    return ChatResponse(reply=f"Echo: {req.message}")


@router.post("/reset")
async def reset_chat(_: ResetRequest):
    # TODO: Clear any server-side session state if implemented
    return {"ok": True}
