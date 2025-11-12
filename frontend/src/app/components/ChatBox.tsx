"use client";

import React, { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from "react";
import MessageBubble from "./MessageBubble";

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="text-center py-3 border-b border-gray-200">
          <h1 className="text-lg font-semibold flex justify-center items-center gap-2">
            🤖 Great Owl Marketing
          </h1>
          <p className="text-gray-600 text-sm">Samantha — GOM AI Receptionist</p>
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
