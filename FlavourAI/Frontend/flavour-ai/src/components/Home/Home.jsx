import React, { useState, useEffect } from 'react'
import { Send, UserCircle2, X, ChefHat, Calendar, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from "@/components/Header/Header"
import Container from "@/components/ui/Container"
import Footer from '@/components/Footer/Footer'
import Link from 'next/link'

const Home = () => {
  const [messages, setMessages] = useState([
    { role: 'system', content: "Hi! I'm your Flavour AI assistant. Ask me about meals, recipes, or diet plans!" },
  ])
  const [input, setInput] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)

  // Rotating words for the subheading
  const rotatingWords = ['companion', 'assistant', 'guide', 'expert', 'chef']

  // Word rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isDialogOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isDialogOpen])

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    if (!expanded) setExpanded(true)
    setIsDialogOpen(true)

    setMessages((prev) => [...prev, { role: 'user', content: input }])
    setInput('')

    // Sample answer with delay
    setTimeout(() => {
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: "Thanks for your message! I'm processing your request about recipes and diet plans." 
      }])
    }, 1000)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const dialogVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    }
  }

  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  }

  return (
    <div>
      <motion.div 
        className={`min-h-screen bg-gradient-to-b from-white to-[#e9f9ee] text-gray-800 flex flex-col transition-all duration-500 ${isDialogOpen ? 'blur-sm' : ''}`}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        
        <Header/>
        
        <main className="flex flex-col items-center justify-center flex-grow py-10">
          <Container>
            
            
            <motion.div className="text-center mb-12" variants={itemVariants}>
              <motion.h1 
                className="text-5xl font-bold text-[#1b5e20] mb-4"
                variants={itemVariants}
              >
                Flavour<span className='text-green-600'>.ai</span>
              </motion.h1>
              
              
              <motion.div 
                className="text-xl text-gray-600 max-w-3xl mx-auto"
                variants={itemVariants}
              >
                <span>Your AI-powered culinary </span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentWordIndex}
                    variants={wordVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="inline-block text-[#1b5e20] font-semibold"
                  >
                    {rotatingWords[currentWordIndex]}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* Chat Section */}
            <motion.div className="max-w-2xl mx-auto mb-16" variants={itemVariants}>
              <motion.div className="text-center mb-6" variants={itemVariants}>
                <p className="text-gray-600">
                  Ask me anything about recipes, nutrition, or meal planning
                </p>
              </motion.div>
              
              <motion.div 
                className={`w-full bg-white rounded-2xl shadow-lg p-6 flex flex-col transition-all duration-700 ${expanded ? "h-[60vh]" : "h-[25vh]"}`}
                variants={itemVariants}
                whileHover={{ shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
              >
                <div className={`overflow-y-auto space-y-4 mb-4 px-1 transition-all duration-700 ${expanded ? "h-[45vh]" : "h-[10vh]"}`}>
                  <AnimatePresence>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: msg.role === 'user' ? 50 : -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                        className={`p-3 rounded-xl max-w-[80%] ${
                          msg.role === 'user'
                            ? 'bg-[#e8f5e8] ml-auto text-right text-[#1b5e20] border border-[#c8e6c9]'
                            : 'bg-[#f1fdf4] mr-auto text-[#2e7d32]'
                        }`}
                      >
                        {msg.content}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <input 
                    type="text" 
                    placeholder="Ask about meals, diets, or recipes..." 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    className="flex-1 p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5f20] focus:border-transparent transition-all duration-200"
                  />
                  <motion.button
                    type="submit"
                    className="bg-[#1b5e20] hover:bg-green-700 text-white p-3 rounded-xl transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>

            {/* Features Section */}
            <motion.div className="grid md:grid-cols-3 gap-8 mb-12" variants={itemVariants}>
              {[
                { icon: ChefHat, title: "Smart Recipes", desc: "Get personalized recipe suggestions based on your preferences and dietary needs" },
                { icon: Calendar, title: "Meal Planning", desc: "Plan your weekly meals with AI-optimized nutrition and variety" },
                { icon: Sparkles, title: "Diet Optimization", desc: "Achieve your health goals with personalized dietary recommendations" }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
                  whileHover={{ 
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                  variants={itemVariants}
                >
                  <feature.icon className="w-12 h-12 text-[#1b5e20] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#1b5e20] mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </Container>
        </main>

        <Footer/>
      </motion.div>

      {/* Enhanced Dialog with Smooth Animations */}
      <AnimatePresence>
        {isDialogOpen && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col border border-gray-100/50 backdrop-blur-sm"
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Minimal Header */}
              <motion.div 
                className="flex items-center justify-between p-4 border-b border-gray-100"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-lg font-medium text-[#1b5e20]">Flavour AI</h3>
                <motion.button
                  onClick={closeDialog}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </motion.button>
              </motion.div>

              {/* Chat Area */}
              <motion.div 
                className="flex-1 overflow-y-auto p-4 space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: msg.role === 'user' ? 50 : -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className={`p-3 rounded-xl max-w-[75%] text-sm ${
                        msg.role === 'user'
                          ? 'bg-[#1b5e20] text-white ml-auto shadow-md'
                          : 'bg-gray-50 text-gray-800 mr-auto border border-gray-100'
                      }`}
                    >
                      {msg.content}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Input Area */}
              <motion.div 
                className="p-4 border-t border-gray-100"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Continue chatting..." 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    className="flex-1 p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5f20] focus:border-transparent transition-all duration-200"
                    autoFocus
                  />
                  <motion.button
                    type="submit"
                    className="bg-[#1b5e20] hover:bg-green-700 text-white p-3 rounded-xl transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Home