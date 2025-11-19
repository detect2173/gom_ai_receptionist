"use client";

import React, { useState, useEffect, useRef } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

import MessageBubble from "./MessageBubble";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
interface Message {
    sender: "user" | "ai";
    text: string;
}

// ------------------------------------------------------------
// LocalStorage Keys
// ------------------------------------------------------------
const NAME_KEY = "gom_first_name";
const BIZ_KEY = "gom_business_type";

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------
export default function ChatBox() {
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const [sessionId] = useState(() => uuidv4());

    // Persistent personalization fields
    const [firstName, setFirstName] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return window.localStorage.getItem(NAME_KEY);
        }
        return null;
    });

    const [businessType, setBusinessType] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return window.localStorage.getItem(BIZ_KEY);
        }
        return null;
    });

    // Initial messages with lazy initializer — no useEffect needed
    const [messages, setMessages] = useState<Message[]>(() => {
        if (typeof window !== "undefined") {
            const storedName = window.localStorage.getItem(NAME_KEY);
            const storedBiz = window.localStorage.getItem(BIZ_KEY);

            if (storedName && storedBiz) {
                return [
                    {
                        sender: "ai",
                        text: `Welcome back, ${storedName}! How’s everything going with the ${storedBiz}?`,
                    },
                ];
            }

            if (storedName) {
                return [
                    {
                        sender: "ai",
                        text: `Welcome back, ${storedName}! What can I help you with today?`,
                    },
                ];
            }
        }

        return [
            {
                sender: "ai",
                text:
                    "Hi there 👋 — I’m Samantha, the AI Receptionist for Great Owl Marketing! How can I assist you today?",
            },
        ];
    });

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    // ------------------------------------------------------------
    // Smooth Auto-Scroll
    // ------------------------------------------------------------
    useEffect(() => {
        const t = window.setTimeout(() => {
            chatEndRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
            });
        }, 40);
        return () => window.clearTimeout(t);
    }, [messages.length, loading]);

    // ------------------------------------------------------------
    // Tone detection for streaming speed
    // ------------------------------------------------------------
    const detectTone = (
        text: string
    ): "casual" | "formal" | "stressed" | "excited" | "neutral" => {
        const t = text.toLowerCase();
        if (/(yo|hey|sup|lol|haha)/.test(t)) return "casual";
        if (/(good morning|dear|regards|sincerely)/.test(t)) return "formal";
        if (/(frustrated|angry|upset|behind|overwhelmed)/.test(t)) return "stressed";
        if (/(awesome|great|amazing|excited|love|wow)/.test(t)) return "excited";
        return "neutral";
    };

    // ------------------------------------------------------------
    // Extract first name
    // ------------------------------------------------------------
    const extractFirstName = (text: string): string | null => {
        const patterns = [
            /\bmy name is\s+([A-Za-z]+)/i,
            /\bi am\s+([A-Za-z]+)/i,
            /\bi'm\s+([A-Za-z]+)/i,
            /\bcall me\s+([A-Za-z]+)/i,
        ];

        for (const re of patterns) {
            const match = text.match(re);
            if (match && match[1]) {
                const raw = match[1].trim();
                return raw.charAt(0).toUpperCase() + raw.slice(1);
            }
        }
        return null;
    };

    // ------------------------------------------------------------
    // Extract business type
    // ------------------------------------------------------------
    const extractBusinessType = (text: string): string | null => {
        const patterns = [
            /\bi (run|own|have)\s+(a|an)?\s*([^.,!?]+)/i,
            /\bmy business is\s+(a|an)?\s*([^.,!?]+)/i,
            /\bwe (are|run|own|have)\s+(a|an)?\s*([^.,!?]+)/i,
        ];

        for (const re of patterns) {
            const match = text.match(re);
            if (match) {
                const biz = match[3] || match[2] || match[4];
                if (biz) return biz.replace(/^(a|an)\s+/i, "").trim();
            }
        }
        return null;
    };

    // ------------------------------------------------------------
    // Stream AI response
    // ------------------------------------------------------------
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

            await new Promise((r) => setTimeout(r, delay));
        }

        setLoading(false);
    };

    // ------------------------------------------------------------
    // Send user message
    // ------------------------------------------------------------
    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const tone = detectTone(text);

        // ------------------------------------------------------------
// Extract name + business type (updated logic)
// ------------------------------------------------------------
        let updatedName = firstName;
        let updatedBusinessType = businessType;

        const maybeName = extractFirstName(text);
        if (maybeName) {
            updatedName = maybeName;
            setFirstName(maybeName);

            if (typeof window !== "undefined") {
                window.localStorage.setItem(NAME_KEY, maybeName);
            }
        }

        const maybeBiz = extractBusinessType(text);
        if (maybeBiz) {
            updatedBusinessType = maybeBiz;
            setBusinessType(maybeBiz);

            if (typeof window !== "undefined") {
                window.localStorage.setItem(BIZ_KEY, maybeBiz);
            }
        }


        setMessages((prev) => [...prev, { sender: "user", text }]);
        setInput("");
        setLoading(true);

        try {
            const API_URL =
                process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

            const res = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: text,
                    session_id: sessionId,
                    name: updatedName,
                    business_type: updatedBusinessType,
                }),
            });

            const contentType = res.headers.get("content-type") || "";

            if (contentType.includes("application/json")) {
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
                        text: "I’m here and ready to help! What would you like to explore next?",
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
                        "⚠️ I’m having trouble reaching my system right now. Please try again shortly!",
                },
            ]);
            setLoading(false);
        }
    };

    // ------------------------------------------------------------
    // Reset chat (keeps name + business)
    // ------------------------------------------------------------
    const resetChat = async () => {
        try {
            const API_URL =
                process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

            await fetch(`${API_URL}/api/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId }),
            });
        } catch (e) {
            console.error("Reset error:", e);
        }

        const storedName =
            typeof window !== "undefined"
                ? window.localStorage.getItem(NAME_KEY)
                : firstName;
        const storedBiz =
            typeof window !== "undefined"
                ? window.localStorage.getItem(BIZ_KEY)
                : businessType;

        let greeting: string;

        if (storedName && storedBiz) {
            greeting = `Welcome back, ${storedName}! How’s everything going with the ${storedBiz}?`;
        } else if (storedName) {
            greeting = `Welcome back, ${storedName}! How can I help you today?`;
        } else {
            greeting =
                "Hi there 👋 — I’m Samantha, the AI Receptionist for Great Owl Marketing! How can I assist you today?";
        }

        setMessages([{ sender: "ai", text: greeting }]);
        setInput("");
        setLoading(false);
    };

    // ------------------------------------------------------------
    // Render
    // ------------------------------------------------------------
    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-gray-900 text-white shadow-xl overflow-hidden">
                {/* HEADER */}
                <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3">
                    <div className="text-center flex-1">
                        <h1 className="text-lg font-semibold">🤖 Great Owl Marketing</h1>
                        <p className="text-sm opacity-90">
                            Samantha — AI Receptionist
                        </p>
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
                        <MessageBubble
                            key={i}
                            text={m.text}
                            isAI={m.sender === "ai"}
                        />
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

                {/* INPUT BAR */}
                <div className="flex items-center bg-gray-800 p-3 border-t border-gray-700">
                    <input
                        type="text"
                        value={input}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setInput(e.target.value)
                        }
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === "Enter") void sendMessage();
                        }}
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />

                    <button
                        onClick={() => void sendMessage()}
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
