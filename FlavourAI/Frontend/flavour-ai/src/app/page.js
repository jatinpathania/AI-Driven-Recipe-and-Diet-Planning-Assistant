"use client"

import { useState } from "react"
import { Send, UserCircle2 } from "lucide-react"

export default function HomePage() {
  const [messages, setMessages] = useState([
    { role: "system", content: "Hi! I'm your Flavour AI assistant. Ask me about meals, recipes, or diet plans!" },
  ])
  const [input, setInput] = useState("")

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setMessages((prev) => [...prev, { role: "user", content: input }])
    setInput("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#e9f9ee] text-gray-800 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-green-200 bg-white/80 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Flavour AI" className="w-8 h-8 rounded-full border border-green-400" />
          <h1 className="text-lg font-bold text-[#1b5e20]">Flavour AI</h1>
        </div>

        {/* Profile Button */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1b5e20] text-white text-sm hover:bg-green-700 transition-all">
          <UserCircle2 className="w-5 h-5" />
          <span className="hidden sm:inline">Profile</span>
        </button>
      </header>

      {/* Main Section */}
      <main className="flex flex-col items-center justify-center flex-grow px-4 py-10 text-center">
        {/* Intro Text */}
        <div className="max-w-2xl mb-6">
          <h2 className="text-3xl font-semibold text-[#1b5e20] mb-2">Your AI Meal Companion 🍽️</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Chat with Flavour AI to discover healthy recipes, personalized meal plans, and creative ideas for your next dish.  
            Get inspired — one bite at a time.
          </p>
        </div>

        {/* Chat Box */}
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-green-100 p-4 sm:p-6 flex flex-col h-[70vh]">
          <div className="flex-grow overflow-y-auto space-y-4 mb-4 px-1">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-[#d2f8d2] ml-auto text-right text-[#1b5e20]"
                    : "bg-[#f1fdf4] mr-auto text-[#2e7d32]"
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask about meals, diets, or recipes..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow p-2 sm:p-3 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="submit"
              className="bg-[#1b5e20] hover:bg-green-700 text-white p-2 rounded-lg transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Flavour AI. Eat smart, live better.
      </footer>
    </div>
  )
}
