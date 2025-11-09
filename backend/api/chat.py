from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from backend.config import OPENAI_API_KEY
import os

router = APIRouter()
client = OpenAI(api_key=OPENAI_API_KEY)


class ChatRequest(BaseModel):
    message: str


def load_knowledge():
    """Reads the knowledge base text file and returns its content."""
    knowledge_path = os.path.join(os.path.dirname(__file__), "..", "knowledge", "knowledge_base.txt")
    try:
        with open(knowledge_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "No knowledge base found."


@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    user_message = request.message.strip()

    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    knowledge = load_knowledge()

    # Combine user message with knowledge context
    prompt = f"""
    You are GOM AI Receptionist — a friendly, knowledgeable assistant for Great Owl Marketing.
    Reference the information below to answer questions accurately and professionally.

    === Knowledge Base ===
    {knowledge}

    === User Message ===
    {user_message}
    """

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system",
                 "content": "You are Samantha, the AI Receptionist for Great Owl Marketing. Be concise, polite, and professional."},
                {"role": "user", "content": prompt},
            ],
        )
        reply = completion.choices[0].message.content
        return {"reply": reply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
