from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
from typing import Dict, List
import os

router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# In-memory short-term conversation memory per session_id
MEMORY: Dict[str, List[dict]] = {}

# Authoritative list of what you sell (edit this, not the prompt text)
OFFERINGS = """
Great Owl Marketing — Current Offerings:
1) AI Receptionist (text-first → voice-capable) for inbound lead capture, FAQs, scheduling, and payments.
2) Custom Chatbots (ManyChat + BotBuilders Core) with niche flows for restaurants and other local businesses.
3) Review & Reputation Automations (review request, routing, and response flows).
4) Lead Routing + CRM Notes (GetResponse + Calendly and related integrations).
5) Website / Embed Widgets for on-site lead capture and call booking.

Stay inside this catalog. If the user asks for something outside this scope,
acknowledge it briefly and guide them toward a discovery call instead of inventing services.
"""

SYSTEM_PROMPT = f"""
You are Samantha — the friendly, emotionally intelligent, and confident AI Receptionist for Great Owl Marketing.

Tone & behavior:
- Sound like a real human receptionist: warm, clear, and capable.
- Mirror the user's tone (casual, formal, stressed, excited) while staying professional.
- Use contractions and natural phrasing; never say you're an AI model.
- Keep responses concise (1–4 sentences) unless the user explicitly asks for more detail.
- Vary your wording; avoid repeating the same greeting multiple times in one conversation.

Business scope (do NOT invent services):
{OFFERINGS}

Helpful links (use as hyperlinked text, not raw URLs):
- "Great Owl Marketing" → https://greatowlmarketing.com
- "Pay Now" → https://buy.stripe.com/fZ6oH2nU2j83PreF00x200
- "Meet Hootbot" → https://m.me/593357600524046
- "Book a 30-Minute Call" → https://calendly.com/greatowlmarketing/30min

If a user asks “what does that include?” or similar, give a clear, concrete breakdown
of the relevant offering, tied directly to the catalog above.

When a question is off-topic, answer briefly and politely, then steer back to marketing,
automation, or how Great Owl Marketing can help.
"""

class ChatRequest(BaseModel):
    message: str
    session_id: str

class ResetRequest(BaseModel):
    session_id: str


def build_messages(session_id: str, user_text: str) -> List[dict]:
    """Build the message list with short-term memory for this session."""
    history = MEMORY.get(session_id, [])
    # keep last 20 messages (10 turns) for context
    trimmed = history[-20:]
    return [{"role": "system", "content": SYSTEM_PROMPT}] + trimmed + [
        {"role": "user", "content": user_text}
    ]


def commit_memory(session_id: str, user_text: str, reply_text: str) -> None:
    convo = MEMORY.setdefault(session_id, [])
    convo.append({"role": "user", "content": user_text})
    convo.append({"role": "assistant", "content": reply_text})
    MEMORY[session_id] = convo[-20:]  # cap at 20 messages


@router.post("/chat")
async def chat_endpoint(req: ChatRequest, request: Request):
    """
    Streams Samantha's reply as plain text (no JSON envelope).
    Honors per-session memory, and supports optional X-Debug header for logging.
    """
    session_id = req.session_id
    user_message = req.message.strip()
    debug = (request.headers.get("X-Debug") or "").lower() == "true"

    messages = build_messages(session_id, user_message)

    if debug:
        print("==== X-Debug: PROMPT ====")
        for m in messages:
            role = m.get("role", "").upper()
            content = m.get("content", "")
            print(f"{role}: {content[:300]}")
        print("==== END PROMPT ====")

    full_chunks: List[str] = []

    async def stream():
        try:
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.7,
                max_tokens=500,
                stream=True,
            )

            for chunk in completion:
                delta = chunk.choices[0].delta if chunk.choices else None
                text = ""
                if delta:
                    # depending on client version, delta may be dict-like
                    text = getattr(delta, "content", None) or getattr(delta, "get", lambda *_: None)("content") or ""
                    if isinstance(delta, dict):
                        text = delta.get("content") or text

                if not text:
                    continue

                full_chunks.append(text)
                yield text
        except Exception as e:
            print("Streaming error:", e)
            yield "⚠️ I’m having a temporary issue. Please try again in a moment or "
            yield "Book a 30-Minute Call."

    async def wrapper():
        # stream out to client
        async for piece in stream():
            yield piece
        # when finished, commit to memory
        reply_text = "".join(full_chunks).strip()
        if reply_text:
            commit_memory(session_id, user_message, reply_text)

    return StreamingResponse(wrapper(), media_type="text/plain; charset=utf-8")


@router.post("/reset")
async def reset_endpoint(req: ResetRequest):
    """
    Clears stored conversation memory for a given session_id.
    Useful for demos or starting a fresh conversation.
    """
    existed = req.session_id in MEMORY
    if existed:
        MEMORY.pop(req.session_id, None)
    return {"status": "reset" if existed else "not_found", "session_id": req.session_id}
