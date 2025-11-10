"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";

interface MessageBubbleProps {
    sender: "user" | "ai";
    text: string;
}

/**
 * Converts message text (including Markdown syntax) into sanitized, branded HTML.
 * Replaces company references and known link phrases with clickable hyperlinks.
 */
function formatMessage(text: string): string {
    let formatted = text;

    // Replace keywords with branded links
    formatted = formatted.replace(
        /\bGreat Owl Marketing\b/gi,
        `[Great Owl Marketing](https://greatowlmarketing.com)`
    );

    formatted = formatted.replace(
        /\bMeet Hootbot\b/gi,
        `[Meet Hootbot](https://m.me/593357600524046)`
    );

    formatted = formatted.replace(
        /\bPay Now\b/gi,
        `[Pay Now](https://buy.stripe.com/fZu6oH2nU2j83PreF00x200?mcp_token=eyJwaWQiOjU5MzM1NzYwMDUyNDA0Niwic2lkIjo5MTY3Mjg2MTgzMzgxMzQzLCJheCI6IjdhNDgxMzczZDg2NDE0NDNmNzNmZGZmNDI1M2Y3OWU1IiwidHMiOjE3NjI3OTA0OTAsImV4cCI6MTc2NTIwOTY5MH0.DyEU_N-nMfQhh74l37IGpwkf0-Dl8zEn7cUZ2zZ1-D0)`
    );

    formatted = formatted.replace(
        /\bBook a 30[- ]?minute call\b/gi,
        `[Book a 30-minute call](https://calendly.com/phineasjholdings-info/30min)`
    );

    // Convert markdown (e.g., [text](url)) to HTML safely
    const rawHTML = marked.parse(formatted);
    return DOMPurify.sanitize(rawHTML);
}

export default function MessageBubble({ sender, text }: MessageBubbleProps) {
    const isAI = sender === "ai";
    const [displayText, setDisplayText] = useState("");
    const [typing, setTyping] = useState(isAI);
    const [thinking, setThinking] = useState(isAI);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!isAI) {
            setDisplayText(formatMessage(text));
            return;
        }

        // Typing simulation for AI
        setDisplayText("");
        setThinking(true);
        const thinkingTimeout = setTimeout(() => {
            setThinking(false);
            setTyping(true);

            const formatted = formatMessage(text);
            let i = 0;
            const interval = setInterval(() => {
                i++;
                setDisplayText(formatted.slice(0, i));
                if (i >= formatted.length) {
                    clearInterval(interval);
                    setTyping(false);
                }
            }, 20);

            return () => clearInterval(interval);
        }, 800);

        return () => clearTimeout(thinkingTimeout);
    }, [text, isAI]);

    if (!mounted) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{
                display: "flex",
                justifyContent: isAI ? "flex-start" : "flex-end",
                marginBottom: "0.9rem",
            }}
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                    background: isAI
                        ? "linear-gradient(135deg, #0070f3, #00bcd4)"
                        : "linear-gradient(135deg, #333, #111)",
                    color: "#fff",
                    padding: "0.9rem 1.2rem",
                    borderRadius: isAI
                        ? "14px 14px 14px 4px"
                        : "14px 14px 4px 14px",
                    maxWidth: "80%",
                    fontSize: "0.95rem",
                    lineHeight: "1.55",
                    boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                }}
                dangerouslySetInnerHTML={{
                    __html: thinking
                        ? `<div style="display:flex;gap:4px;">
                            <span style="opacity:0.4;">•</span>
                            <span style="opacity:0.6;">•</span>
                            <span style="opacity:0.8;">•</span>
                           </div>`
                        : displayText,
                }}
            />
        </motion.div>
    );
}
