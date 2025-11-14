"use client";

import React, {
    useState,
    useEffect,
    useRef,
    ChangeEvent,
    KeyboardEvent,
} from "react";
import MessageBubble from "./MessageBubble";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

interface Message {
    sender: "user" | "ai";
    text: string;
}

const INITIAL_GREETING =
    "Hi there 👋 — I’m Samantha, the AI Receptionist for Great Owl Marketing! How can I assist you today?";

const DEBUG = false;

export default function ChatBox() {
    const [messages, setMessages] = useState<Message[]>([
        { sender: "ai", text: INITIAL_GREETING },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const [sessionId] = useState(() => uuidv4());

    // Smooth autoscroll
    useEffect(() => {
        const t = setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 40);
        return () => clearTimeout(t);
    }, [messages.length, loading]);

    /** Detect rough tone to adjust typing simulation speed */
    const detectTone = (
        text: string
    ): "casual" | "formal" | "stressed" | "excited" | "neutral" => {
        const t = text.toLowerCase();
        if (/(yo|hey|sup|lol|haha)/.test(t)) return "casual";
        if (/(good morning|dear|regards|sincerely)/.test(t)) return "formal";
        if (/(frustrated|angry|upset|behind)/.test(t)) return "stressed";
        if (/(awesome|great|amazing|excited|love|wow)/.test(t)) return "excited";
        return "neutral";
    };

    /** Streaming AI response */
    const streamAIResponse = async (
        reader: ReadableStreamDefaultReader,
        tone: string
    ) => {
        const decoder = new TextDecoder();
        let partial = "";

        const speedMap: Record<string, number> = {
            casual: 18,
            excited: 14,
            neutral: 28,
            stressed: 42,
            formal: 55,
        };
        const delay = speedMap[tone] ?? 28;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            if (!chunk) continue;
            partial += chunk;

            setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.sender === "ai") {
                    last.text = partial;
                } else {
                    copy.push({ sender: "ai", text: partial });
                }
                return copy;
            });

            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
            await new Promise((r) => setTimeout(r, delay));
        }
        setLoading(false);
    };

    /** Send user message */
    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const tone = detectTone(text);
        setMessages((prev) => [...prev, { sender: "user", text }]);
        setInput("");
        setLoading(true);

        try {
            const API_URL =
                process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

            const headers: HeadersInit = {
                "Content-Type": "application/json",
            };
            if (DEBUG) headers["X-Debug"] = "true";

            const res = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers,
                body: JSON.stringify({ message: text, session_id: sessionId }),
            });

            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                const data = await res.json();
                setMessages((prev) => [
                    ...prev,
                    { sender: "ai", text: data.reply || "I’m here to help!" },
                ]);
                setLoading(false);
                return;
            }

            const reader = res.body?.getReader();
            if (reader) {
                await streamAIResponse(reader, tone);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { sender: "ai", text: "I’m here and ready to help!" },
                ]);
                setLoading(false);
            }
        } catch (e) {
            console.error("Chat error:", e);
            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text:
                        "⚠️ I’m having trouble reaching my system right now. Please try again shortly!",
                },
            ]);
            setLoading(false);
        }
    };

    /** Reset chat & backend memory */
    const resetChat = async () => {
        try {
            const API_URL =
                process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

            await fetch(`${API_URL}/api/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId }),
            });
        } catch {}

        setMessages([{ sender: "ai", text: INITIAL_GREETING }]);
        setInput("");
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-gray-900 text-white shadow-xl overflow-hidden">
                {/* HEADER */}
                <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3">
                    <div className="text-center flex-1">
                        <h1 className="text-lg font-semibold">🤖 Great Owl Marketing</h1>
                        <p className="text-sm opacity-90">Samantha — AI Receptionist</p>
                    </div>

                    <button
                        onClick={resetChat}
                        className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full"
                    >
                        Reset
                    </button>
                </div>

                {/* CHAT WINDOW */}
                <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">
                    {messages.map((m, i) => (
                        <MessageBubble key={i} text={m.text} isAI={m.sender === "ai"} />
                    ))}

                    {loading && (
                        <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            className="text-sky-400 italic text-sm"
                        >
                            Samantha is typing…
                        </motion.div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* INPUT */}
                <div className="flex items-center bg-gray-800 p-3 border-t border-gray-700">
                    <input
                        type="text"
                        value={input}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setInput(e.target.value)
                        }
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                            e.key === "Enter" && sendMessage()
                        }
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />

                    <button
                        onClick={sendMessage}
                        disabled={loading}
                        className="ml-2 bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
