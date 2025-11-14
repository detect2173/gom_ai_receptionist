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

// Toggle this to true when you want backend prompt logging in the console
const DEBUG = false;

const INITIAL_GREETING =
    "Hi there 👋 — I’m Samantha, the AI Receptionist for Great Owl Marketing! How can I assist you today?";

export default function ChatBox() {
    const [messages, setMessages] = useState<Message[]>([
        { sender: "ai", text: INITIAL_GREETING },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const [sessionId] = useState(() => uuidv4());

    // Smooth scroll when messages change or while streaming
    useEffect(() => {
        const id = window.setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 30);
        return () => window.clearTimeout(id);
    }, [messages.length, loading]);

    // Rough tone detector (for typing speed)
    const detectTone = (
        text: string
    ): "casual" | "formal" | "stressed" | "excited" | "neutral" => {
        const t = text.toLowerCase();
        if (/(yo|hey|sup|lol|haha)/.test(t)) return "casual";
        if (/(good morning|dear|regards|sincerely)/.test(t)) return "formal";
        if (/(frustrated|angry|mad|upset|behind|late)/.test(t)) return "stressed";
        if (/(awesome|great|amazing|excited|love|wow)/.test(t)) return "excited";
        return "neutral";
    };

    // Streaming from backend → progressively update last AI message
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
                if (last && last.sender === "ai") {
                    last.text = partial;
                } else {
                    copy.push({ sender: "ai", text: partial });
                }
                return copy;
            });

            chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            await new Promise((r) => setTimeout(r, delay));
        }

        setLoading(false);
    };

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
                // Fallback if backend ever returns JSON instead of streaming text
                const data = await res.json();
                const reply =
                    typeof data.reply === "string"
                        ? data.reply
                        : JSON.stringify(data, null, 2);
                setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
                setLoading(false);
                return;
            }

            const reader = res.body?.getReader();
            if (reader) {
                await streamAIResponse(reader, tone);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        sender: "ai",
                        text:
                            "I’m here and ready to help! What would you like to do next?",
                    },
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
                        "⚠️ I’m having trouble reaching my system right now. Please try again shortly or book a quick call: Book a 30-Minute Call.",
                },
            ]);
            setLoading(false);
        }
    };

    const resetChat = async () => {
        try {
            const API_URL =
                process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

            const headers: HeadersInit = {
                "Content-Type": "application/json",
            };
            if (DEBUG) headers["X-Debug"] = "true";

            await fetch(`${API_URL}/api/reset`, {
                method: "POST",
                headers,
                body: JSON.stringify({ session_id: sessionId }),
            });
        } catch (e) {
            console.error("Reset error:", e);
        }

        // Reset local UI regardless of backend result
        setMessages([{ sender: "ai", text: INITIAL_GREETING }]);
        setInput("");
        setLoading(false);
    };

    const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") sendMessage();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md bg-gray-900 text-white rounded-3xl shadow-lg overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-sky-500 p-4 flex items-center justify-between">
                    <div className="text-center flex-1">
                        <h1 className="text-lg font-semibold flex justify-center items-center gap-2">
                            🤖 Great Owl Marketing
                        </h1>
                        <p className="text-sm opacity-90">
                            Samantha — GOM AI Receptionist
                        </p>
                    </div>
                    <button
                        onClick={resetChat}
                        className="ml-2 text-xs bg-gray-900/40 hover:bg-gray-900/70 px-3 py-1 rounded-full border border-white/30"
                    >
                        Reset
                    </button>
                </div>

                {/* Chat */}
                <div className="flex flex-col space-y-3 p-4 overflow-y-auto max-h-[520px]">
                    {messages.map((m, i) => (
                        <MessageBubble key={i} text={m.text} isAI={m.sender === "ai"} />
                    ))}
                    {loading && (
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            className="text-sky-400 italic text-sm px-2"
                        >
                            Samantha is typing…
                        </motion.div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="flex items-center p-3 bg-gray-800 border-t border-gray-700">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                        value={input}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setInput(e.target.value)
                        }
                        onKeyDown={onKey}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading}
                        className="ml-2 bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
