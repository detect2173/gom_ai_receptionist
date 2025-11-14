from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
import os
import asyncio
from typing import Dict, List

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- Lightweight per-session memory (last 10 turns) ---
MEMORY: Dict[str, List[Dict[str, str]]] = {}

# --- Your real product/service catalog (edit freely) ---
OFFERINGS = """
Great Owl Marketing — Current Offerings (authoritative list):
1) AI Receptionist (text-first → voice-capable) for inbound lead capture, FAQs, scheduling, and payments.
2) Custom Chatbots (ManyChat + BotBuilders Core) with niche flows for restaurants, service businesses, and local lead gen.
3) Review & Reputation Automations (request, route, respond).
4) Lead Routing + CRM Notes (GetResponse + Calendly integrations).
5) Website/Embed Widgets for on-site capture (Calendly, chat launcher, popups).
Keep answers inside this catalog. If a request is outside, redirect to a discovery call.
"""

SYSTEM_PROMPT = f"""
You are Samantha — the friendly, emotionally intelligent receptionist for Great Owl Marketing.

Tone & behavior:
- Sound human and natural; mirror the user's tone (casual, formal, stressed, excited).
- Be concise (1–4 sentences), helpful, and confident. Never robotic. No “as an AI”.
- Use links as needed (hyperlink text only):
  - Pay Now → https://buy.stripe.com/fZ6oH2nU2j83PreF00x200
  - Meet Hootbot → https://m.me/593357600524046
  - Book a 30-Minute Call → https://calendly.com/greatowlmarketing/30min
  - Great Owl Marketing → https://greatowlmarketing.com

Scope:
{OFFERINGS}

Rules:
- Do NOT invent services. If asked about something outside the list, pivot: suggest a quick call and ask one clarifying question.
- Avoid repeating the same greeting within a conversation.
- When the user asks “what does that include?” or similar, answer with a crisp, concrete breakdown tied to the relevant item from the catalog.
"""

class ChatRequest(BaseModel):
    message: str
    session_id: str

def _messages_for(session_id: str, user_message: str) -> List[Dict[str, str]]:
    history = MEMORY.get(session_id, [])
    # keep last 10 turns (user/assistant pairs) + system each time
    trimmed = history[-20:]
    return [{"role": "system", "content": SYSTEM_PROMPT}] + trimmed + [
        {"role": "user", "content": user_message}
    ]

@router.post("/chat")
async def chat_endpoint(req: ChatRequest):
    """
    Streams plain-text tokens (no JSON wrapper). Frontend renders progressively.
    Also updates session memory once the full reply is produced.
    """
    session_id = req.session_id
    full_reply: List[str] = []

    async def streamer():
        try:
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=_messages_for(session_id, req.message.strip()),
                temperature=0.7,
                stream=True,
                max_tokens=500,
            )
            for chunk in completion:
                delta = chunk.choices[0].delta
                text = (delta.get("content") or "") if delta else ""
                if text:
                    full_reply.append(text)
                    # yield as plain text; tiny sleep smooths UI
                    yield text
                    await asyncio.sleep(0.02)
        except Exception as e:
            # Plain-text fallback on any error
            yield "⚠️ I’m having a temporary issue. Please try again in a moment or "
            yield "book a quick call: Book a 30-Minute Call."
            print("Streaming error:", e)

    def _commit_memory():
        reply = "".join(full_reply).strip()
        convo = MEMORY.setdefault(session_id, [])
        convo.append({"role": "user", "content": req.message.strip()})
        convo.append({"role": "assistant", "content": reply})
        # cap memory to last 20 messages
        MEMORY[session_id] = convo[-20:]

    async def wrapper():
        async for chunk in streamer():
            yield chunk
        # after stream completes, commit memory
        _commit_memory()

    # Plain text – no JSON envelope
    return StreamingResponse(wrapper(), media_type="text/plain; charset=utf-8")
