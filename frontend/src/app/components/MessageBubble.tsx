"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface MessageBubbleProps {
    sender: "user" | "ai";
    text: string;
}

export default function MessageBubble({ sender, text }: MessageBubbleProps) {
    const isAI = sender === "ai";
    const [displayText, setDisplayText] = useState("");
    const [typing, setTyping] = useState(isAI);
    const [thinking, setThinking] = useState(isAI);

    useEffect(() => {
        if (!isAI) {
            setDisplayText(text);
            return;
        }

        setDisplayText("");
        setThinking(true);
        setTyping(false);

        // Simulate a short "thinking" delay before typing starts
        const thinkingTimeout = setTimeout(() => {
            setThinking(false);
            setTyping(true);
            let i = 0;

            const interval = setInterval(() => {
                setDisplayText((prev) => prev + text.charAt(i));
                i++;
                if (i >= text.length) {
                    clearInterval(interval);
                    setTyping(false);
                }
            }, 20); // typing speed (ms per character)

            return () => clearInterval(interval);
        }, 1500); // delay before typing starts

        return () => clearTimeout(thinkingTimeout);
    }, [text, isAI]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{
                display: "flex",
                justifyContent: isAI ? "flex-start" : "flex-end",
                marginBottom: "0.75rem",
            }}
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                    background: isAI
                        ? "linear-gradient(135deg, #0070f3, #00bcd4)"
                        : "linear-gradient(135deg, #444, #222)",
                    color: "#fff",
                    padding: "0.75rem 1rem",
                    borderRadius: isAI
                        ? "12px 12px 12px 4px"
                        : "12px 12px 4px 12px",
                    maxWidth: "80%",
                    fontSize: "0.95rem",
                    lineHeight: "1.5",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                }}
            >
                {thinking ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            style={{ fontSize: "1.2rem" }}
                        >
                            •
                        </motion.span>
                        <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                            style={{ fontSize: "1.2rem" }}
                        >
                            •
                        </motion.span>
                        <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                            style={{ fontSize: "1.2rem" }}
                        >
                            •
                        </motion.span>
                    </div>
                ) : (
                    displayText
                )}
            </motion.div>
        </motion.div>
    );
}
