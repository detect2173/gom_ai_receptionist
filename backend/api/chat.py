"""
Chat API router

This module must ONLY expose an APIRouter named `router`.
The FastAPI application, CORS, and health routes are defined in backend/main.py.
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, List
from openai import AsyncOpenAI
import os

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
# Session memory
# -----------------------------
SESSIONS: Dict[str, List[dict]] = {}


def get_session(session_id: str) -> List[dict]:
    if session_id not in SESSIONS:
        SESSIONS[session_id] = []
    return SESSIONS[session_id]


# -----------------------------
# System Prompt
# -----------------------------
def build_system_prompt(name: str | None, biz: str | None):
    prompt = (
        "You are Samantha, the AI receptionist for Great Owl Marketing. "
        "You are warm, conversational, friendly, helpful, and human-like. "
        "Keep responses short, natural, and engaging.\n\n"
    )

    if name:
        prompt += f"The user's name is {name}. Use it naturally.\n"

    if biz:
        prompt += (
            f"The user runs a business in {biz}. Tailor examples and suggestions to that industry.\n"
        )

    prompt += "Never echo the user's text. Move the conversation forward."
    return prompt


# -----------------------------
# Routes
# -----------------------------
@router.get("/chat/ping")
def ping():
    return {"ok": True}


@router.post("/chat")
async def chat(req: ChatRequest):
    session_id = req.session_id or "default"
    history = get_session(session_id)

    # Build conversation for new SDK
    messages = [
        {"role": "system", "content": build_system_prompt(req.name, req.business_type)}
    ]
    messages.extend(history)
    messages.append({"role": "user", "content": req.message})

    # Store user message in memory
    history.append({"role": "user", "content": req.message})

    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def stream_response():
        full_reply = ""

        response = await client.responses.create(
            model="gpt-4o-mini",
            input=messages,
            stream=True,
        )

        async for event in response:
            if event.type == "response.output_text.delta":
                token = event.delta
                full_reply += token
                yield token

        # Save assistant response
        history.append({"role": "assistant", "content": full_reply})

    return StreamingResponse(stream_response(), media_type="text/plain")


@router.post("/reset")
async def reset_chat(req: ResetRequest):
    if req.session_id and req.session_id in SESSIONS:
        del SESSIONS[req.session_id]
    return {"ok": True}
