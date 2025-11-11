"""
Basic API tests for the GOM AI Receptionist backend.
Ensures health, happy path, and validation behavior.
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_healthz():
    """Verify that /healthz returns OK"""
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"

def test_chat_happy_path():
    """Ensure chat endpoint returns valid reply"""
    r = client.post("/api/chat", json={"message": "Hello"})
    assert r.status_code == 200
    data = r.json()
    assert "reply" in data
    assert isinstance(data["reply"], str)
    assert len(data["reply"]) > 0

def test_chat_rejects_empty_message():
    """Ensure backend rejects empty input"""
    r = client.post("/api/chat", json={"message": ""})
    assert r.status_code == 422  # FastAPI's Pydantic validation error
    assert "detail" in r.json()

