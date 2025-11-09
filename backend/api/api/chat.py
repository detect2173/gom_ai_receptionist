from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from backend.config import OPENAI_API_KEY


router = APIRouter()
client = OpenAI(api_key=OPENAI_API_KEY)

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    user_message = request.message.strip()

    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are GOM AI Receptionist, a friendly, professional assistant for Great Owl Marketing. Be concise, polite, and confident."},
                {"role": "user", "content": user_message},
            ],
        )

        ai_reply = completion.choices[0].message.content
        return {"reply": ai_reply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {e}")
