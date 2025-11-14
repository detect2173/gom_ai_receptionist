"use client";

import React, { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from "react";
import MessageBubble from "./MessageBubble";

/** Typing indicator (animated bouncing dots) */
const TypingIndicator = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            marginLeft: "0.75rem",
            marginTop: "0.5rem",
        }}
    >
        <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-150" />
        <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-300" />
    </motion.div>
);

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
  const chatEndRef = useRef<HTMLDivElement | null>(null);

<<<<<<< HEAD
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
=======
    // Auto-scroll when messages update or loading toggles
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);
>>>>>>> 522ea37 (Quick commit on 2025-11-14 08:49 [branch: ])

  async function sendMessage() {
    const userMessage = input.trim();
    if (!userMessage) return;

    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

<<<<<<< HEAD
      if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
      const data = await response.json();

      setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, I encountered a small hiccup. Could you try again?" },
      ]);
    }
  }
=======
            const aiMessage: Message = {
                sender: "ai",
                text:
                    data.reply ||
                    "I'm here to help with anything related to Great Owl Marketing!",
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text:
                        "⚠️ Sorry, I’m having trouble reaching my system right now. Please visit [Great Owl Marketing](https://greatowlmarketing.com) for more information.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };
>>>>>>> 522ea37 (Quick commit on 2025-11-14 08:49 [branch: ])

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

<<<<<<< HEAD
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="text-center py-3 border-b border-gray-200">
          <h1 className="text-lg font-semibold flex justify-center items-center gap-2">
            🤖 Great Owl Marketing
          </h1>
          <p className="text-gray-600 text-sm">Samantha — GOM AI Receptionist</p>
=======
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
                marginTop: "2rem",
            }}
        >
            {/* Title Section */}
            <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                <h1
                    style={{
                        fontSize: "2rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        color: "#fff",
                    }}
                >
                    🤖 Great Owl Marketing
                </h1>
                <p style={{ fontSize: "1rem", color: "#9CA3AF" }}>
                    Samantha — GOM AI Receptionist
                </p>
            </div>

            {/* Chat Window */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                    background: "#0F172A", // slate-900
                    padding: "1.5rem",
                    borderRadius: "16px",
                    boxShadow: "0 10px 28px rgba(37,99,235,0.25)",
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
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            <MessageBubble
                                text={msg.text}
                                isAI={msg.sender === "ai"}
                            />
                        </motion.div>
                    ))}

                    {loading && <TypingIndicator />}
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
                            background: "#1E293B",
                            color: "#fff",
                            boxShadow: "inset 0 0 4px rgba(255,255,255,0.05)",
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        style={{
                            background: loading
                                ? "linear-gradient(90deg, #0EA5E9 0%, #3B82F6 100%)"
                                : "linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)",
                            color: "#fff",
                            border: "none",
                            padding: "0.75rem 1.2rem",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: 600,
                            boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                            transition: "all 0.2s ease",
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading ? "..." : "Send"}
                    </button>
                </div>
            </motion.div>
>>>>>>> 522ea37 (Quick commit on 2025-11-14 08:49 [branch: ])
        </div>

        {/* Chat window */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-black">
          {messages.map((msg, index) => (
            <MessageBubble key={index} text={msg.text} isAI={msg.sender === "ai"} />
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="flex items-center border-t border-gray-200 p-3 bg-black">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 p-2 rounded-lg bg-neutral-900 text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={input}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button
            onClick={sendMessage}
            className="ml-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg text-white font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
