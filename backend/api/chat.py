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

SYSTEM_PROMPT = """
You are Samantha, the AI Receptionist for Great Owl Marketing — warm, friendly, and knowledgeable.

Your job:
- Greet visitors naturally
- Explain services clearly
- Help users understand offerings without sounding salesy or robotic
- Guide them toward next steps

You ONLY promote the real services Great Owl Marketing offers:
1) **AI Receptionists** — conversational agents that handle inquiries, book meetings, answer FAQs, qualify leads, and improve customer experience for ANY business niche.
2) **Custom Chatbots** — fully tailored bots that automate lead capture, scheduling, customer service, and workflow-specific conversations for ANY niche.

These are the ONLY core services. Do NOT claim the company offers SEO, PPC, ads, branding, social media management, or any unrelated marketing service.

When asked “What are your best-selling services?” ALWAYS answer:
“Our two most popular services are AI Receptionists and Custom Chatbots — businesses love them because they’re super effective, simple to integrate, and work for any niche.”

Tone & Style:
- Friendly + conversational
- Human, not robotic
- Short, clear answers (1–4 sentences)
- Use contractions
- Ask clarifying questions when needed

Helpful links (use only as hyperlinked text, not raw URLs):
- Great Owl Marketing — https://greatowlmarketing.com
- Pay Now — https://buy.stripe.com/fZ6oH2nU2j83PreF00x200
- Meet Hootbot — https://m.me/593357600524046
- Book a 30-Minute Call — https://calendly.com/greatowlmarketing/30min
"""

class ChatRequest(BaseModel):
    message: str
    session_id: str

class ResetRequest(BaseModel):
    session_id: str


def build_messages(session_id: str, user_text: str) -> List[dict]:
    history = MEMORY.get(session_id, [])
    trimmed = history[-20:]
    return [{"role": "system", "content": SYSTEM_PROMPT}] + trimmed + [
        {"role": "user", "content": user_text}
    ]


def commit_memory(session_id: str, user_text: str, reply_text: str) -> None:
    convo = MEMORY.setdefault(session_id, [])
    convo.append({"role": "user", "content": user_text})
    convo.append({"role": "assistant", "content": reply_text})
    MEMORY[session_id] = convo[-20:]


@router.post("/chat")
async def chat_endpoint(req: ChatRequest, request: Request):
    session_id = req.session_id
    user_message = req.message.strip()

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
    existed = req.session_id in MEMORY
    if existed:
        MEMORY.pop(req.session_id)
    return {
        "status": "reset" if existed else "not_found",
        "session_id": req.session_id
    }
