"use client";
import React, { useState, useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

interface Message {
  sender: "user" | "ai";
  text: string;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: `Hi there 👋 — I’m Samantha, the AI Receptionist for <a href="https://greatowlmarketing.com" target="_blank" rel="noopener noreferrer" class="link">Great Owl Marketing!</a> How can I assist you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newUserMessage: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      const aiMessage: Message = {
        sender: "ai",
        text: data.reply || "Sorry, I did not understand that.",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error communicating with backend:", error);
      const fallback: Message = {
        sender: "ai",
        text: "⚠️ Sorry, there was a connection issue. Please try again shortly.",
      };
      setMessages((prev) => [...prev, fallback]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-xl w-full max-w-md">
        <div className="text-center mb-3">
          <h1 className="text-2xl font-semibold flex items-center justify-center gap-2">
            🤖 Great Owl Marketing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Samantha — GOM AI Receptionist</p>
        </div>

        <div className="bg-black text-white p-4 rounded-2xl h-96 overflow-y-auto flex flex-col space-y-3 shadow-inner">
          {messages.map((msg, index) => (
            <MessageBubble key={index} sender={msg.sender} text={msg.text} />
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 p-2 rounded-lg bg-neutral-900 text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button
            onClick={sendMessage}
            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg shadow-md active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
