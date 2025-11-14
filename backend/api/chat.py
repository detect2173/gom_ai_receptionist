from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    user_msg = request.message.strip().lower()

    # Handle common greetings naturally
    if user_msg in {"hi", "hello", "hey", "good morning", "good afternoon"}:
        return {
            "reply": "Hello there! 😊 I’m Samantha — your AI receptionist. How are you doing today?"
        }

    # Handle thanks / politeness
    elif "thank" in user_msg:
        return {
            "reply": "You're very welcome! Is there anything else I can help you with?"
        }

    # Handle business-related inquiries
    elif any(word in user_msg for word in ["book", "schedule", "appointment", "meeting"]):
        return {
            "reply": "Sure thing! You can easily schedule a time using this link: [Book a 30 minute call](https://calendly.com/phineasjholdings-info/30min)"
        }

    elif any(word in user_msg for word in ["pay", "invoice", "payment"]):
        return {
            "reply": "No problem — you can take care of that right here: [Pay Now](https://buy.stripe.com/fZu6oH2nU2j83PreF00x200)"
        }

    elif any(word in user_msg for word in ["hootbot", "demo", "chatbot"]):
        return {
            "reply": "You can try a live demo anytime here: [Meet Hootbot](https://m.me/593357600524046)"
        }

    # Fallback: general conversational tone
    else:
        return {
            "reply": "I'm happy to help! Could you tell me a little more about what you’re looking for?"
        }
