import React, { useState } from 'react'
import { Send, UserCircle2 } from 'lucide-react'
import Header from "@/components/Header/Header"
import Container from "@/components/ui/Container"
import Link from 'next/link'

const Home = () => {
  const [messages, setMessages] = useState([
    { role: 'system', content: "Hi! I'm your Flavour AI assistant. Ask me about meals, recipes, or diet plans!" },
  ])
  const [input, setInput] = useState('')

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setMessages((prev) => [...prev, { role: 'user', content: input }])
    setInput('')
  }



  return (
    <div>
    <div className="min-h-screen bg-gradient-to-b from-white to-[#e9f9ee] text-gray-800 flex flex-col">
      
      <Header/>
      
      
      <main className="flex flex-col items-center justify-center flex-grow py-10 text-center">
        <Container>
          <div className="max-w-2xl mx-auto mb-6">
            <h2 className="text-3xl  text-[#1b5e20] mb-2">Flavour<span className='font-bold'>.ai</span></h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Chat with Flavour AI to discover healthy recipes, personalized meal plans, and creative ideas for your next dish.
              Get inspired one bite at a time.
            </p>
          </div>

          <div className="w-full max-w-2xl mx-auto bg-white rounded-4xl shadow-xl  p-4 sm:p-6 flex flex-col h-[30vh]">
          <div className="flex-grow overflow-y-auto space-y-4 mb-4 px-1">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-4xl max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-[#d2f8d2] ml-auto text-right text-[#1b5e20]'
                    : 'bg-[#f1fdf4] mr-auto text-[#2e7d32]'
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>

          
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input type="text" placeholder="Ask about meals, diets, or recipes..." value={input} onChange={(e) => setInput(e.target.value)} 
            className="flex-grow p-2 sm:p-3 rounded-4xl border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5f20]"
            />
            <button
              type="submit"
              className="bg-[#1b5e20] hover:bg-green-700 text-white p-2 rounded-4xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
        </Container>
      </main>

      
      <footer className="py-3 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Flavour AI. Eat smart, live better.
      </footer>
    </div>
    </div>
  )
}

export default Home