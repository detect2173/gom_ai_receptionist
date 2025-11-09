"use client";
import { useEffect, useState } from "react";
import MessageBubble from "./MessageBubble";

interface Message {
    sender: "user" | "ai";
    text: string;
}

export default function ChatBox() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    // Optional: greet on load so the box isn’t empty
    useEffect(() => {
        setMessages([{
            sender: "ai",
            text: "Hi! I’m Samantha, the  AI Receptionist for Great Owl Marketing. How can I help?"
        }]);
    }, []);

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const userMessage: Message = { sender: "user", text: trimmed };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("http://127.0.0.1:8000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmed }),
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data: { reply: string } = await res.json();
            setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { sender: "ai", text: "⚠️ I couldn’t reach the server. Is the backend running on :8000?" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "560px",
                margin: "2rem auto",
                backgroundColor: "#1e1e1e",
                borderRadius: "12px",
                padding: "1rem",
                color: "#fff",
            }}
        >
            <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>🤖 GOM AI Receptionist</h2>

            <div style={{ flex: 1, overflowY: "auto", maxHeight: "400px", marginBottom: "1rem" }}>
                {messages.map((m, i) => (
                    <MessageBubble key={i} sender={m.sender} text={m.text} />
                ))}
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    style={{
                        flex: 1,
                        padding: "0.5rem",
                        borderRadius: "8px",
                        border: "1px solid #444",
                        backgroundColor: "#2b2b2b",
                        color: "#fff",
                    }}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                    onClick={sendMessage}
                    disabled={loading}
                    style={{
                        backgroundColor: loading ? "#555" : "#0070f3",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.5rem 1rem",
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "..." : "Send"}
                </button>
            </div>
        </div>
    );
}
