from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
from typing import Dict, List, Optional
import os

router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# In-memory short-term conversation memory per session_id
MEMORY: Dict[str, List[dict]] = {}

# Lightweight user metadata per session_id (first name, business type)
USER_INFO: Dict[str, Dict[str, str]] = {}

# Track last bot question per session
LAST_QUESTION: Dict[str, Optional[str]] = {}

SYSTEM_PROMPT = """
You are Samantha, the AI Receptionist for Great Owl Marketing.
Warm, conversational, and human-like.

IMPORTANT NEW BEHAVIOR:
- If the user says “yes”, “yeah”, “yep”, “sure”, “ok”, “okay”, “absolutely”,
  AND you previously asked them a question, CONTINUE that topic.
- Do NOT restart the conversation with generic phrases like:
  “How can I assist you today?”
- Do NOT reset the topic unless the user explicitly changes subjects.

Other rules:
- Use the user's first name naturally when you know it.
- Tailor examples to the user's business type.
- Keep replies short and friendly.
- Services:
   1) AI Receptionists
   2) Custom Chatbots
"""

class ChatRequest(BaseModel):
    message: str
    session_id: str
    name: Optional[str] = None
    business_type: Optional[str] = None

class ResetRequest(BaseModel):
    session_id: str


def build_messages(session_id: str, user_text: str) -> List[dict]:
    history = MEMORY.get(session_id, [])
    info = USER_INFO.get(session_id, {})

    system_messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Continuation logic added HERE
    confirmations = ["yes", "yeah", "yep", "sure", "ok", "okay", "absolutely"]
    if user_text.strip().lower() in confirmations:
        last_q = LAST_QUESTION.get(session_id)
        if last_q:
            system_messages.append({
                "role": "system",
                "content": f"The user confirmed your earlier question: '{last_q}'. Continue this conversation thread."
            })

    # Inject personalization context
    context_bits = []
    if info.get("name"):
        context_bits.append(f"The user's first name is {info['name']}.")
    if info.get("business_type"):
        context_bits.append(f"The user runs a {info['business_type']} business. Tailor examples to that niche.")

    if context_bits:
        system_messages.append({"role": "system", "content": " ".join(context_bits)})

    trimmed = history[-20:]
    return system_messages + trimmed + [{"role": "user", "content": user_text}]


def commit_memory(session_id: str, user_text: str, reply_text: str) -> None:
    convo = MEMORY.setdefault(session_id, [])
    convo.append({"role": "user", "content": user_text})
    convo.append({"role": "assistant", "content": reply_text})
    MEMORY[session_id] = convo[-20:]

    # Track last question
    if reply_text.strip().endswith("?"):
        LAST_QUESTION[session_id] = reply_text
    else:
        LAST_QUESTION[session_id] = None


@router.post("/chat")
async def chat_endpoint(req: ChatRequest, request: Request):
    session_id = req.session_id
    user_message = req.message.strip()

    # Store first name + business type
    if session_id not in USER_INFO:
        USER_INFO[session_id] = {}

    if req.name:
        USER_INFO[session_id]["name"] = req.name.strip()

    if req.business_type:
        USER_INFO[session_id]["business_type"] = req.business_type.strip()

    messages = build_messages(session_id, user_message)

    chunks: List[str] = []

    async def stream():
        try:
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.7,
                max_tokens=450,
                stream=True,
            )

            for chunk in completion:
                delta = chunk.choices[0].delta
                if not delta:
                    continue

                text = getattr(delta, "content", None)
                if not text:
                    continue

                chunks.append(text)
                yield text

        except Exception as e:
            print("STREAM ERROR:", e)
            yield "I’m having a temporary issue — please try again in just a moment."

    async def wrapper():
        async for piece in stream():
            yield piece

        final_reply = "".join(chunks).strip()
        if final_reply:
            commit_memory(session_id, user_message, final_reply)

    return StreamingResponse(wrapper(), media_type="text/plain; charset=utf-8")


@router.post("/reset")
async def reset_endpoint(req: ResetRequest):
    MEMORY.pop(req.session_id, None)
    LAST_QUESTION.pop(req.session_id, None)
    # NOTE: do NOT delete USER_INFO so personalization remains
    return {"status": "reset", "session_id": req.session_id}
