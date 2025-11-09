from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rich.console import Console
from rich.theme import Theme
from api.chat import router as chat_router









custom_theme = Theme({
    "info": "cyan",
    "warning": "yellow",
    "error": "bold red",
    "debug": "dim blue",
})
console = Console(theme=custom_theme)


app = FastAPI()
app.include_router(chat_router, prefix="/api")


# Allow your frontend to connect
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models for chat messages
class MessageIn(BaseModel):
    text: str

class MessageOut(BaseModel):
    reply: str

@app.get("/")
def root():
    return {"message": "GOM AI Receptionist backend is running!"}

@app.post("/chat", response_model=MessageOut)
def chat(message: MessageIn):
    """A simple endpoint for chatbot replies."""
    user_message = message.text.lower()

    # Example logic (will later be replaced by AI)
    if "hello" in user_message:
        reply = "Hello there! How can I help you today?"
    elif "hours" in user_message:
        reply = "We’re open Monday through Friday, 8 AM to 5 PM."
    elif "contact" in user_message:
        reply = "You can reach us at support@greatowlmarketing.com."
    else:
        reply = "I'm still learning — could you rephrase that?"

    return {"reply": reply}
