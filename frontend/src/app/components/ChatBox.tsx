"use client";
import { useState, useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import "@/app/globals.css";

interface Message {
    sender: "user" | "ai";
    text: string;
}

export default function ChatBox() {
    const [messages, setMessages] = useState<Message[]>([
        { sender: "ai", text: "Hi there 👋 — I’m Samantha, the AI Receptionist for Great Owl Marketing! How can I assist you today?" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Auto-scroll when new messages appear
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: "user" as const, text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("http://127.0.0.1:8000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });

            const data = await res.json();
            const aiMessage = { sender: "ai" as const, text: data.reply };
            setMessages((prev) => [...prev, aiMessage]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { sender: "ai", text: "⚠️ Sorry, I’m having trouble connecting right now. Please try again shortly." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="flex flex-col w-[90%] max-w-[520px] mx-auto my-12 rounded-2xl shadow-2xl p-6
                 bg-neutral-900 text-gray-100 font-[Inter,sans-serif]"
        >
            <h2 className="text-center mb-4 text-lg font-semibold tracking-wide">
                🤖 Samantha — GOM AI Receptionist
            </h2>

            <div
                className="flex-1 overflow-y-auto max-h-[420px] mb-4 pr-2 scroll-smooth"
                style={{ scrollbarWidth: "thin" }}
            >
                {messages.map((m, i) => (
                    <MessageBubble key={i} sender={m.sender} text={m.text} />
                ))}

                {loading && (
                    <div className="flex items-center text-gray-400 italic text-sm mt-2 ml-2">
                        Samantha is typing
                        <span className="ml-1 animate-pulse">...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={loading ? "Please wait..." : "Type your message..."}
                    disabled={loading}
                    className={`flex-1 px-3 py-2 rounded-lg border border-gray-600 bg-neutral-800 
                     text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition 
                     ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                <button
                    onClick={sendMessage}
                    disabled={loading}
                    className={`rounded-lg px-4 py-2 font-medium transition 
                     ${loading
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"}`}
                >
                    {loading ? "..." : "Send"}
                </button>
            </div>
        </div>
    );
}
