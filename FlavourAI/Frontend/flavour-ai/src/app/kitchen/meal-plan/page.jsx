"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Plus, X, Check, ChevronLeft, ChevronRight, Sparkles, Loader2, Trash2 } from 'lucide-react'
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

    return (
        <div className="flex flex-col h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-[#0c1117] dark:via-[#0f1419] dark:to-[#0c1a14]" />
            <div className="absolute top-[-15%] left-[15%] w-[450px] h-[450px] bg-blue-200/15 dark:bg-blue-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-emerald-200/15 dark:bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-shrink-0 border-b border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Meal Plan</h1>
                            <p className="text-[11px] text-gray-400 dark:text-gray-600">Plan your week ahead</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg transition-colors">
                            <ChevronLeft className="w-4 h-4 text-gray-400" />
                        </button>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[120px] text-center">{weekLabel}</span>
                        <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="max-w-5xl mx-auto p-6">
                        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
                            {weekDates.map((d) => (
                                <button key={d.day} onClick={() => setSelectedDay(d.day)}
                                    className={`flex flex-col items-center min-w-[64px] px-3 py-2.5 rounded-xl transition-all ${selectedDay === d.day ? 'bg-emerald-500 text-white shadow-sm' : d.isToday ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-400/30' : 'bg-white/60 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] text-gray-500 dark:text-gray-400 hover:border-emerald-400/30'}`}>
                                    <span className="text-[9px] font-medium uppercase tracking-wider opacity-80">{d.day.slice(0, 3)}</span>
                                    <span className="text-lg font-bold">{d.date}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end mb-4">
                            <button onClick={handleAIGenerate} disabled={isGenerating}
                                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                                {isGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : <><Sparkles className="w-3.5 h-3.5" /> AI Fill {selectedDay}</>}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {MEAL_TYPES.map((type) => {
                                const meals = getMealsForDayType(selectedDay, type)
                                return (
                                    <motion.div key={type} layout
                                        className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm hover:border-emerald-400/20 transition-all">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{getMealEmoji(type)}</span>
                                                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{type}</h3>
                                            </div>
                                            <button onClick={() => { setAddingFor({ day: selectedDay, type }); setShowAddModal(true) }}
                                                className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                                                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                                            </button>
                                        </div>
                                        {meals.length === 0 ? (
                                            <div className="py-4 text-center">
                                                <p className="text-[11px] text-gray-400 dark:text-gray-600">No meals planned</p>
                                                <button onClick={() => { setAddingFor({ day: selectedDay, type }); setShowAddModal(true) }}
                                                    className="text-[11px] text-emerald-500 font-medium hover:text-emerald-600 mt-1">+ Add meal</button>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <AnimatePresence>
                                                    {meals.map((meal) => (
                                                        <motion.div key={meal.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                                                            className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all group ${meal.completed ? 'bg-emerald-500/[0.06]' : 'bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'}`}>
                                                            <button onClick={() => toggleMealComplete(`${selectedDay}_${type}`, meal.id)}
                                                                className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${meal.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-700 hover:border-emerald-400'}`}>
                                                                {meal.completed && <Check className="w-2.5 h-2.5 text-white" />}
                                                            </button>
                                                            <span className={`text-sm flex-1 ${meal.completed ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>{meal.name}</span>
                                                            <button onClick={() => deleteMeal(`${selectedDay}_${type}`, meal.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-lg transition-all">
                                                                <Trash2 className="w-3 h-3 text-red-400" />
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
                </div>
            </div>

            <AnimatePresence>
                {showAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white/90 dark:bg-[#0f1419]/95 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.06] rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-0.5">Add Meal</h2>
                            <p className="text-sm text-gray-400 dark:text-gray-600 mb-4">{addingFor.day} · {addingFor.type}</p>
                            <input type="text" placeholder="e.g. Grilled chicken with rice..." value={mealInput} onChange={(e) => setMealInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddMeal()}
                                className="w-full p-3 bg-white/50 dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.06] rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-400/40 mb-4 transition-colors" autoFocus />
                            <div className="flex gap-2.5">
                                <button onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors text-sm">Cancel</button>
                                <button onClick={handleAddMeal} disabled={!mealInput.trim()}
                                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl disabled:opacity-40 transition-colors text-sm">Add Meal</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default MealPlanPage
