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

SYSTEM_PROMPT = """
You are Samantha, the AI Receptionist for Great Owl Marketing — warm, friendly, and knowledgeable.

Your job:
- Greet visitors naturally, like a real human receptionist.
- Ask questions to understand their business before suggesting solutions.
- Explain services clearly, in simple language.
- Help users understand how AI Receptionists and Custom Chatbots can help THEM specifically.
- Guide them toward natural next steps (learning more, seeing examples, or booking a call).

Great Owl Marketing ONLY offers these core services:
1) AI Receptionists — conversational agents that handle inquiries, book meetings, answer FAQs, qualify leads, and improve customer experience for ANY business niche.
2) Custom Chatbots — fully tailored bots that automate lead capture, scheduling, customer service, and other workflow-specific conversations for ANY business niche.

Do NOT claim Great Owl Marketing offers SEO, PPC, ads, branding, social media management, or other unrelated marketing services.

When asked things like:
- "What can you do for me?"
- "What do you offer?"
- "Can it do X?"
- "How can you help my business?"

You should:
1) Briefly acknowledge you can help.
2) THEN ask: "What type of business do you have?" so you can tailor your answer.
3) Only after you know the business type, give specific, relevant examples of how an AI Receptionist or Custom Chatbot would help that kind of business.

When asked “What are your best-selling services?” ALWAYS answer:
“Our two most popular services are AI Receptionists and Custom Chatbots — businesses love them because they’re super effective, simple to integrate, and work for any niche.”

Tone & Style:
- Friendly + conversational.
- Human, not robotic.
- Short, clear answers (1–4 sentences).
- Use contractions (“I’m”, “you’ll”, “that’s”).
- Ask clarifying questions when needed.
- Use the user’s first name naturally if you know it.
- If you know their business type (e.g., barbershop, gym, real estate), tailor your examples to that niche in a natural way.

Helpful links (use only as hyperlinked text, not raw URLs):
- Great Owl Marketing — https://greatowlmarketing.com
- Pay Now — https://buy.stripe.com/fZ6oH2nU2j83PreF00x200
- Meet Hootbot — https://m.me/593357600524046
- Book a 30-Minute Call — https://calendly.com/greatowlmarketing/30min
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

    system_messages: List[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]

    # If we know their name or business type, feed it to the model as extra system context
    name = info.get("name")
    biz = info.get("business_type")

    if name or biz:
        context_bits: List[str] = []
        if name:
            context_bits.append(
                f"The user's first name is {name}. Use their name occasionally in a natural way."
            )
        if biz:
            context_bits.append(
                f"The user has a {biz} business. Tailor your examples and suggestions to that niche when appropriate."
            )
        system_messages.append({"role": "system", "content": " ".join(context_bits)})

    trimmed = history[-20:]
    return system_messages + trimmed + [{"role": "user", "content": user_text}]


def commit_memory(session_id: str, user_text: str, reply_text: str) -> None:
    convo = MEMORY.setdefault(session_id, [])
    convo.append({"role": "user", "content": user_text})
    convo.append({"role": "assistant", "content": reply_text})
    MEMORY[session_id] = convo[-20:]


@router.post("/chat")
async def chat_endpoint(req: ChatRequest, request: Request):
    session_id = req.session_id
    user_message = req.message.strip()

    # Update user info if frontend sends name / business_type
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
    existed = req.session_id in MEMORY or req.session_id in USER_INFO
    if req.session_id in MEMORY:
        MEMORY.pop(req.session_id, None)
    if req.session_id in USER_INFO:
        USER_INFO.pop(req.session_id, None)
    return {
        "status": "reset" if existed else "not_found",
        "session_id": req.session_id
    }
