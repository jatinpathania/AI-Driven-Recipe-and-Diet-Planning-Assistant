import React, { useState, useEffect, useRef } from 'react'
import { Send, UserCircle2, X, ChefHat, Calendar, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from "@/components/Header/Header"
import Container from "@/utils/ui/Container"
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
  const chatContainerRef = useRef(null)
  const dialogChatRef = useRef(null)
  const [selectedVeggies, setSelectedVeggies] = useState([])
  const [generatedRecipes, setGeneratedRecipes] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Rotating words for the subheading
  const rotatingWords = ['companion', 'assistant', 'guide', 'expert', 'chef']

  // All available recipes database
  const recipesDatabase = [
    {
      id: 1,
      name: "Mediterranean Chickpea Salad",
      time: "15 mins",
      servings: 4,
      calories: 285,
      desc: "A fresh, protein-packed salad bursting with Mediterranean flavors. Perfect for lunch or as a side dish.",
      ingredients: [
        "2 cans chickpeas, drained and rinsed",
        "1 cucumber, diced",
        "2 tomatoes, chopped",
        "1/2 red onion, thinly sliced",
        "+6 more"
      ],
      difficulty: "Easy",
      requiredVeggies: ["Tomato", "Onion", "Cucumber"],
      image: "/api/placeholder/400/300"
    },
    {
      id: 2,
      name: "Creamy Mushroom Risotto",
      time: "35 mins",
      servings: 4,
      calories: 420,
      desc: "Rich and creamy Italian rice dish with earthy mushrooms and parmesan cheese.",
      ingredients: [
        "1 1/2 cups arborio rice",
        "4 cups warm vegetable broth",
        "1 lb mixed mushrooms, sliced",
        "1 onion, finely chopped",
        "+6 more"
      ],
      difficulty: "Medium",
      requiredVeggies: ["Mushroom", "Onion", "Garlic"],
      image: "/api/placeholder/400/300"
    },
    {
      id: 3,
      name: "Colorful Vegetable Stir-fry",
      time: "20 mins",
      servings: 3,
      calories: 280,
      desc: "Quick and vibrant Asian-inspired stir-fry with crisp vegetables and ginger.",
      ingredients: [
        "3 cups mixed vegetables",
        "2 tbsp sesame oil",
        "3 cloves garlic, minced",
        "2 tbsp soy sauce",
        "+5 more"
      ],
      difficulty: "Easy",
      requiredVeggies: ["Bell Pepper", "Carrot", "Broccoli", "Ginger"],
      image: "/api/placeholder/400/300"
    },
    {
      id: 4,
      name: "Classic Potato Curry",
      time: "30 mins",
      servings: 4,
      calories: 320,
      desc: "Warming Indian-style curry with tender potatoes in aromatic spices.",
      ingredients: [
        "4 large potatoes, cubed",
        "2 tomatoes, pureed",
        "1 onion, chopped",
        "2 cloves garlic, minced",
        "+7 more"
      ],
      difficulty: "Medium",
      requiredVeggies: ["Potato", "Tomato", "Onion", "Ginger"],
      image: "/api/placeholder/400/300"
    },
    {
      id: 5,
      name: "Spinach & Garlic Pasta",
      time: "18 mins",
      servings: 2,
      calories: 380,
      desc: "Simple yet elegant pasta with sautéed spinach and garlic in olive oil.",
      ingredients: [
        "200g pasta",
        "3 cups fresh spinach",
        "4 cloves garlic, sliced",
        "1/4 cup olive oil",
        "+4 more"
      ],
      difficulty: "Easy",
      requiredVeggies: ["Spinach", "Garlic"],
      image: "/api/placeholder/400/300"
    },
    {
      id: 6,
      name: "Roasted Cauliflower Bowl",
      time: "25 mins",
      servings: 3,
      calories: 295,
      desc: "Healthy bowl with roasted cauliflower, chickpeas, and tahini dressing.",
      ingredients: [
        "1 head cauliflower, florets",
        "1 can chickpeas",
        "2 cloves garlic, minced",
        "1/4 cup tahini",
        "+5 more"
      ],
      difficulty: "Easy",
      requiredVeggies: ["Cauliflower", "Garlic"],
      image: "/api/placeholder/400/300"
    }
  ]

  const toggleVeggie = (veggie) => {
    setSelectedVeggies(prev => 
      prev.includes(veggie) 
        ? prev.filter(v => v !== veggie)
        : [...prev, veggie]
    )
  }

  const generateRecipes = () => {
    if (selectedVeggies.length === 0) return

    setIsGenerating(true)
    
    // Simulate AI processing
    setTimeout(() => {
      const matchedRecipes = recipesDatabase.filter(recipe => 
        recipe.requiredVeggies.some(veggie => selectedVeggies.includes(veggie))
      ).sort((a, b) => {
        // Sort by number of matching ingredients
        const aMatches = a.requiredVeggies.filter(v => selectedVeggies.includes(v)).length
        const bMatches = b.requiredVeggies.filter(v => selectedVeggies.includes(v)).length
        return bMatches - aMatches
      }).slice(0, 4) // Show top 4 matches

      setGeneratedRecipes(matchedRecipes)
      setIsGenerating(false)
    }, 800)
  }

  useEffect(() => {
    if (selectedVeggies.length > 0) {
      generateRecipes()
    } else {
      setGeneratedRecipes([])
    }
  }, [selectedVeggies])

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

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 0)
    }
  }, [messages, expanded])

  useEffect(() => {
    if (dialogChatRef.current) {
      setTimeout(() => {
        dialogChatRef.current?.scrollTo({
          top: dialogChatRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 0)
    }
  }, [messages])

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

  // Smooth message animation variants
  const messageVariants = {
    hidden: {
      opacity: 0,
      x: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        mass: 1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
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
                className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
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
              <motion.button
                onClick={() => document.getElementById('veggie-recipe-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3 bg-gradient-to-r from-[#1b5e20] to-green-600 text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variants={itemVariants}
              >
                🥬 Create Recipe by Vegetables
              </motion.button>
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
                <div ref={chatContainerRef} className={`overflow-y-auto space-y-3 mb-4 px-1 transition-all duration-700 ${expanded ? "h-[45vh]" : "h-[10vh]"}`}>
                  <AnimatePresence mode="popLayout">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
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
            <motion.div className="grid md:grid-cols-3 gap-8 mb-16" variants={itemVariants}>
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

            {/* Recipe by Vegetables Section */}
            <motion.div id="veggie-recipe-section" className="w-full mb-16" variants={itemVariants}>
              <motion.div className="text-center mb-10" variants={itemVariants}>
                <h2 className="text-3xl font-bold text-[#1b5e20] mb-2">Create Recipe by Vegetables</h2>
                <p className="text-gray-600">Select your available vegetables and let AI create perfect recipes for you</p>
              </motion.div>

              {/* Vegetable Selection */}
              <motion.div className="bg-gray-50 rounded-2xl shadow-md p-8 mb-8" variants={itemVariants}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">What vegetables do you have?</h3>
                  {selectedVeggies.length > 0 && (
                    <motion.button
                      onClick={() => setSelectedVeggies([])}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Clear All
                    </motion.button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {['Tomato', 'Onion', 'Garlic', 'Ginger', 'Potato', 'Carrot', 'Bell Pepper', 'Spinach', 'Broccoli', 'Cauliflower', 'Peas', 'Corn', 'Mushroom', 'Eggplant', 'Zucchini', 'Cucumber'].map((veg) => (
                    <motion.button
                      key={veg}
                      onClick={() => toggleVeggie(veg)}
                      className={`px-4 py-2.5 rounded-lg border-2 font-medium transition-all ${
                        selectedVeggies.includes(veg)
                          ? 'border-[#1b5e20] bg-[#1b5e20] text-white shadow-md'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-[#1b5e20] hover:bg-[#f0f9f0] hover:text-[#1b5e20]'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {veg}
                    </motion.button>
                  ))}
                </div>
                {selectedVeggies.length > 0 && (
                  <motion.div 
                    className="mt-6 pt-6 border-t border-gray-300"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-sm text-gray-600 mb-2">Selected vegetables:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedVeggies.map((veg) => (
                        <span key={veg} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                          {veg}
                          <button onClick={() => toggleVeggie(veg)} className="hover:text-green-900">×</button>
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Recipe Results */}
              <AnimatePresence mode="wait">
                {isGenerating && (
                  <motion.div
                    key="generating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b5e20]"></div>
                    <p className="mt-4 text-gray-600">Generating recipes...</p>
                  </motion.div>
                )}

                {!isGenerating && selectedVeggies.length === 0 && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center py-16 bg-white rounded-2xl shadow-md"
                  >
                    <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Select vegetables to get started</h3>
                    <p className="text-gray-500">Choose your available ingredients and we'll suggest perfect recipes</p>
                  </motion.div>
                )}

                {!isGenerating && generatedRecipes.length > 0 && (
                  <motion.div
                    key="recipes"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-[#1b5e20]">
                        {generatedRecipes.length} Recipe{generatedRecipes.length > 1 ? 's' : ''} Found
                      </h3>
                      <p className="text-gray-600 mt-1">Based on your selected vegetables</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {generatedRecipes.map((recipe) => (
                        <motion.div
                          key={recipe.id}
                          className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ y: -5 }}
                        >
                          {/* Recipe Image with real photo */}
                          <div className="h-52 bg-gradient-to-br from-green-400 to-green-600 relative overflow-hidden">
                            <img 
                              src={recipe.image} 
                              alt={recipe.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-5">
                              <div className="w-full">
                                <h3 className="text-white text-2xl font-bold mb-2">{recipe.name}</h3>
                                <div className="flex gap-4 text-white text-sm">
                                  <span className="flex items-center gap-1">⏱️ {recipe.time}</span>
                                  <span className="flex items-center gap-1">👥 {recipe.servings}</span>
                                  <span className="flex items-center gap-1">🔥 {recipe.calories} cal</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Recipe Details */}
                          <div className="p-6">
                            <p className="text-gray-600 text-sm mb-4 leading-relaxed">{recipe.desc}</p>
                            
                            <div className="mb-4">
                              <h4 className="font-semibold text-gray-900 mb-3">Key Ingredients:</h4>
                              <div className="space-y-2">
                                {recipe.ingredients.map((ing, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></span>
                                    <span className="text-sm text-gray-700">{ing}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                recipe.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                recipe.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {recipe.difficulty}
                              </span>
                              <div className="flex gap-2">
                                <motion.button
                                  onClick={generateRecipes}
                                  className="px-4 py-2 bg-gradient-to-r from-[#1b5e20] to-green-600 text-white rounded-full font-semibold text-sm hover:shadow-lg transition-shadow flex items-center gap-1"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  🔄 New Recipe
                                </motion.button>
                                <motion.button
                                  className="px-4 py-2 border-2 border-[#1b5e20] text-[#1b5e20] rounded-full font-semibold text-sm hover:bg-[#f0f9f0] transition-all flex items-center gap-1"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  📤 Share
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </Container>
        </main>

        <Footer/>
      </motion.div>

      {/* ChatGPT-Style Dialog */}
      <AnimatePresence>
        {isDialogOpen && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDialog}
          >
            <motion.div 
              className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col"
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Clean and minimal */}
              <motion.div 
                className="flex items-center justify-between px-6 py-4 border-b border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-base font-semibold text-gray-900">Flavour AI Chat</h3>
                <motion.button
                  onClick={closeDialog}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </motion.div>

              {/* Chat Area - Light background like ChatGPT */}
              <motion.div 
                ref={dialogChatRef}
                className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <AnimatePresence mode="popLayout">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs px-4 py-2.5 rounded-lg text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#1b5e20] text-white rounded-bl-lg'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-br-lg'
                      }`}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Input Area - Sticky bottom like ChatGPT */}
              <motion.div 
                className="px-6 py-4 bg-white border-t border-gray-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <form onSubmit={handleSend} className="flex items-end gap-3">
                  <input 
                    type="text" 
                    placeholder="Send a message..." 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5e20] focus:border-transparent resize-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend(e)
                      }
                    }}
                  />
                  <motion.button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-2.5 bg-[#1b5e20] hover:bg-green-700 disabled:bg-gray-300 text-white rounded-md transition-colors flex-shrink-0"
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