"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";

interface MessageBubbleProps {
  text: string;
  isAI?: boolean;
}

/** Formats message text, converts Markdown to sanitized HTML, and applies link styling */
async function formatMessage(raw: string): Promise<string> {
  let s = raw;

  const linkStyle = 'style="color:#38BDF8;text-decoration:underline;font-weight:600"';

  // Friendly aliases for key links
  s = s.replace(
    /\bGreat Owl Marketing\b/gi,
    `<a href="https://greatowlmarketing.com" target="_blank" rel="noopener noreferrer" ${linkStyle}>Great Owl Marketing</a>`
  );

  s = s.replace(
    /\bMeet Hootbot\b/gi,
    `<a href="https://m.me/593357600524046" target="_blank" rel="noopener noreferrer" ${linkStyle}>Meet Hootbot</a>`
  );

  s = s.replace(
    /\bPay Now\b/gi,
    `<a href="https://buy.stripe.com/fZ6oH2nU2j83PreF00x200" target="_blank" rel="noopener noreferrer" ${linkStyle}>Pay Now</a>`
  );

  const html = await marked.parse(s);
  return DOMPurify.sanitize(html);
}

/** Typing animation effect for AI messages */
function TypeAnimation({ text }: { text: string }) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplay(text.slice(0, i++));
      if (i > text.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [text]);
  return <div dangerouslySetInnerHTML={{ __html: display }} />;
}

export default function MessageBubble({ text, isAI = false }: MessageBubbleProps) {
  const [displayHTML, setDisplayHTML] = useState<string>("");

  useEffect(() => {
    (async () => {
      const formatted = await formatMessage(text);
      setDisplayHTML(formatted);
    })();
  }, [text]);

  /** Separate styles for Samantha (AI) vs User */
  const bubbleStyle: React.CSSProperties = isAI
    ? {
        position: "relative",
        zIndex: 2,
        background: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #14B8A6 100%)",
        color: "#FFFFFF",
        borderRadius: 18,
        padding: "14px 18px",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 4px 20px rgba(59,130,246,0.35), 0 0 15px rgba(6,182,212,0.45)",
        filter: "brightness(1.15) saturate(1.2)",
        backdropFilter: "blur(8px)",
        transition: "all 0.4s ease",
      }
    : {
        background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
        color: "#FFFFFF",
        borderRadius: 18,
        padding: "14px 18px",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.45)",
        transition: "all 0.3s ease",
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isAI ? { scale: 1.015 } : {}}
      transition={{ duration: 0.25 }}
      className={`my-2 flex ${isAI ? "justify-start" : "justify-end"}`}
    >
      <div className="max-w-[80%] text-sm leading-relaxed rounded-2xl" style={bubbleStyle}>
        {isAI ? (
          <TypeAnimation text={displayHTML} />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: displayHTML }} />
        )}
      </div>
    </motion.div>
  );
}
