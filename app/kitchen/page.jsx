"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Play, CalendarPlus, Moon, Sun, Sparkles, PanelRightOpen, PanelRightClose } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useKitchenTheme } from '@/context/KitchenThemeContext'
import { useGuestUser } from '@/context/GuestUserContext'
import { sendChatMessage } from '@/utils/api'
import ChatMessage from '@/components/AIChef/ChatMessage'
import OverviewPanel from '@/components/AIChef/OverviewPanel'
import ChatInput from '@/components/AIChef/ChatInput'

const KitchenPage = () => {
    const { userId } = useGuestUser()
    const router = useRouter()
    const { theme, setTheme, mounted } = useKitchenTheme()
    const [showOverview, setShowOverview] = useState(false)
    const [messages, setMessages] = useState([{
        role: 'ai',
        content: "Hey! Tell me what's in your fridge, ask for recipes, or plan your meals — I'll handle the rest. ✨"
    }])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [suggestedRecipes, setSuggestedRecipes] = useState([])
    const chatRef = useRef(null)

    useEffect(() => {
        chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages, isTyping])

    const quickPrompts = [
        '🥕 Seasonal vegetables',
        '⏱ 20 min timer',
        '💪 High protein meal',
        '🌱 Vegan dinner'
    ]

    const parseSuggestions = (text, cards) => {
        if (cards?.length > 0) {
            return cards.map(r => ({
                id: r.id || Date.now().toString() + Math.random(),
                name: r.name,
                emoji: r.emoji || '🍽️',
                time: typeof r.time === 'number' ? r.time + ' min' : (r.time || '30 min'),
                calories: r.calories || 0,
                difficulty: r.difficulty || 'Medium',
                category: r.category || 'dinner',
                ingredients: r.ingredients || [],
                instructions: r.instructions || [],
            }))
        }
        const patterns = text.match(/\d+\.\s*\*?\*?([^*\n]+)\*?\*?/g)
        if (patterns?.length >= 2) {
            const emojis = ['🍳', '🥘', '🍲', '🥗', '🍛', '🍜']
            return patterns.slice(0, 6).map((m, i) => ({
                id: Date.now().toString() + i,
                name: m.replace(/^\d+\.\s*\*?\*?/, '').replace(/\*?\*?\s*[-–:].*/, '').trim(),
                emoji: emojis[i % emojis.length],
                time: '30 min', calories: 350, difficulty: 'Medium',
                category: 'dinner', ingredients: [], instructions: [],
            }))
        }
        return []
    }

    const handleSend = async (message) => {
        if (!message.trim()) return
        setMessages(prev => [...prev, { role: 'user', content: message }])
        setInput('')
        setIsTyping(true)

        try {
            const res = await sendChatMessage(message, messages)
            setIsTyping(false)
            setMessages(prev => [...prev, {
                role: 'ai',
                content: res.message || "I'm here to help! What would you like to know?",
                recipeCards: res.recipeCards || []
            }])
            const suggestions = parseSuggestions(res.message || '', res.recipeCards || [])
            if (suggestions.length > 0) setSuggestedRecipes(suggestions)
        } catch (err) {
            setIsTyping(false)
            setMessages(prev => [...prev, {
                role: 'ai',
                content: "Couldn't connect right now. Try asking about recipes or cooking tips! 🍳"
            }])
        }
    }

    const cookSuggested = (recipe) => {
        const data = { id: Date.now().toString(), ...recipe }
        const saved = JSON.parse(localStorage.getItem('flavourai_recipes') || '[]')
        if (!saved.some(r => r.name === data.name)) {
            localStorage.setItem('flavourai_recipes', JSON.stringify([data, ...saved]))
        }
        localStorage.setItem('flavourai_cooking_recipe', JSON.stringify(data))
        router.push('/kitchen/cook')
    }

    const planSuggested = (recipe) => {
        localStorage.setItem('flavourai_add_to_meal', JSON.stringify({
            name: recipe.name, emoji: recipe.emoji,
            calories: recipe.calories, time: recipe.time,
            category: recipe.category || 'dinner',
        }))
        router.push('/kitchen/meal-plan')
    }

    return (
        <div className="flex h-screen overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-[#0c1117] dark:via-[#0f1419] dark:to-[#0c1a14]" />
            <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-emerald-300/15 dark:bg-emerald-500/[0.04] rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[15%] w-[400px] h-[400px] bg-sky-200/15 dark:bg-blue-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-[40%] right-[5%] w-[300px] h-[300px] bg-violet-200/10 dark:bg-violet-500/[0.02] rounded-full blur-[80px] pointer-events-none" />

            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                <header className="px-5 md:px-6 py-3 flex items-center justify-between flex-shrink-0 border-b border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="leading-none">
                            <span className="text-[15px] font-semibold text-gray-800 dark:text-gray-100">Flavour</span>
                            <span className="text-[15px] font-semibold text-emerald-500">.</span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] text-gray-400 dark:text-gray-600">Gemini Pro</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-400" />}
                            </button>
                        )}
                        <button
                            onClick={() => setShowOverview(!showOverview)}
                            className="xl:hidden p-2 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                        >
                            {showOverview
                                ? <PanelRightClose className="w-4 h-4 text-gray-400" />
                                : <PanelRightOpen className="w-4 h-4 text-gray-400" />}
                        </button>
                    </div>
                </header>

                <div ref={chatRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6 no-scrollbar">
                    <div className="max-w-2xl mx-auto flex flex-col gap-5">
                        <AnimatePresence initial={false}>
                            {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
                        </AnimatePresence>

                        {isTyping && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Sparkles className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div className="bg-white/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1.5">
                                    {[0, 0.15, 0.3].map((d, i) => (
                                        <motion.span key={i} className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                                            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: d }} />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="max-w-2xl mx-auto w-full pb-3 px-4 md:px-6">
                    <ChatInput
                        input={input}
                        setInput={setInput}
                        onSend={handleSend}
                        quickPrompts={quickPrompts}
                        onQuickPrompt={handleSend}
                    />
                </div>

                <AnimatePresence>
                    {suggestedRecipes.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                            className="max-w-2xl mx-auto w-full px-4 md:px-6 pb-3"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider">Suggestions</span>
                                <button onClick={() => setSuggestedRecipes([])}
                                    className="text-[10px] text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                                    Dismiss
                                </button>
                            </div>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                {suggestedRecipes.map((r, i) => (
                                    <div key={i} className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl p-2.5 min-w-[160px] flex-shrink-0 hover:border-emerald-400/30 transition-all group">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">{r.emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{r.name}</div>
                                                <div className="text-[10px] text-gray-400 dark:text-gray-600">{r.time} · {r.calories} kcal</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button onClick={() => cookSuggested(r)} className="flex-1 flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-medium py-1.5 rounded-lg transition-colors">
                                                <Play className="w-2.5 h-2.5" /> Cook
                                            </button>
                                            <button onClick={() => planSuggested(r)} className="flex-1 flex items-center justify-center gap-1 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-gray-600 dark:text-gray-400 text-[10px] font-medium py-1.5 rounded-lg transition-colors">
                                                <CalendarPlus className="w-2.5 h-2.5" /> Plan
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="hidden xl:block">
                <OverviewPanel />
            </div>

            <AnimatePresence>
                {showOverview && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowOverview(false)}
                            className="xl:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            className="xl:hidden fixed top-0 right-0 h-full z-50 shadow-2xl">
                            <OverviewPanel mobile onClose={() => setShowOverview(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

export default KitchenPage
