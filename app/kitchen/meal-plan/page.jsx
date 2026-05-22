"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Check, ChevronLeft, ChevronRight, Sparkles, Loader2, Trash2 } from 'lucide-react'
import { useGuestUser } from '@/context/GuestUserContext'
import { sendChatMessage } from '@/utils/api'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const MealPlanPage = () => {
    const { userId, isGuest } = useGuestUser()
    const [weekOffset, setWeekOffset] = useState(0)
    const [mealPlan, setMealPlan] = useState({})
    const [showAddModal, setShowAddModal] = useState(false)
    const [addingFor, setAddingFor] = useState({ day: '', type: '' })
    const [mealInput, setMealInput] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1])

    const getWeekDates = () => {
        const today = new Date()
        const monday = new Date(today)
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + (weekOffset * 7))
        return DAYS.map((day, i) => {
            const date = new Date(monday)
            date.setDate(monday.getDate() + i)
            return {
                day, date: date.getDate(),
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                full: date.toISOString().split('T')[0],
                isToday: date.toDateString() === new Date().toDateString()
            }
        })
    }

    const weekDates = getWeekDates()
    const weekLabel = `${weekDates[0].month} ${weekDates[0].date} - ${weekDates[6].month} ${weekDates[6].date}`

    useEffect(() => {
        const saved = localStorage.getItem('flavourai_mealplan')
        if (saved) setMealPlan(JSON.parse(saved))
    }, [])

    useEffect(() => {
        const pending = localStorage.getItem('flavourai_add_to_meal')
        if (pending) {
            try {
                const meal = JSON.parse(pending)
                localStorage.removeItem('flavourai_add_to_meal')
                const type = meal.category === 'breakfast' ? 'Breakfast' : meal.category === 'lunch' ? 'Lunch' : meal.category === 'snack' ? 'Snack' : 'Dinner'
                addMeal(selectedDay, type, `${meal.emoji || '🍽️'} ${meal.name}`)
            } catch {}
        }
    }, [])

    const savePlan = (updated) => {
        setMealPlan(updated)
        localStorage.setItem('flavourai_mealplan', JSON.stringify(updated))
    }

    const addMeal = (day, type, meal) => {
        const key = `${day}_${type}`
        const updated = { ...mealPlan }
        if (!updated[key]) updated[key] = []
        updated[key].push({ id: Date.now(), name: meal, completed: false })
        savePlan(updated)
    }

    const toggleMealComplete = (key, mealId) => {
        const updated = { ...mealPlan }
        if (updated[key]) {
            updated[key] = updated[key].map(m => m.id === mealId ? { ...m, completed: !m.completed } : m)
            savePlan(updated)
        }
    }

    const deleteMeal = (key, mealId) => {
        const updated = { ...mealPlan }
        if (updated[key]) {
            updated[key] = updated[key].filter(m => m.id !== mealId)
            if (updated[key].length === 0) delete updated[key]
            savePlan(updated)
        }
    }

    const handleAddMeal = () => {
        if (mealInput.trim()) {
            addMeal(addingFor.day, addingFor.type, mealInput.trim())
            setMealInput('')
            setShowAddModal(false)
        }
    }

    const handleAIGenerate = async () => {
        setIsGenerating(true)
        try {
            const response = await sendChatMessage(
                `Generate a simple, healthy meal plan for ${selectedDay}. Return ONLY a JSON object in this format, no other text: { "Breakfast": "Meal name (calories kcal)", "Lunch": "Meal name (calories kcal)", "Dinner": "Meal name (calories kcal)", "Snack": "Meal name (calories kcal)" }`,
                []
            )
            const text = response.message || ''
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const meals = JSON.parse(jsonMatch[0])
                Object.entries(meals).forEach(([type, name]) => {
                    addMeal(selectedDay, type, name)
                })
            }
        } catch (error) {
            console.error('Error generating meal plan:', error)
        }
        setIsGenerating(false)
    }

    const getMealsForDayType = (day, type) => mealPlan[`${day}_${type}`] || []
    const getMealEmoji = (type) => ({ Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snack: '🍿' }[type] || '🍽️')

    // Calculate day completion status dynamically
    const getDayPlanStatus = (day) => {
        return MEAL_TYPES.some(type => (mealPlan[`${day}_${type}`] || []).length > 0)
    }

    const totalPlannedThisWeek = Object.values(mealPlan).flat().length
    const completedPlannedThisWeek = Object.values(mealPlan).flat().filter(m => m.completed).length

    // Dynamic preparation assistant tips based on the selected day
    const getPrepTipForDay = (day) => {
        const tips = {
            Monday: "🌅 Start your week strong! Pre-portion your breakfast grains and wash leafy greens to save time.",
            Tuesday: "🥗 Veggie check! Dice your bell peppers and cucumbers today to easily toss into your salads.",
            Wednesday: "🍗 Mid-week protein: Marinate chicken or tofu tonight to ensure robust flavor for Thursday.",
            Thursday: "🍲 Double batching: Consider cooking double portions tonight to cover your Friday lunches.",
            Friday: "🍿 Snack prep: Toast a batch of healthy nuts or prep mixed fruit boxes for weekend quick bites.",
            Saturday: "🛒 Planning ahead: Sunday is grocery day. Review your custom recipes and update your list tonight.",
            Sunday: "🌙 Sunday Prep Hour: Steam a batch of quinoa or rice. Pack them into glass containers for the week."
        }
        return tips[day] || "Plan, prep, and nourish your body with wholesome, home-cooked food."
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden w-full" style={{ backgroundColor: '#070B09', color: '#F3F4F6' }}>
            <div className="relative z-10 flex flex-col h-full">
                {/* Unified Header */}
                <div className="px-6 md:px-10 py-5 flex items-center justify-between flex-shrink-0 border-b border-[#1A271E] min-h-[72px]">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-lg font-bold text-[#F3F4F6]">Meal Planner</h1>
                            <p className="text-[11px] text-[#829A8B]">Schedule your nutrition & macro targets</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#111A14] border border-[#1A271E] px-2 py-1 rounded-xl">
                        <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 hover:bg-[#1A271E] rounded-lg transition-colors">
                            <ChevronLeft className="w-4 h-4 text-[#829A8B]" />
                        </button>
                        <span className="text-[10px] font-extrabold text-[#F3F4F6] min-w-[120px] text-center uppercase tracking-wider">{weekLabel}</span>
                        <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 hover:bg-[#1A271E] rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4 text-[#829A8B]" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto elegant-scrollbar py-8 w-full">
                    <div className="max-w-4xl mx-auto px-6 md:px-10">
                    <div className="w-full">
                        {/* Day Selector (Centered & Responsive) */}
                        <div className="flex justify-center mb-8">
                            <div className="flex gap-2.5 overflow-x-auto pb-1.5 hide-scrollbar w-full md:w-auto justify-start md:justify-center">
                                {weekDates.map((d) => {
                                    const isSelected = selectedDay === d.day
                                    const isPlanned = getDayPlanStatus(d.day)
                                    return (
                                        <button key={d.day} onClick={() => setSelectedDay(d.day)}
                                            className={`relative flex flex-col items-center min-w-[70px] px-3.5 py-3 rounded-xl transition-all duration-300 ${
                                                isSelected 
                                                    ? 'bg-[#10B981] text-black shadow-lg shadow-emerald-500/20 scale-105 font-bold' 
                                                    : d.isToday 
                                                        ? 'bg-[rgba(16,185,129,0.08)] text-[#10B981] border border-[#10B981]/30 hover:bg-[rgba(16,185,129,0.15)]' 
                                                        : 'bg-[#111A14] border border-[#1A271E] text-[#829A8B] hover:border-[#10B981]/40 hover:bg-[#1A271E]/40'
                                            }`}>
                                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-75">{d.day.slice(0, 3)}</span>
                                            <span className="text-lg font-extrabold mt-0.5">{d.date}</span>
                                            {isPlanned && (
                                                <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-[#10B981]'}`} />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Three Column Grid Container */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {/* Left + Center Columns: Active Meals Grid (lg:col-span-2) */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
                                            <span>📅</span> {selectedDay}&apos;s Nutrition
                                        </h2>
                                        <p className="text-xs text-[#829A8B]">Manage recipes planned for today</p>
                                    </div>
                                    <button onClick={handleAIGenerate} disabled={isGenerating}
                                        className="flex items-center gap-1.5 bg-[#10B981] hover:bg-[#34D399] text-black px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/10">
                                        {isGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Filling...</> : <><Sparkles className="w-3.5 h-3.5" /> AI Fill {selectedDay}</>}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {MEAL_TYPES.map((type) => {
                                        const meals = getMealsForDayType(selectedDay, type)
                                        return (
                                            <motion.div key={type} layout
                                                className="premium-card premium-card-interactive p-5">
                                                <div className="flex items-center justify-between mb-4 border-b border-[#1A271E]/50 pb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-2xl select-none">{getMealEmoji(type)}</span>
                                                        <h3 className="font-extrabold text-[#F3F4F6] text-xs uppercase tracking-widest">{type}</h3>
                                                    </div>
                                                    <button onClick={() => { setAddingFor({ day: selectedDay, type }); setShowAddModal(true) }}
                                                        className="w-7 h-7 rounded-lg bg-[rgba(16,185,129,0.06)] border border-[#1A271E] hover:border-[#10B981]/50 hover:bg-[rgba(16,185,129,0.12)] flex items-center justify-center transition-colors">
                                                        <Plus className="w-4 h-4 text-[#10B981]" />
                                                    </button>
                                                </div>
                                                
                                                {meals.length === 0 ? (
                                                    <div className="py-6 text-center border border-dashed border-[#1A271E] rounded-xl bg-black/10">
                                                        <p className="text-[11px] text-[#829A8B]">No {type.toLowerCase()} logged</p>
                                                        <button onClick={() => { setAddingFor({ day: selectedDay, type }); setShowAddModal(true) }}
                                                            className="text-[10px] text-[#10B981] font-bold hover:text-[#34D399] mt-2 uppercase tracking-wider flex items-center gap-1 mx-auto">+ Add Custom</button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <AnimatePresence>
                                                            {meals.map((meal) => (
                                                                <motion.div key={meal.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 8 }}
                                                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all group border border-transparent ${meal.completed ? 'bg-[rgba(16,185,129,0.03)] border-[#1A271E]' : 'bg-[#1A271E]/20 border-[#1A271E] hover:border-[#24362A] hover:bg-[#1A271E]/40'}`}>
                                                                    <button onClick={() => toggleMealComplete(`${selectedDay}_${type}`, meal.id)}
                                                                        className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${meal.completed ? 'bg-[#10B981] border-[#10B981]' : 'border-[#24362A] hover:border-[#10B981]'}`}>
                                                                        {meal.completed && <Check className="w-3 h-3 text-black stroke-[3]" />}
                                                                    </button>
                                                                    <span className={`text-[13px] font-semibold flex-1 truncate ${meal.completed ? 'line-through text-[#829A8B]' : 'text-gray-200'}`}>{meal.name}</span>
                                                                    <button onClick={() => deleteMeal(`${selectedDay}_${type}`, meal.id)}
                                                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg transition-all">
                                                                        <Trash2 className="w-3.5 h-3.5 text-red-400/80 hover:text-red-400" />
                                                                    </button>
                                                                </motion.div>
                                                            ))}
                                                        </AnimatePresence>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Right Column: Weekly Progress & Prep Assistant (lg:col-span-1) */}
                            <div className="space-y-6">
                                <h2 className="text-base font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
                                    <span>📊</span> Weekly Analytics
                                </h2>

                                {/* Goal Progress Card */}
                                <div className="premium-card p-6 space-y-4">
                                    <h3 className="text-xs font-bold text-[#829A8B] uppercase tracking-wider border-b border-[#1A271E]/50 pb-2">Weekly Summary</h3>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-3xl font-extrabold tracking-tight text-white">{completedPlannedThisWeek} <span className="text-xs text-[#829A8B] font-semibold">/ {totalPlannedThisWeek}</span></div>
                                            <div className="text-[11px] text-[#829A8B] uppercase font-bold tracking-wider mt-0.5">meals completed</div>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-[rgba(16,185,129,0.06)] border border-[#1A271E] flex items-center justify-center text-xl shadow-inner">
                                            {totalPlannedThisWeek > 0 && completedPlannedThisWeek === totalPlannedThisWeek ? '🎖️' : '🥗'}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[11px] text-[#829A8B] font-bold uppercase tracking-wider">
                                            <span>Macro Completion</span>
                                            <span className="text-[#10B981]">{totalPlannedThisWeek > 0 ? Math.round((completedPlannedThisWeek / totalPlannedThisWeek) * 100) : 0}%</span>
                                        </div>
                                        <div className="h-1.5 bg-[#1A271E] rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-[#10B981] to-emerald-400 rounded-full transition-all duration-500" 
                                                style={{ width: `${totalPlannedThisWeek > 0 ? (completedPlannedThisWeek / totalPlannedThisWeek) * 100 : 0}%` }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Interactive Mini-Week Calendar Checker */}
                                <div className="premium-card p-5 space-y-3.5">
                                    <h3 className="text-xs font-bold text-[#829A8B] uppercase tracking-wider">Weekly Streak</h3>
                                    <div className="grid grid-cols-7 gap-1">
                                        {DAYS.map((day) => {
                                            const active = getDayPlanStatus(day)
                                            const isSelected = selectedDay === day
                                            return (
                                                <div key={day} onClick={() => setSelectedDay(day)}
                                                    className={`flex flex-col items-center py-2 rounded-lg cursor-pointer transition-all border ${
                                                        isSelected 
                                                            ? 'border-[#10B981] bg-[rgba(16,185,129,0.04)]' 
                                                            : 'border-transparent hover:bg-[#1A271E]/40'
                                                    }`}>
                                                    <span className="text-[9px] font-bold text-[#829A8B]">{day.slice(0, 1)}</span>
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-1.5 text-[10px] font-bold transition-all ${
                                                        active 
                                                            ? 'bg-[#10B981] text-black shadow-sm' 
                                                            : 'bg-[#1A271E] text-[#829A8B]/60'
                                                    }`}>
                                                        {active ? <Check className="w-3 h-3 stroke-[3]" /> : '•'}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Smart Chef Preparation Tip Widget */}
                                <div className="bg-[rgba(16,185,129,0.03)] border border-[rgba(16,185,129,0.15)] rounded-2xl p-5 space-y-3 shadow-lg shadow-emerald-950/[0.05]">
                                    <h3 className="text-xs font-bold text-[#10B981] flex items-center gap-2 uppercase tracking-widest"><Sparkles className="w-4 h-4" /> Chef Prep Guide</h3>
                                    <p className="text-[13px] text-gray-200 leading-relaxed font-medium">
                                        {getPrepTipForDay(selectedDay)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal system (Add Meal Dialog) */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0B120E] border border-[#24362A] rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <h2 className="text-base font-bold text-[#F3F4F6] mb-0.5">Add Meal Plan</h2>
                            <p className="text-xs text-[#829A8B] mb-4">{addingFor.day} · {addingFor.type}</p>
                            <input type="text" placeholder="e.g. Grilled chicken breast with wild rice..." value={mealInput} onChange={(e) => setMealInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddMeal()}
                                className="w-full p-3.5 bg-[#111A14] border border-[#1A271E] rounded-xl text-sm text-[#F3F4F6] placeholder-[#829A8B] outline-none focus:border-[#10B981] mb-4 transition-colors" autoFocus />
                            <div className="flex gap-2.5">
                                <button onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 bg-[#1A271E] text-[#829A8B] hover:text-white font-bold rounded-xl hover:bg-[#24362A] transition-colors text-xs uppercase tracking-wider">Cancel</button>
                                <button onClick={handleAddMeal} disabled={!mealInput.trim()}
                                    className="flex-1 py-3 bg-[#10B981] hover:bg-[#34D399] text-black font-bold rounded-xl disabled:opacity-40 transition-colors text-xs uppercase tracking-wider">Add Meal</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default MealPlanPage
