from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import logging
import os

# ----- Logging -----
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("gom.ai_receptionist")

# ----- App -----
app = FastAPI(title="GOM AI Receptionist API", version="0.1.0")

# CORS (adjust origins for prod)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- Models -----
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User message")

class ChatResponse(BaseModel):
    reply: str

# ----- Routes -----
@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    msg = req.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    logger.info("Incoming message: %s", msg)

    # TODO: Replace with your real response generator
    reply = (
        "Hello! I'm doing great, thanks for asking. "
        "How can I assist you today? (Payments: 'Pay Now', Demos: 'Meet Hootbot', Scheduling: 'Book a 30 minute call')"
    )

    logger.info("Reply: %s", reply)
    return ChatResponse(reply=reply)
