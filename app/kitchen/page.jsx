"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
    Leaf, MessageSquare, BookOpen, Calendar, ChefHat, Timer, Flame, Play,
    Settings, Sparkles, Clock, PenTool, Zap, Camera, Mic, ArrowUp,
    TrendingUp, UtensilsCrossed, ShoppingCart, ArrowRight, X, ChevronRight,
    Check, RefreshCw, LogOut, CalendarPlus,PanelRightOpen, PanelRightClose, Bookmark, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { useGuestUser } from '@/context/GuestUserContext'
import { useSession, signOut } from 'next-auth/react'
import { sendChatMessage, getFoodLog, logFood, getMealPlan, getSessions } from '@/utils/api'
import Image from 'next/image'
import { usePremiumLayout } from '@/context/PremiumLayoutContext'
import ChatMessage from '@/components/AIChef/ChatMessage'

// ─────────────────────────────────────────────
// MARKDOWN FORMATTER (matches ChatMessage.jsx)
// ─────────────────────────────────────────────
const formatContent = (text) => {
    if (!text) return null
    return text.split('\n').map((line, i) => {
        const formatted = line
            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-100">$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code class="bg-white/[0.06] px-1.5 py-0.5 rounded text-[13px] font-mono text-emerald-300">$1</code>')

        if (line.startsWith('- ') || line.startsWith('• ')) {
            return <li key={i} className="ml-4 list-disc text-sm text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s/, '') }} />
        }
        if (/^\d+\.\s/.test(line)) {
            return <li key={i} className="ml-4 list-decimal text-sm text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s/, '') }} />
        }
        if (line.trim() === '') return <br key={i} />
        return <p key={i} className="text-sm text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted }} />
    })
}


