from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Adjust this in Phase 2 to match your deployed frontend origin(s)
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MessageIn(BaseModel):
    text: str
    session_id: str | None = None
    metadata: dict | None = None

class MessageOut(BaseModel):
    reply: str
    session_id: str | None = None

@app.get("/")
def root():
    return {"message": "GOM AI Receptionist backend is running!"}

@app.post("/message", response_model=MessageOut)
def message(incoming: MessageIn):
    # For now, echo. In Phase 2 we'll call OpenAI and add memory.
    reply = f"Thanks for your message: '{incoming.text}'. A real AI reply goes here."
    return MessageOut(reply=reply, session_id=incoming.session_id)
