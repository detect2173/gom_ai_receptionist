"use client";

import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import { motion } from "framer-motion";

interface Message {
    sender: "user" | "ai";
    text: string;
}

export default function ChatBox() {
    const [messages, setMessages] = useState<Message[]>([
        {
            sender: "ai",
            text: "Hi there 👋 — I’m Samantha, the AI Receptionist for Great Owl Marketing! How can I assist you today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the latest message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { sender: "user", text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });

            const data = await response.json();

            const aiMessage: Message = {
                sender: "ai",
                text: data.reply || "I'm here to help with anything related to Great Owl Marketing!",
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text: "Sorry, I’m having trouble reaching my system right now. Please visit [Great Owl Marketing](https://greatowlmarketing.com) for more information.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSend();
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
                marginTop: "2rem",
                borderRadius: "16px",
                borderColor: "red",
            }}
        >
            {/* Title Section  */}
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <h1 style={{ fontSize: "2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    🤖 Great Owl Marketing
                </h1>
                <p style={{ fontSize: "1.2rem", color: "#666" }}>Samantha — GOM AI Receptionist</p>
            </div>

            {/* Chat Window */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                    background: "#111",
                    padding: "1.5rem",
                    borderRadius: "16px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                    width: "90%",
                    maxWidth: "480px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "480px",
                    maxHeight: "600px",
                    overflowY: "auto",
                }}
            >
                <div style={{ flexGrow: 1 }}>
                    {messages.map((msg, idx) => (
                        <MessageBubble key={idx} sender={msg.sender} text={msg.text} />
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Input Section */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                    <input
                        type="text"
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            flex: 1,
                            padding: "0.75rem 1rem",
                            borderRadius: "8px",
                            border: "none",
                            outline: "none",
                            background: "#1e1e1e",
                            color: "#fff",
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        style={{
                            background: "#0070f3",
                            color: "#fff",
                            border: "none",
                            padding: "0.75rem 1.2rem",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        Send
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