const KitchenPage = () => {
    const { userId, guestId, isGuest, logout } = useGuestUser()
    const { data: session } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const { mobileLeftOpen, setMobileLeftOpen, mobileRightOpen, setMobileRightOpen } = usePremiumLayout()

    // ── CHAT STATE ──
    const [showOverview, setShowOverview] = useState(false)
    const [messages, setMessages] = useState([{
        role: 'ai',
        content: "Good evening! I noticed you had a light lunch today. How about something hearty but balanced for dinner? Based on your cooking habits, here are personalized recommendations curated just for you.",
        hasRecipes: true
    }])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)

    // ── USER STATE ──
    const [username, setUsername] = useState('Chef User')

    // ── RESIZE LOGIC ──
    const [rightSidebarWidth, setRightSidebarWidth] = useState(320)
    const isRightResizing = useRef(false)

    const startRightResizing = useCallback((e) => {
        e.preventDefault()
        isRightResizing.current = true
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
    }, [])

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isRightResizing.current) return
            let newWidth = window.innerWidth - e.clientX
            if (newWidth < 250) newWidth = 250
            if (newWidth > 500) newWidth = 500
            setRightSidebarWidth(newWidth)
        };
        const handleMouseUp = () => {
            if (isRightResizing.current) {
                isRightResizing.current = false;
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // ── MODALS & DRAWERS ──
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [showGroceries, setShowGroceries] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [scanModal, setScanModal] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [micActive, setMicActive] = useState(false)
    const [toast, setToast] = useState(null)

    // ── REAL SERVER DATA ──
    const [todayCalories, setTodayCalories] = useState(0)
    const [plannedCount, setPlannedCount] = useState(0)
    const [activeCookingRecipe, setActiveCookingRecipe] = useState(null)
    const [loadingStats, setLoadingStats] = useState(true)

    // ── TIMER ──
    const [timerMinutes, setTimerMinutes] = useState('')
    const [timerSeconds, setTimerSeconds] = useState(0)
    const [timerActive, setTimerActive] = useState(false)
    const [timerTotal, setTimerTotal] = useState(0)
    const timerIntervalRef = useRef(null)

    // ── CALORIE QUICK LOG ──
    const [quickCalorieFood, setQuickCalorieFood] = useState('')
    const [quickCalorieAmount, setQuickCalorieAmount] = useState('')
    const [showCalorieWidget, setShowCalorieWidget] = useState(false)
    const [loggingCalorie, setLoggingCalorie] = useState(false)

    // ── GROCERY LIST ──
    const [groceryItems, setGroceryItems] = useState([
        { id: 1, name: 'Asparagus spears', qty: '1 bunch', checked: false },
        { id: 2, name: 'Fresh strawberries', qty: '250g', checked: false },
        { id: 3, name: 'Green sweet peas', qty: '150g', checked: false },
        { id: 4, name: 'Salmon fillet', qty: '2 pieces', checked: true },
        { id: 5, name: 'Pecorino Romano cheese', qty: '100g', checked: false },
        { id: 6, name: 'Spaghetti pasta', qty: '500g', checked: true },
        { id: 7, name: 'Fresh free-range eggs', qty: '6 pack', checked: false }
    ])

    // ── TIP ROTATION ──
    const [tipIndex, setTipIndex] = useState(0)
    const tipsList = [
        "You've been eating well! Try adding more omega-3 rich foods this week. How about salmon tonight?",
        "Drink a glass of water 30 minutes before mealtime to aid digestion and help manage portion control.",
        "Prep your vegetables and herbs right after buying to save cooking time and prevent fresh produce waste.",
        "To easily peel ginger, scrape it with the edge of a spoon rather than using a metal peeler.",
        "Squeeze fresh lemon juice over cooked greens to brighten colors and enhance savory flavors."
    ]

    const chatFeedEndRef = useRef(null)

    // ─────────────────────────────────────────────
    // INITIALIZATION — FETCH REAL DATA FROM SERVER
    // ─────────────────────────────────────────────
    useEffect(() => {
        chatFeedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    // Resolve username from session or localStorage
    useEffect(() => {
        if (session?.user?.name) {
            setUsername(session.user.name)
        } else {
            const stored = localStorage.getItem('flavourai_username') || localStorage.getItem('username')
            if (stored) setUsername(stored)
        }
    }, [session])

    // Fetch real stats from server once we have identity
    useEffect(() => {
        if (!userId && !guestId) return

        const loadServerData = async () => {
            setLoadingStats(true)

            // 1) Fetch today's calorie log from server
            try {
                const todayStr = new Date().toISOString().split('T')[0]
                const calRes = await getFoodLog(userId, guestId, todayStr)
                if (calRes?.foods) {
                    const total = calRes.foods.reduce((s, f) => s + (f.calories || 0), 0)
                    setTodayCalories(total)
                }
            } catch {
                // Fallback: read from localStorage
                try {
                    const logs = JSON.parse(localStorage.getItem('flavourai_calorie_logs') || '[]')
                    const today = new Date().toDateString()
                    const todayLogs = logs.filter(l => new Date(l.date).toDateString() === today)
                    setTodayCalories(todayLogs.reduce((s, l) => s + (l.calories || 0), 0))
                } catch { }
            }

            // 2) Fetch meal plan count from server
            try {
                const mpRes = await getMealPlan(userId, guestId)
                if (mpRes?.meals) {
                    setPlannedCount(mpRes.meals.length)
                }
            } catch {
                // Fallback: read from localStorage
                try {
                    const stored = JSON.parse(localStorage.getItem('flavourai_meal_plan') || '{}')
                    const days = Object.values(stored)
                    setPlannedCount(days.reduce((s, d) => s + (Array.isArray(d) ? d.length : 0), 0))
                } catch { }
            }

            // 3) Fetch active cooking session from server
            try {
                const sessRes = await getSessions(userId, guestId)
                if (Array.isArray(sessRes) && sessRes.length > 0) {
                    const latest = sessRes[0]
                    const completedSteps = latest.steps?.filter(s => s.completed).length || 0
                    const totalSteps = latest.steps?.length || 6
                    setActiveCookingRecipe({
                        name: latest.recipeId?.recipeName || latest.recipeId?.name || 'Active Recipe',
                        step: completedSteps,
                        totalSteps,
                        stepName: latest.steps?.[completedSteps]?.description?.slice(0, 30) || 'Preparing'
                    })
                } else {
                    // Fallback: localStorage
                    const stored = localStorage.getItem('flavourai_cooking_recipe')
                    if (stored) {
                        const parsed = JSON.parse(stored)
                        setActiveCookingRecipe({
                            name: parsed.name,
                            step: parsed.step || 3,
                            totalSteps: parsed.totalSteps || 6,
                            stepName: parsed.stepName || 'Preparing'
                        })
                    }
                }
            } catch {
                try {
                    const stored = localStorage.getItem('flavourai_cooking_recipe')
                    if (stored) {
                        const parsed = JSON.parse(stored)
                        setActiveCookingRecipe({
                            name: parsed.name, step: parsed.step || 3,
                            totalSteps: parsed.totalSteps || 6, stepName: parsed.stepName || 'Preparing'
                        })
                    }
                } catch { }
            }

            setLoadingStats(false)
        }

        loadServerData()
    }, [userId, guestId])

    // Timer countdown
    useEffect(() => {
        if (timerActive && timerSeconds > 0) {
            timerIntervalRef.current = setInterval(() => {
                setTimerSeconds(prev => {
                    if (prev <= 1) {
                        setTimerActive(false)
                        clearInterval(timerIntervalRef.current)
                        triggerAlarm()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => clearInterval(timerIntervalRef.current)
    }, [timerActive])

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────
    const triggerToast = (message) => {
        setToast(message)
        setTimeout(() => setToast(null), 3000)
    }

    const triggerAlarm = () => {
        triggerToast("⏱️ Timer finished!")
        setMessages(prev => [...prev, {
            role: 'ai',
            content: "⏱️ Your countdown timer has completed! I hope your cooking is going perfectly."
        }])
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain); gain.connect(ctx.destination)
            osc.frequency.setValueAtTime(880, ctx.currentTime)
            gain.gain.setValueAtTime(0.5, ctx.currentTime)
            osc.start(); osc.stop(ctx.currentTime + 0.5)
        } catch { }
    }

    const getGreeting = () => {
        const h = new Date().getHours()
        if (h < 12) return 'Good morning'
        if (h < 17) return 'Good afternoon'
        return 'Good evening'
    }

    // ─────────────────────────────────────────────
    // TIMER ACTIONS
    // ─────────────────────────────────────────────
    const startTimer = (minutesInput) => {
        const mins = parseInt(minutesInput)
        if (isNaN(mins) || mins <= 0) { triggerToast("Enter valid minutes"); return }
        setTimerSeconds(mins * 60)
        setTimerTotal(mins * 60)
        setTimerActive(true)
        setTimerMinutes('')
        triggerToast(`Timer set for ${mins} minute(s)`)
    }

    // ─────────────────────────────────────────────
    // CALORIE LOGGING — REAL SERVER API
    // ─────────────────────────────────────────────
    const addCalorieLog = async (foodName, caloriesStr) => {
        const cals = parseInt(caloriesStr)
        if (!foodName.trim() || isNaN(cals) || cals <= 0) {
            triggerToast("Enter valid food details & calories")
            return
        }

        setLoggingCalorie(true)
        try {
            // Call real server API
            await logFood(userId, guestId, new Date().toISOString(), {
                name: foodName,
                calories: cals,
                mealType: 'snack'
            })
            setTodayCalories(prev => prev + cals)
            triggerToast(`Logged ${foodName} (${cals} kcal)`)
        } catch {
            // Fallback: save to localStorage
            try {
                const logs = JSON.parse(localStorage.getItem('flavourai_calorie_logs') || '[]')
                logs.push({ id: Date.now().toString(), date: new Date().toISOString(), food: foodName, calories: cals })
                localStorage.setItem('flavourai_calorie_logs', JSON.stringify(logs))
            } catch { }
            setTodayCalories(prev => prev + cals)
            triggerToast(`Logged ${foodName} (${cals} kcal) locally`)
        }

        setQuickCalorieFood('')
        setQuickCalorieAmount('')
        setShowCalorieWidget(false)
        setLoggingCalorie(false)
    }

    // ─────────────────────────────────────────────
    // CHAT — REAL SERVER AI
    // ─────────────────────────────────────────────
    const handleSend = async (textToSend) => {
        const message = textToSend || input
        if (!message.trim()) return

        setMessages(prev => [...prev, { role: 'user', content: message }])
        setInput('')
        setIsTyping(true)

        try {
            const chatHistory = messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content }))
            const response = await sendChatMessage(message, chatHistory)

            setIsTyping(false)
            setMessages(prev => [...prev, {
                role: 'ai',
                content: response.message || "I've processed your query. Let me know what else you need!",
                recipeCards: response.recipeCards || []
            }])
        } catch (error) {
            console.error("Frontend Chat Error:", error);
            setIsTyping(false);
            setMessages(prev => [...prev, { role: 'ai', content: "I am having trouble communicating with the server. Please try again." }]);
            triggerToast("⚠️ Connection issue. Try again.");
        }
    }

    const selectPill = (text) => handleSend(text)

    // ─────────────────────────────────────────────
    // CAMERA & MIC SIMULATION
    // ─────────────────────────────────────────────
    const triggerCameraScan = (preset) => {
        setIsScanning(true)
        setTimeout(() => {
            setIsScanning(false)
            setScanModal(false)
            const msg = preset === 'salad'
                ? "📸 I've scanned your **Avocado Grain Bowl**. It contains approx. **420 calories**, 12g protein, rich in healthy fats and fiber. Want me to log these calories?"
                : "📸 I've scanned your **Baked Garlic Salmon**. It contains approx. **450 calories**, 38g protein. Great post-workout meal! Want me to add this to your calorie log?"
            setMessages(prev => [...prev, { role: 'ai', content: msg }])
            triggerToast("Image scan completed!")
        }, 2200)
    }

    const triggerMicRecording = () => {
        setMicActive(true)
        triggerToast("Listening...")
        setTimeout(() => {
            setMicActive(false)
            setInput("Give me a quick 15-minute high protein meal")
            triggerToast("Voice captured!")
        }, 2500)
    }

    // ─────────────────────────────────────────────
    // RECIPE ACTIONS — localStorage + Navigation
    // ─────────────────────────────────────────────
    const defaultRecipes = [
        {
            name: 'Pasta Carbonara', desc: 'Comfort classic', emoji: '🍝',
            image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=300&q=80',
            time: '25m', calories: '520c', protein: '28g', tag: 'Trending', tagType: 'warning',
            ingredients: ['200g Spaghetti', '100g Pancetta', '3 Egg yolks', '50g Pecorino Romano', 'Black pepper', 'Sea salt'],
            steps: ['Boil spaghetti in salted water until al dente.', 'Sauté pancetta until crispy.', 'Whisk egg yolks with grated Pecorino.', 'Drain pasta, reserve ½ cup pasta water.', 'Toss pasta with pancetta off heat.', 'Pour egg mixture, toss rapidly, adding pasta water to emulsify.']
        },
        {
            name: 'Miso Ramen', desc: 'Warming & nourishing', emoji: '🍜',
            image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=80',
            time: '35m', calories: '380c', protein: '22g', tag: 'Pick', tagType: 'brand',
            ingredients: ['2 packs Ramen noodles', '4 cups Vegetable broth', '3 tbsp Miso paste', '2 Soft-boiled eggs', '1 cup Mushrooms', 'Scallions', 'Sesame oil'],
            steps: ['Simmer vegetable broth.', 'Whisk miso paste into a cup of broth, then stir back.', 'Cook noodles separately, drain.', 'Arrange noodles in bowls, ladle broth.', 'Top with eggs, mushrooms, scallions, sesame oil.']
        },
        {
            name: 'Baked Garlic Salmon', desc: 'High protein dinner', emoji: '🐟',
            image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80',
            time: '20m', calories: '450c', protein: '38g', tag: 'Protein', tagType: 'danger',
            ingredients: ['200g Salmon fillet', '1 tbsp Olive oil', '2 Garlic cloves, minced', '1 Lemon, sliced', 'Fresh dill', 'Salt & pepper'],
            steps: ['Preheat oven to 400°F (200°C).', 'Place salmon skin-side down on a baking sheet.', 'Rub with olive oil, minced garlic, salt, and pepper.', 'Top with lemon slices and fresh dill.', 'Bake for 12-15 minutes until it flakes easily.', 'Serve immediately.']
        },
        {
            name: 'Grain Bowl', desc: 'Balanced & fresh', emoji: '🥗',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80',
            time: '15m', calories: '420c', protein: '18g', tag: 'Healthy', tagType: 'brand',
            ingredients: ['1 cup Quinoa', '½ cup Roasted chickpeas', '½ Avocado', 'Cherry tomatoes', 'Cucumber', '2 tbsp Tahini', 'Lemon juice'],
            steps: ['Spoon quinoa as base.', 'Arrange chickpeas, avocado, cucumber, tomatoes.', 'Whisk tahini with lemon juice and water.', 'Drizzle over bowl and serve.']
        }
    ]

    const cookRecipe = (recipe) => {
        const data = {
            id: Date.now().toString(), name: recipe.name, emoji: recipe.emoji || '🍽️',
            time: recipe.time, calories: parseInt(recipe.calories) || 400, protein: recipe.protein || '20g',
            ingredients: recipe.ingredients || [], instructions: recipe.steps || []
        }
        try {
            const saved = JSON.parse(localStorage.getItem('flavourai_recipes') || '[]')
            if (!saved.some(r => r.name === data.name)) {
                localStorage.setItem('flavourai_recipes', JSON.stringify([data, ...saved]))
            }
            localStorage.setItem('flavourai_cooking_recipe', JSON.stringify(data))
        } catch { }
        setSelectedRecipe(null)
        triggerToast(`Loaded: ${recipe.name}`)
        router.push('/kitchen/cook')
    }

    const planRecipe = (recipe) => {
        try {
            localStorage.setItem('flavourai_add_to_meal', JSON.stringify({
                name: recipe.name, emoji: recipe.emoji || '🍽️',
                calories: parseInt(recipe.calories) || 400, time: recipe.time, category: 'dinner'
            }))
        } catch { }
        setSelectedRecipe(null)
        triggerToast(`Added ${recipe.name} to meal plan`)
        router.push('/kitchen/meal-plan')
    }

    // Cook/Plan from AI recipe card
    const handleCookCard = (recipe) => {
        const data = { id: Date.now().toString(), ...recipe }
        const saved = JSON.parse(localStorage.getItem('flavourai_recipes') || '[]')
        if (!saved.some(r => r.name === data.name)) {
            localStorage.setItem('flavourai_recipes', JSON.stringify([data, ...saved]))
        }
        localStorage.setItem('flavourai_cooking_recipe', JSON.stringify(data))
        router.push('/kitchen/cook')
    }

    const handlePlanCard = (recipe) => {
        localStorage.setItem('flavourai_add_to_meal', JSON.stringify({
            name: recipe.name, emoji: recipe.emoji, calories: recipe.calories,
            time: recipe.time, category: recipe.category || 'dinner',
        }))
        router.push('/kitchen/meal-plan')
    }

    const handleSaveCard = (recipe) => {
        const data = { id: Date.now().toString(), ...recipe }
        const saved = JSON.parse(localStorage.getItem('flavourai_recipes') || '[]')
        if (!saved.some(r => r.name === data.name)) {
            localStorage.setItem('flavourai_recipes', JSON.stringify([data, ...saved]))
            triggerToast(`Saved ${recipe.name}`)
        }
    }

    const handleLogout = async () => {
        logout()
        await signOut({ redirect: false })
        router.push('/')
    }

    const avatar = session?.user?.image
    const initial = (username || 'C')[0].toUpperCase()

    // ─────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────
    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --bg-base: #070B09; --bg-panel: #0B120E; --bg-card: #111A14;
                    --bg-hover: #1A271E; --text-main: #F3F4F6; --text-muted: #829A8B;
                    --brand: #10B981; --brand-hover: #34D399;
                    --brand-light: rgba(16, 185, 129, 0.1);
                    --border: #1A271E; --border-light: #24362A;
                }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .section-label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
                .flex-between { display: flex; justify-content: space-between; align-items: center; }
                .tag { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 4px; }
                .tag-brand { background: var(--brand-light); color: var(--brand); }
                .tag-warning { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
                .tag-danger { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
            ` }} />

            {/* Mobile backdrop for right sidebar */}
            {mobileRightOpen && <div onClick={() => setMobileRightOpen(false)} className="xl:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-20" />}

            {/* ═══════════════════════════════════════
                MAIN CONTENT - CHAT
                ═══════════════════════════════════════ */}
            <main className="flex-1 flex flex-col relative h-full min-w-0" style={{ backgroundColor: '#070B09' }}>

                {/* Top Bar */}
                <header className="px-6 md:px-10 py-5 flex items-center justify-between shrink-0 border-b border-[#1A271E] min-h-[72px]">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileLeftOpen(true)} className="md:hidden p-2 rounded-lg bg-[#111A14] border border-[#24362A] text-[#829A8B] hover:text-white transition-all mr-1"><UtensilsCrossed size={16} /></button>
                        <div>
                            <h1 className="text-sm md:text-base font-bold text-[#F3F4F6]">Kitchen Assistant</h1>
                            <p className="text-[10px] md:text-[11px] text-[#829A8B]">Powered by Qwen 2.5 AI</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg hover:bg-[#1A271E] text-[#829A8B] hover:text-white transition-all"><Settings size={20} /></button>
                        <button onClick={() => setMobileRightOpen(true)} className="xl:hidden p-2 rounded-lg bg-[#111A14] border border-[#24362A] text-[#829A8B] hover:text-white transition-all"><TrendingUp size={16} /></button>
                        <button
                            onClick={() => setShowOverview(!showOverview)}
                            className="xl:hidden p-2 rounded-lg hover:bg-[#1A271E] transition-colors text-[#829A8B] hover:text-white"
                        >
                            {showOverview
                                ? <PanelRightClose className="w-5 h-5 text-[#829A8B] hover:text-white pointer-events-none" />
                                : <PanelRightOpen className="w-5 h-5 text-[#829A8B] hover:text-white pointer-events-none" />}
                        </button>
                    </div>
                </header>

                {/* Toast */}
                <AnimatePresence>
                    {toast && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#10B981] text-black font-bold text-xs px-4 py-2.5 rounded-full shadow-lg z-50">
                            {toast}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Chat Feed */}
                <div className="flex-1 overflow-y-auto hide-scrollbar py-8 w-full">
                    <div className="max-w-4xl mx-auto px-6 md:px-10">
                    <div className="w-full">

                        {/* Welcome + Recipe Grid */}
                        <div className="flex gap-4 mb-8">
                            <div className="w-8 h-8 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10B981] flex items-center justify-center flex-shrink-0 mt-0.5"><Sparkles size={16} /></div>
                            <div className="flex-1 flex flex-col gap-4 w-full">
                                <div className="premium-card p-5 rounded-[0_16px_16px_16px] shadow-lg border-l-2 border-l-[#10B981]">
                                    <h2 className="text-base font-bold text-gray-100 mb-1.5 flex items-center gap-2">
                                        Ready for a quick dinner tonight?
                                    </h2>
                                    <p className="text-xs md:text-sm text-gray-300 leading-relaxed">Good evening! I noticed you had a light lunch today. How about something hearty but balanced for dinner? Based on your cooking habits, here are personalized recommendations curated just for you.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {defaultRecipes.map((recipe, i) => (
                                        <div key={i} onClick={() => setSelectedRecipe(recipe)} className="premium-card premium-card-interactive overflow-hidden cursor-pointer group flex flex-col h-full">
                                            <div className="h-[120px] relative overflow-hidden shrink-0">
                                                <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                                                <div className={`absolute top-3 right-3 tag tag-${recipe.tagType}`}>{recipe.tag}</div>
                                            </div>
                                            <div className="p-4 flex flex-col flex-1">
                                                <h3 className="text-xs font-bold text-gray-100 group-hover:text-[#10B981] transition-colors mb-1 truncate">{recipe.name}</h3>
                                                <p className="text-[10px] text-[#829A8B] mb-3 line-clamp-1">{recipe.desc}</p>
                                                <div className="flex gap-3 text-[10px] text-[#829A8B] mt-auto font-semibold">
                                                    <span className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded"><Clock size={11} /> {recipe.time}</span>
                                                    <span className="flex items-center gap-1 text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded"><Flame size={11} /> {recipe.calories}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        {messages.slice(1).map((msg, i) => (
                            <ChatMessage key={i} message={msg} userInitial={initial} />
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex gap-4 mb-6">
                                <div className="w-8 h-8 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10B981] flex items-center justify-center flex-shrink-0"><Sparkles size={16} /></div>
                                <div className="bg-[#111A14] border border-[#1A271E] rounded-[0_16px_16px_16px] px-5 py-4 flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        {[0, 0.15, 0.3].map((d, idx) => (
                                            <span key={idx} className="w-1.5 h-1.5 bg-[#10B981] rounded-full inline-block animate-bounce" style={{ animationDelay: `${d}s` }} />
                                        ))}
                                    </div>
                                    <span className="text-xs text-[#829A8B] animate-pulse">AI is thinking...</span>
                                </div>
                            </div>
                        )}

                        <div ref={chatFeedEndRef} />
                    </div>
                    </div>
                </div>

                {/* Input Area */}
                <div className="w-full px-6 md:px-10 pb-6 shrink-0" style={{ background: 'linear-gradient(to top, #070B09 80%, transparent)' }}>
                    <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
                        {['Healthy Salad', '20 min timer', 'High protein meal', 'Vegan dinner'].map((pill, i) => (
                            <div key={i} onClick={() => !isTyping && selectPill(pill)} className={`bg-[#111A14] border border-[#1A271E] text-[#829A8B] px-4 py-2 rounded-full text-xs whitespace-nowrap hover:border-[#10B981] hover:text-white transition-colors ${isTyping ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                                {['🥕', '⏱', '💪', '🌱'][i]} {pill}
                            </div>
                        ))}
                    </div>
                    <div className="bg-[#111A14] border border-[#24362A] rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg focus-within:border-[#10B981] focus-within:shadow-[0_0_0_2px_rgba(16,185,129,0.1)] transition-all">
                        <button disabled={isTyping} onClick={() => setScanModal(true)} className="p-1.5 rounded-lg text-[#829A8B] hover:text-white hover:bg-[#1A271E] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><Camera size={18} /></button>
                        <input type="text" placeholder={isTyping ? "AI is thinking..." : "Ask me anything about cooking..."} value={input} disabled={isTyping}
                            onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                            className="flex-1 bg-transparent border-none text-sm text-[#F3F4F6] placeholder-[#829A8B] outline-none disabled:opacity-50" />
                        <button disabled={isTyping} onClick={triggerMicRecording} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${micActive ? 'text-red-400 bg-red-500/10 animate-pulse' : 'text-[#829A8B] hover:text-white hover:bg-[#1A271E]'}`}><Mic size={18} /></button>
                        <button disabled={isTyping || !input.trim()} onClick={() => handleSend()} className="p-1.5 rounded-lg bg-[#10B981] text-black hover:bg-[#34D399] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><ArrowUp size={18} /></button>
                    </div>
                    <p className="text-center text-[10px] text-[#829A8B] mt-3">Responses may vary. Check important dietary information.</p>
                </div>
            </main>

            {/* ═══════════════════════════════════════
                RIGHT SIDEBAR
                ═══════════════════════════════════════ */}
            <aside
                className="bg-[#0B120E] border-l border-[#1A271E] flex flex-col py-8 px-6 gap-7 z-30 shrink-0 transition-transform duration-300 xl:translate-x-0 fixed xl:relative h-full right-0 overflow-y-auto elegant-scrollbar"
                style={{ width: `${rightSidebarWidth}px` }}
            >
                {/* Resizer Handle */}
                <div
                    onMouseDown={startRightResizing}
                    className="absolute left-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-[#10B981]/50 z-50 opacity-0 hover:opacity-100 transition-opacity"
                />
                <div className="flex xl:hidden justify-between items-center border-b border-[#1A271E] pb-3 mb-1">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#829A8B]">Overview</span>
                    <button onClick={() => setMobileRightOpen(false)} className="p-1 rounded-lg bg-[#1A271E] text-[#829A8B] hover:text-white transition-colors"><X size={16} /></button>
                </div>

                {/* Overview */}
                <div className="space-y-4">
                    <div>
                        <div className="section-label">Overview</div>
                        <h2 className="text-lg font-bold text-[#F3F4F6]">{getGreeting()}</h2>
                        <p className="text-[11px] text-[#829A8B] mt-0.5">Quick meals work best for you on weekdays.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="premium-card p-4 hover:border-[#10B981]/30 transition-all">
                            <div className="flex items-center gap-1.5 text-[9px] text-[#829A8B] uppercase font-bold mb-2 tracking-wider"><Flame size={12} className="text-[#10B981]" /> Calories</div>
                            <div className="text-xl font-extrabold text-[#F3F4F6]">{loadingStats ? '...' : todayCalories.toLocaleString()}</div>
                            <div className="text-[10px] text-[#829A8B] mt-0.5">today</div>
                        </div>
                        <div className="premium-card p-4 hover:border-[#10B981]/30 transition-all">
                            <div className="flex items-center gap-1.5 text-[9px] text-[#829A8B] uppercase font-bold mb-2 tracking-wider"><Calendar size={12} className="text-[#10B981]" /> Planned</div>
                            <div className="text-xl font-extrabold text-[#F3F4F6]">{loadingStats ? '...' : plannedCount}</div>
                            <div className="text-[10px] text-[#829A8B] mt-0.5">meals</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                    <div className="section-label">Quick Actions</div>
                    <div className="grid grid-cols-3 gap-2.5">
                        <div onClick={() => startTimer(5)} className="premium-card premium-card-interactive flex flex-col items-center justify-center py-3.5 gap-2 cursor-pointer text-[#829A8B] hover:text-white">
                            <Timer size={18} className="text-[#10B981]" />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Timer</span>
                        </div>
                        <div onClick={() => setShowCalorieWidget(!showCalorieWidget)} className={`premium-card flex flex-col items-center justify-center py-3.5 gap-2 cursor-pointer transition-all ${showCalorieWidget ? 'border-[#10B981] text-white bg-[#10B981]/10' : 'premium-card-interactive text-[#829A8B] hover:text-white'}`}>
                            <Flame size={18} className="text-red-400" />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Calories</span>
                        </div>
                        <div onClick={() => router.push('/kitchen/meal-plan')} className="premium-card premium-card-interactive flex flex-col items-center justify-center py-3.5 gap-2 cursor-pointer text-[#829A8B] hover:text-white">
                            <UtensilsCrossed size={18} className="text-[#10B981]" />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Meals</span>
                        </div>
                    </div>

                    {/* Calorie Quick Log Widget */}
                    <AnimatePresence>
                        {showCalorieWidget && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="premium-card p-4 mt-3 space-y-3 overflow-hidden shadow-xl border-[#24362A]">
                                <div className="text-xs font-semibold text-gray-200">Log Quick Meal</div>
                                <input type="text" placeholder="Food e.g. Banana" value={quickCalorieFood} onChange={e => setQuickCalorieFood(e.target.value)}
                                    className="w-full bg-[#070B09] border border-[#1A271E] rounded-lg p-2 text-xs text-gray-200 outline-none focus:border-[#10B981] transition-colors" />
                                <input type="number" placeholder="Calories e.g. 150" value={quickCalorieAmount} onChange={e => setQuickCalorieAmount(e.target.value)}
                                    className="w-full bg-[#070B09] border border-[#1A271E] rounded-lg p-2 text-xs text-gray-200 outline-none focus:border-[#10B981] transition-colors" />
                                <div className="flex gap-2 pt-1">
                                    <button onClick={() => addCalorieLog(quickCalorieFood, quickCalorieAmount)} disabled={loggingCalorie}
                                        className="flex-1 bg-[#10B981] text-black font-bold text-xs py-1.5 rounded-lg hover:bg-[#34D399] transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                                        {loggingCalorie ? <><Loader2 size={12} className="animate-spin" /> Saving...</> : 'Save Log'}
                                    </button>
                                    <button onClick={() => setShowCalorieWidget(false)} className="px-3 bg-[#1A271E] text-[#829A8B] text-xs py-1.5 rounded-lg hover:text-white transition-colors">Cancel</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Active Timer */}
                    {timerSeconds > 0 && (
                        <div className="premium-card p-4 mt-3 flex items-center justify-between shadow-lg border-[#10B981]/30">
                            <div>
                                <div className="text-[9px] text-[#829A8B] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-ping" /> Active Timer
                                </div>
                                <div className="text-lg font-bold tabular-nums mt-1 text-[#F3F4F6]">
                                    {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
                                </div>
                                <div className="w-24 h-1 bg-[#1A271E] rounded-full overflow-hidden mt-2">
                                    <div className="h-full bg-[#10B981] transition-[width] duration-1000 linear" style={{ width: `${timerTotal > 0 ? (timerSeconds / timerTotal) * 100 : 0}%` }} />
                                </div>
                            </div>
                            <div className="flex gap-1.5">
                                <button onClick={() => setTimerActive(!timerActive)} className="p-2 rounded-lg bg-[#1A271E] hover:bg-[#24362A] text-gray-100 transition-colors text-xs">{timerActive ? '⏸️' : '▶️'}</button>
                                <button onClick={() => { setTimerActive(false); setTimerSeconds(0); setTimerTotal(0) }} className="p-2 rounded-lg bg-[#1A271E] hover:bg-[#24362A] text-red-400 transition-colors text-xs">❌</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Trending Tonight */}
                <div className="space-y-3">
                    <div className="section-label flex-between">Trending Tonight <TrendingUp size={14} className="text-[#10B981]" /></div>
                    <div className="flex flex-col gap-2.5">
                        {[
                            { name: 'Sesame Glazed Salmon', time: '25 min', tagClass: 'tag-brand', tagText: 'NEW', query: 'Sesame glazed salmon recipe' },
                            { name: 'Mushroom Risotto', time: '40 min', tagClass: 'tag-warning', tagText: 'POPULAR', query: 'Mushroom risotto recipe' }
                        ].map((item, i) => (
                            <div key={i} onClick={() => handleSend(item.query)} className="premium-card premium-card-interactive p-3 flex items-center gap-3 cursor-pointer">
                                <div className="w-8 h-8 bg-[#1A271E]/60 rounded-lg flex items-center justify-center text-[#829A8B] flex-shrink-0"><UtensilsCrossed size={14} /></div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-bold text-[#F3F4F6] truncate mb-0.5">{item.name}</h4>
                                    <p className="text-[10px] text-[#829A8B]">{item.time}</p>
                                </div>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${item.tagClass}`}>{item.tagText}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seasonal Picks */}
                <div className="space-y-3">
                    <div className="section-label flex-between">Seasonal Picks <Leaf size={14} className="text-[#10B981]" /></div>
                    <div className="flex flex-wrap gap-2">
                        {['Asparagus', 'Strawberries', 'Peas'].map((tag, i) => (
                            <div key={i} onClick={() => handleSend(`Tell me a healthy ${tag.toLowerCase()} recipe`)} className="premium-card premium-card-interactive px-3 py-1.5 rounded-full text-xs text-[#829A8B] cursor-pointer hover:text-white">
                                {tag}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Smart Grocery */}
                <div className="premium-card p-4 hover:border-[#10B981]/30 transition-all space-y-2">
                    <h4 className="text-xs font-bold text-[#F3F4F6] flex items-center gap-2"><ShoppingCart size={15} className="text-[#10B981]" /> Smart Grocery</h4>
                    <p className="text-[11px] text-[#829A8B] leading-relaxed">{groceryItems.filter(g => !g.checked).length} items needed for your planned meals this week.</p>
                    <div onClick={() => setShowGroceries(true)} className="text-xs font-semibold text-[#10B981] cursor-pointer flex items-center gap-1 hover:underline pt-0.5">
                        View list <ArrowRight size={14} />
                    </div>
                </div>

                {/* Tip Widget */}
                <div onClick={() => setTipIndex(prev => (prev + 1) % tipsList.length)}
                    className="premium-card p-4 mt-auto cursor-pointer bg-[#10B981]/5 border-[#10B981]/20 hover:border-[#10B981] hover:bg-[#10B981]/10 transition-all space-y-1.5">
                    <h4 className="text-xs font-bold text-[#10B981] flex items-center gap-2"><Sparkles size={15} /> Smart Tip</h4>
                    <p className="text-[11px] text-gray-200 leading-relaxed font-medium">{tipsList[tipIndex]}</p>
                </div>
            </aside>

            {/* ═══════════════════════════════════════
                MODALS
                ═══════════════════════════════════════ */}

            {/* Recipe Detail Modal */}
            <AnimatePresence>
                {selectedRecipe && (
                    <div onClick={() => setSelectedRecipe(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()} className="bg-[#0B120E] border border-[#24362A] max-w-[550px] w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                            <div className="h-48 relative shrink-0">
                                <img src={selectedRecipe.image} alt={selectedRecipe.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0B120E] via-[#0B120E]/40 to-transparent" />
                                <button onClick={() => setSelectedRecipe(null)} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"><X size={16} /></button>
                                <div className="absolute bottom-4 left-6">
                                    <h2 className="text-xl font-bold">{selectedRecipe.name}</h2>
                                    <p className="text-xs text-[#829A8B]">{selectedRecipe.desc}</p>
                                </div>
                            </div>
                            <div className="p-6 overflow-y-auto hide-scrollbar flex-1 space-y-5">
                                <div className="flex gap-3 text-xs font-semibold">
                                    <span className="bg-[#111A14] border border-[#1A271E] text-orange-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Clock size={13} /> {selectedRecipe.time}</span>
                                    <span className="bg-[#111A14] border border-[#1A271E] text-red-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Flame size={13} /> {selectedRecipe.calories}</span>
                                    {selectedRecipe.protein && <span className="bg-[#111A14] border border-[#1A271E] text-[#10B981] px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Zap size={13} /> {selectedRecipe.protein}</span>}
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#829A8B] mb-2">Ingredients</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {selectedRecipe.ingredients?.map((ing, j) => (
                                            <label key={j} className="flex items-center gap-2 bg-[#111A14] p-2 rounded-lg border border-[#1A271E] cursor-pointer hover:border-[#24362A]">
                                                <input type="checkbox" className="accent-[#10B981] w-3.5 h-3.5" /><span className="truncate text-gray-200">{ing}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#829A8B] mb-2">Steps</h4>
                                    <ol className="space-y-2 text-xs text-gray-300 list-decimal pl-4">
                                        {selectedRecipe.steps?.map((step, j) => (
                                            <li key={j} className="leading-relaxed pl-1 flex flex-col">
                                                <span>{typeof step === 'string' ? step : step.step || step.instruction || step.text}</span>
                                                {(typeof step !== 'string' && step.timeInMinutes) ? (
                                                    <span className="text-xs text-[#10B981] font-medium mt-1">🕒 {step.timeInMinutes} mins</span>
                                                ) : null}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                            <div className="p-4 border-t border-[#1A271E] bg-[#111A14] flex gap-3 shrink-0">
                                <button onClick={() => cookRecipe(selectedRecipe)} className="flex-1 bg-[#10B981] text-black font-bold text-xs py-3 rounded-lg hover:bg-[#34D399] transition-colors flex items-center justify-center gap-1.5"><ChefHat size={14} /> Cook Now</button>
                                <button onClick={() => planRecipe(selectedRecipe)} className="flex-1 bg-[#1A271E] hover:bg-[#24362A] border border-[#24362A] text-gray-100 font-bold text-xs py-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"><Calendar size={14} /> Add to Plan</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Grocery Drawer */}
            <AnimatePresence>
                {showGroceries && (
                    <div onClick={() => setShowGroceries(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                            onClick={e => e.stopPropagation()} className="bg-[#0B120E] border-l border-[#24362A] max-w-[360px] w-full h-full p-6 flex flex-col shadow-2xl">
                            <div className="flex-between border-b border-[#1A271E] pb-4 mb-4">
                                <div className="flex items-center gap-2"><ShoppingCart size={18} className="text-[#10B981]" /><h3 className="font-bold">Smart Grocery List</h3></div>
                                <button onClick={() => setShowGroceries(false)} className="p-1.5 bg-[#1A271E] rounded-lg text-[#829A8B] hover:text-white transition-colors"><X size={16} /></button>
                            </div>
                            <p className="text-xs text-[#829A8B] mb-4">Ingredients for your planned meals this week.</p>
                            <div className="flex-1 space-y-2 overflow-y-auto hide-scrollbar">
                                {groceryItems.map(item => (
                                    <div key={item.id} onClick={() => setGroceryItems(prev => prev.map(p => p.id === item.id ? { ...p, checked: !p.checked } : p))}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${item.checked ? 'bg-[#111A14]/30 border-[#1A271E] opacity-50' : 'bg-[#111A14] border-[#1A271E] hover:border-[#24362A]'}`}>
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${item.checked ? 'bg-[#10B981] border-[#10B981]' : 'border-[#829A8B]'}`}>
                                            {item.checked && <Check size={10} className="text-black stroke-[4]" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-xs font-semibold truncate ${item.checked ? 'line-through text-gray-500' : 'text-gray-200'}`}>{item.name}</div>
                                            <div className="text-[10px] text-[#829A8B]">{item.qty}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => { setGroceryItems(prev => prev.map(p => ({ ...p, checked: false }))); triggerToast("Checklist reset!") }}
                                className="mt-4 w-full bg-[#1A271E] hover:bg-[#24362A] text-gray-100 text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"><RefreshCw size={12} /> Reset Checklist</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <div onClick={() => setShowSettings(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()} className="bg-[#0B120E] border border-[#24362A] max-w-[420px] w-full rounded-xl p-6 shadow-2xl space-y-5">
                            <div className="flex-between border-b border-[#1A271E] pb-3">
                                <h3 className="font-bold flex items-center gap-2"><Settings size={16} className="text-[#10B981]" /> Settings</h3>
                                <button onClick={() => setShowSettings(false)} className="text-[#829A8B] hover:text-white"><X size={16} /></button>
                            </div>
                            <div className="space-y-4 text-xs">
                                <div>
                                    <label className="text-[#829A8B] font-semibold uppercase tracking-wider text-[10px] block mb-1.5">Chef Username</label>
                                    <input type="text" value={username} onChange={e => { setUsername(e.target.value); localStorage.setItem('flavourai_username', e.target.value) }}
                                        className="w-full bg-[#111A14] border border-[#1A271E] rounded-lg p-2.5 text-gray-200 outline-none focus:border-[#10B981]" />
                                </div>
                                <div className="bg-[#111A14] p-3 rounded-lg border border-[#1A271E] flex items-center justify-between">
                                    <div><div className="font-semibold text-gray-200">Deep Forest & Emerald</div><div className="text-[10px] text-[#829A8B] mt-0.5">Premium dark theme</div></div>
                                    <span className="w-2.5 h-2.5 bg-[#10B981] rounded-full shadow shadow-[#10B981]" />
                                </div>
                            </div>
                            <button onClick={() => { setShowSettings(false); triggerToast("Settings saved!") }} className="w-full bg-[#10B981] text-black font-bold text-xs py-2.5 rounded-lg hover:bg-[#34D399] transition-colors">Apply</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Camera Scan Modal */}
            <AnimatePresence>
                {scanModal && (
                    <div onClick={() => { if (!isScanning) setScanModal(false) }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()} className="bg-[#0B120E] border border-[#24362A] max-w-[400px] w-full rounded-2xl p-6 shadow-2xl text-center space-y-5">
                            <div className="flex-between border-b border-[#1A271E] pb-3">
                                <h3 className="font-bold flex items-center gap-2"><Camera size={16} className="text-[#10B981]" /> AI Dish Scanner</h3>
                                {!isScanning && <button onClick={() => setScanModal(false)} className="text-[#829A8B] hover:text-white"><X size={16} /></button>}
                            </div>
                            {isScanning ? (
                                <div className="py-8 space-y-4">
                                    <div className="relative w-24 h-24 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-[#10B981] animate-pulse">
                                        <Camera size={36} className="text-[#10B981]" />
                                        <span className="absolute inset-0 border-2 border-emerald-400 rounded-full animate-ping opacity-30" />
                                    </div>
                                    <div className="text-xs text-gray-200 animate-pulse">Analyzing nutritional profile...</div>
                                </div>
                            ) : (
                                <div className="space-y-3 py-2">
                                    <p className="text-xs text-[#829A8B]">Select a mock snapshot to run food analysis:</p>
                                    {[
                                        { id: 'salad', emoji: '🥗', name: 'Avocado Grain Salad', cal: '~420 kcal' },
                                        { id: 'salmon', emoji: '🐟', name: 'Baked Garlic Salmon', cal: '~450 kcal' }
                                    ].map(item => (
                                        <div key={item.id} onClick={() => triggerCameraScan(item.id)} className="bg-[#111A14] border border-[#1A271E] hover:border-[#10B981] p-3 rounded-xl flex items-center gap-3 cursor-pointer text-left transition-colors">
                                            <span className="text-2xl">{item.emoji}</span>
                                            <div><div className="text-xs font-bold text-gray-200">{item.name}</div><div className="text-[10px] text-[#829A8B]">{item.cal}</div></div>
                                            <ChevronRight size={14} className="ml-auto text-[#829A8B]" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}

export default KitchenPage
