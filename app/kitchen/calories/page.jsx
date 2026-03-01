"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Plus, X, Trash2, ChevronLeft, ChevronRight, Sparkles, Loader2, Target } from 'lucide-react'
import { useGuestUser } from '@/context/GuestUserContext'
import { sendChatMessage } from '@/utils/api'

const quickFoods = [
    { name: 'Apple', emoji: '🍎', calories: 95 },
    { name: 'Banana', emoji: '🍌', calories: 105 },
    { name: 'Coffee', emoji: '☕', calories: 5 },
    { name: 'Chicken Breast', emoji: '🍗', calories: 165 },
    { name: 'Rice', emoji: '🍚', calories: 206 },
    { name: 'Salad', emoji: '🥗', calories: 150 },
    { name: 'Egg', emoji: '🥚', calories: 78 },
    { name: 'Milk', emoji: '🥛', calories: 149 },
]

const CaloriesPage = () => {
    const { userId, isGuest } = useGuestUser()
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [dailyGoal, setDailyGoal] = useState(2000)
    const [foodLog, setFoodLog] = useState({})
    const [showAddModal, setShowAddModal] = useState(false)
    const [foodName, setFoodName] = useState('')
    const [foodCalories, setFoodCalories] = useState('')
    const [foodPortion, setFoodPortion] = useState('')
    const [isEstimating, setIsEstimating] = useState(false)
    const [showGoalEdit, setShowGoalEdit] = useState(false)
    const [goalInput, setGoalInput] = useState('')

    useEffect(() => {
        const saved = localStorage.getItem('flavourai_calories')
        if (saved) setFoodLog(JSON.parse(saved))
        const savedGoal = localStorage.getItem('flavourai_calorie_goal')
        if (savedGoal) setDailyGoal(parseInt(savedGoal))
    }, [])

    const saveLog = (updated) => {
        setFoodLog(updated)
        localStorage.setItem('flavourai_calories', JSON.stringify(updated))
    }

    const addFood = (name, calories, portion) => {
        const updated = { ...foodLog }
        if (!updated[selectedDate]) updated[selectedDate] = []
        updated[selectedDate].push({ id: Date.now(), name, calories: parseInt(calories), portion: portion || '1 serving', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
        saveLog(updated)
    }

    const deleteFood = (foodId) => {
        const updated = { ...foodLog }
        if (updated[selectedDate]) {
            updated[selectedDate] = updated[selectedDate].filter(f => f.id !== foodId)
            if (updated[selectedDate].length === 0) delete updated[selectedDate]
            saveLog(updated)
        }
    }

    const handleAIEstimate = async () => {
        if (!foodName.trim()) return
        setIsEstimating(true)
        try {
            const response = await sendChatMessage(
                `Estimate the calories in "${foodName}" ${foodPortion ? `(${foodPortion})` : '(1 serving)'}. Reply with ONLY a number, no other text.`,
                []
            )
            const text = response.message || ''
            const match = text.match(/\d+/)
            if (match) setFoodCalories(match[0])
        } catch (error) {
            console.error('Error estimating calories:', error)
        }
        setIsEstimating(false)
    }

    const handleAddFood = () => {
        const cals = parseInt(foodCalories)
        if (foodName.trim() && cals > 0) {
            addFood(foodName.trim(), cals, foodPortion.trim())
            setFoodName('')
            setFoodCalories('')
            setFoodPortion('')
            setShowAddModal(false)
        }
    }

    const changeDate = (delta) => {
        const d = new Date(selectedDate)
        d.setDate(d.getDate() + delta)
        setSelectedDate(d.toISOString().split('T')[0])
    }

    const todayFoods = foodLog[selectedDate] || []
    const totalCalories = todayFoods.reduce((sum, f) => sum + f.calories, 0)
    const remaining = dailyGoal - totalCalories
    const progress = Math.min((totalCalories / dailyGoal) * 100, 100)
    const circumference = 2 * Math.PI * 54
    const isToday = selectedDate === new Date().toISOString().split('T')[0]

    const getWeekData = () => {
        const data = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const key = d.toISOString().split('T')[0]
            const foods = foodLog[key] || []
            const total = foods.reduce((sum, f) => sum + f.calories, 0)
            data.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), calories: total, date: key })
        }
        return data
    }

    const weekData = getWeekData()
    const maxWeekCal = Math.max(...weekData.map(d => d.calories), dailyGoal)

    const saveGoal = () => {
        const g = parseInt(goalInput)
        if (g > 0) {
            setDailyGoal(g)
            localStorage.setItem('flavourai_calorie_goal', g.toString())
            setShowGoalEdit(false)
        }
    }

    const dateLabel = isToday ? 'Today' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

    return (
        <div className="flex flex-col h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-[#0c1117] dark:via-[#0f1419] dark:to-[#0c1a14]" />
            <div className="absolute top-[-10%] right-[20%] w-[400px] h-[400px] bg-orange-200/12 dark:bg-orange-500/[0.02] rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[15%] w-[350px] h-[350px] bg-emerald-200/15 dark:bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-shrink-0 border-b border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20 dark:shadow-orange-500/10">
                            <Flame className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Calories</h1>
                            <p className="text-[11px] text-gray-400 dark:text-gray-600">Track your daily intake</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg transition-colors">
                            <ChevronLeft className="w-4 h-4 text-gray-400" />
                        </button>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[80px] text-center">{dateLabel}</span>
                        <button onClick={() => changeDate(1)} className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="max-w-5xl mx-auto p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm text-center">
                                    <div className="relative w-36 h-36 mx-auto mb-4">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="72" cy="72" r="54" fill="none" strokeWidth="8" className="stroke-black/[0.04] dark:stroke-white/[0.04]" />
                                            <circle cx="72" cy="72" r="54" fill="none" strokeWidth="8" strokeLinecap="round"
                                                className={totalCalories > dailyGoal ? 'stroke-red-400' : 'stroke-emerald-400'}
                                                strokeDasharray={circumference} strokeDashoffset={circumference - (progress / 100) * circumference}
                                                style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-2xl font-bold ${totalCalories > dailyGoal ? 'text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>{totalCalories}</span>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wider">kcal</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-center gap-6 text-center">
                                        <div>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{dailyGoal}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wider">Goal</p>
                                        </div>
                                        <div>
                                            <p className={`text-lg font-bold ${remaining < 0 ? 'text-red-400' : 'text-emerald-500'}`}>{remaining}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wider">{remaining < 0 ? 'Over' : 'Left'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setGoalInput(dailyGoal.toString()); setShowGoalEdit(true) }}
                                        className="mt-3 flex items-center gap-1 mx-auto text-[11px] text-gray-400 dark:text-gray-600 hover:text-emerald-500 transition-colors">
                                        <Target className="w-3 h-3" /> Edit goal
                                    </button>
                                </div>

                                <div className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm">
                                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-3">7-Day Overview</h3>
                                    <div className="flex items-end justify-between gap-2 h-28">
                                        {weekData.map((d) => (
                                            <div key={d.date} className="flex flex-col items-center gap-1 flex-1">
                                                <span className="text-[9px] text-gray-400 dark:text-gray-600 font-medium">{d.calories > 0 ? d.calories : ''}</span>
                                                <div className="w-full relative" style={{ height: '72px' }}>
                                                    <div className={`absolute bottom-0 w-full rounded-t-md transition-all ${d.date === selectedDate ? 'bg-emerald-400' : d.calories > dailyGoal ? 'bg-red-400/60' : 'bg-emerald-400/30 dark:bg-emerald-400/20'}`}
                                                        style={{ height: `${maxWeekCal > 0 ? Math.max((d.calories / maxWeekCal) * 100, d.calories > 0 ? 4 : 0) : 0}%` }} />
                                                </div>
                                                <span className={`text-[9px] font-medium ${d.date === selectedDate ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-600'}`}>{d.day}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm">
                                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-3">Quick Add</h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {quickFoods.map((food) => (
                                            <button key={food.name} onClick={() => addFood(food.name, food.calories, '1 serving')}
                                                className="flex flex-col items-center p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-emerald-500/[0.06] hover:border-emerald-400/20 border border-transparent transition-all text-center">
                                                <span className="text-lg">{food.emoji}</span>
                                                <span className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 leading-tight">{food.name}</span>
                                                <span className="text-[9px] text-gray-400 dark:text-gray-600">{food.calories}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => setShowAddModal(true)}
                                        className="w-full mt-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5">
                                        <Plus className="w-3.5 h-3.5" /> Log Food
                                    </button>
                                </div>

                                <div className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm">
                                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-3">Today&apos;s Log</h3>
                                    {todayFoods.length === 0 ? (
                                        <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-4">No foods logged yet</p>
                                    ) : (
                                        <div className="space-y-1.5 max-h-[280px] overflow-y-auto no-scrollbar">
                                            <AnimatePresence>
                                                {todayFoods.map((food) => (
                                                    <motion.div key={food.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                                                        className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all group">
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{food.name}</p>
                                                            <p className="text-[10px] text-gray-400 dark:text-gray-600">{food.portion} · {food.time}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold text-emerald-500">{food.calories}</span>
                                                            <button onClick={() => deleteFood(food.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-lg transition-all">
                                                                <Trash2 className="w-3 h-3 text-red-400" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </div>
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
                            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">Log Food</h2>
                            <div className="space-y-3">
                                <input type="text" placeholder="Food name" value={foodName} onChange={(e) => setFoodName(e.target.value)}
                                    className="w-full p-3 bg-white/50 dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.06] rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-400/40 transition-colors" autoFocus />
                                <input type="text" placeholder="Portion (e.g. 1 cup, 200g)" value={foodPortion} onChange={(e) => setFoodPortion(e.target.value)}
                                    className="w-full p-3 bg-white/50 dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.06] rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-400/40 transition-colors" />
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Calories" value={foodCalories} onChange={(e) => setFoodCalories(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddFood()}
                                        className="flex-1 p-3 bg-white/50 dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.06] rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-400/40 transition-colors" />
                                    <button onClick={handleAIEstimate} disabled={isEstimating || !foodName.trim()}
                                        className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl text-sm font-medium text-emerald-600 dark:text-emerald-400 transition-colors disabled:opacity-30 flex items-center gap-1.5">
                                        {isEstimating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} AI
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2.5 mt-4">
                                <button onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors text-sm">Cancel</button>
                                <button onClick={handleAddFood} disabled={!foodName.trim() || !foodCalories}
                                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl disabled:opacity-40 transition-colors text-sm">Add Food</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showGoalEdit && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowGoalEdit(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white/90 dark:bg-[#0f1419]/95 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.06] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">Daily Calorie Goal</h2>
                            <input type="number" placeholder="Calories" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                                className="w-full p-3 bg-white/50 dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.06] rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-400/40 mb-3 transition-colors" autoFocus />
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {[1500, 2000, 2500, 3000].map(val => (
                                    <button key={val} onClick={() => setGoalInput(val.toString())}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${goalInput === val.toString() ? 'bg-emerald-500 text-white' : 'bg-black/[0.03] dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 hover:bg-emerald-500/10'}`}>{val}</button>
                                ))}
                            </div>
                            <div className="flex gap-2.5">
                                <button onClick={() => setShowGoalEdit(false)}
                                    className="flex-1 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors text-sm">Cancel</button>
                                <button onClick={saveGoal}
                                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors text-sm">Save</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default CaloriesPage
