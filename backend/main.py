from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path
import os

# -----------------------------------------------------------
# Load .env from project root (one level up)
# -----------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=ROOT_DIR / ".env")

# -----------------------------------------------------------
# Initialize FastAPI
# -----------------------------------------------------------
app = FastAPI(title="GOM AI Receptionist API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------
# Models and OpenAI setup
# -----------------------------------------------------------
class ChatRequest(BaseModel):
    message: str


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

SYSTEM_PROMPT = """
You are Samantha, the friendly and professional AI Receptionist for Great Owl Marketing.
Your tone is natural, warm, and conversational — never robotic or repetitive.
You assist with scheduling, payments, demos, and services.
Avoid repeating user input, and don't list multiple links unless asked directly.
Keep messages concise and human-like.
"""

# -----------------------------------------------------------
# Chat endpoint
# -----------------------------------------------------------
@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    user_msg = request.message.strip().lower()

    # Quick rule-based responses for local feel
    if user_msg in {"hi", "hello", "hey", "good morning", "good afternoon"}:
        return {"reply": "Hi there! 👋 I’m Samantha — your AI receptionist. How are you today?"}

    if "thank" in user_msg:
        return {"reply": "You're very welcome! Is there anything else I can help you with?"}

    if any(word in user_msg for word in ["book", "schedule", "appointment", "meeting"]):
        return {"reply": "Sure! You can schedule a time here: [Book a 30-minute call](https://calendly.com/phineasjholdings-info/30min)"}

    if any(word in user_msg for word in ["pay", "invoice", "payment"]):
        return {"reply": "No problem — you can make your payment securely here: [Pay Now](https://buy.stripe.com/fZu6oH2nU2j83PreF00x200)"}

    if any(word in user_msg for word in ["hootbot", "demo", "chatbot"]):
        return {"reply": "You can try our demo chatbot anytime: [Meet Hootbot](https://m.me/593357600524046)"}

    # Fallback if no API key is present
    if not client:
        return {
            "reply": "Hi there! I’m Samantha, but it seems my AI service is offline. I can still help with basic info if you’d like!"
        }

    # Live AI response
    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT.strip()},
                {"role": "user", "content": request.message},
            ],
            temperature=0.7,
            max_tokens=200,
        )

        reply = completion.choices[0].message.content.strip()
        return {"reply": reply}

    except Exception as e:
        print("OpenAI error:", e)
        raise HTTPException(status_code=500, detail="AI response generation failed")


# -----------------------------------------------------------
# Health check endpoint
# -----------------------------------------------------------
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "ai_connected": bool(OPENAI_API_KEY),
        "cwd": str(ROOT_DIR),
    }
