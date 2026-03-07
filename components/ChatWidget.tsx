"use client";

import { useState, useRef, useEffect, FormEvent } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What are the temple hours?",
  "When is the next aarti?",
  "What programs are available?",
  "How do I get to the temple?",
  "How can I donate or sponsor a puja?",
];

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Sai Ram! I'm Sai Sevak, your virtual assistant for the Shirdi Sai Temple of Atlanta. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm sorry, I couldn't process that. Please try again or call the temple at 678-455-7200.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting. Please call the temple at 678-455-7200 for assistance.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100 h-[70vh]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
                ॐ
              </div>
            )}
            <div
              className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-orange-600 text-white rounded-tr-sm"
                  : "bg-orange-50 text-gray-800 border border-orange-100 rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
              ॐ
            </div>
            <div className="bg-orange-50 border border-orange-100 px-4 py-3 rounded-2xl rounded-tl-sm">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions (only show when only the greeting is present) */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs bg-orange-50 border border-orange-200 text-orange-700 rounded-full px-3 py-1.5 hover:bg-orange-100 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-orange-100 p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={loading}
            className="flex-1 border border-orange-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 bg-orange-50 placeholder-orange-300"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
