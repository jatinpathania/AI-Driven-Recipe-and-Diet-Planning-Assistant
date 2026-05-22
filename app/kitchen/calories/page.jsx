"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Trash2, ChevronLeft, ChevronRight, Sparkles, Loader2, Target } from 'lucide-react'
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
        <div className="flex flex-col h-screen relative overflow-hidden w-full" style={{ backgroundColor: '#070B09', color: '#F3F4F6' }}>
            <div className="relative z-10 flex flex-col h-full w-full">
                {/* Unified Header */}
                <div className="border-b border-[#1A271E] flex-shrink-0 min-h-[72px] flex items-center w-full">
                    <div className="max-w-5xl mx-auto w-full px-6 md:px-10 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div>
                                <h1 className="text-lg font-bold text-[#F3F4F6]">Calories</h1>
                                <p className="text-[11px] text-[#829A8B]">Track your daily nutrition intake</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-[#111A14] border border-[#1A271E] px-2 py-1 rounded-xl">
                            <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-[#1A271E] rounded-lg transition-colors">
                                <ChevronLeft className="w-4 h-4 text-[#829A8B]" />
                            </button>
                            <span className="text-[10px] font-extrabold text-[#F3F4F6] min-w-[100px] text-center uppercase tracking-wider">{dateLabel}</span>
                            <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-[#1A271E] rounded-lg transition-colors">
                                <ChevronRight className="w-4 h-4 text-[#829A8B]" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto elegant-scrollbar py-8 w-full">
                    <div className="max-w-4xl mx-auto w-full px-6 md:px-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            <div className="space-y-6">
                                <div className="premium-card p-6 text-center">
                                    <div className="relative w-36 h-36 mx-auto mb-4">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="72" cy="72" r="54" fill="none" strokeWidth="8" className="stroke-[#1A271E]" />
                                            <circle cx="72" cy="72" r="54" fill="none" strokeWidth="8" strokeLinecap="round"
                                                className={totalCalories > dailyGoal ? 'stroke-red-500' : 'stroke-[#10B981]'}
                                                strokeDasharray={circumference} strokeDashoffset={circumference - (progress / 100) * circumference}
                                                style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-2xl font-bold ${totalCalories > dailyGoal ? 'text-red-500' : 'text-[#F3F4F6]'}`}>{totalCalories}</span>
                                            <span className="text-[10px] text-[#829A8B] uppercase tracking-wider font-extrabold">kcal</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-center gap-8 text-center border-t border-[#1A271E]/50 pt-4 mt-2">
                                        <div>
                                            <p className="text-base font-extrabold text-[#F3F4F6]">{dailyGoal}</p>
                                            <p className="text-[9px] text-[#829A8B] uppercase font-bold tracking-widest mt-0.5">Goal</p>
                                        </div>
                                        <div>
                                            <p className={`text-base font-extrabold ${remaining < 0 ? 'text-red-500' : 'text-[#10B981]'}`}>{Math.abs(remaining)}</p>
                                            <p className="text-[9px] text-[#829A8B] uppercase font-bold tracking-widest mt-0.5">{remaining < 0 ? 'Over' : 'Left'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setGoalInput(dailyGoal.toString()); setShowGoalEdit(true) }}
                                        className="mt-4 flex items-center gap-1.5 mx-auto text-[10px] text-[#829A8B] hover:text-[#10B981] transition-colors uppercase tracking-widest font-extrabold">
                                        <Target className="w-3.5 h-3.5" /> Edit goal
                                    </button>
                                </div>

                                <div className="premium-card p-6">
                                    <h3 className="text-xs font-bold text-[#829A8B] uppercase tracking-wider mb-5 pb-2 border-b border-[#1A271E]/50">7-Day Overview</h3>
                                    <div className="flex items-end justify-between gap-2.5 h-28 pt-2">
                                        {weekData.map((d) => (
                                            <div key={d.date} className="flex flex-col items-center gap-1.5 flex-1 group cursor-pointer" onClick={() => setSelectedDate(d.date)}>
                                                <span className="text-[8px] text-[#829A8B] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity">{d.calories > 0 ? `${d.calories}` : ''}</span>
                                                <div className="w-full relative" style={{ height: '72px' }}>
                                                    <div className={`absolute bottom-0 w-full rounded-t-md transition-all duration-300 ${
                                                        d.date === selectedDate 
                                                            ? 'bg-[#10B981] shadow-lg shadow-emerald-500/20' 
                                                            : d.calories > dailyGoal 
                                                                ? 'bg-red-500/50 hover:bg-red-500/70' 
                                                                : 'bg-[#1A271E] hover:bg-[#24362A]'
                                                    }`}
                                                    style={{ height: `${maxWeekCal > 0 ? Math.max((d.calories / maxWeekCal) * 100, d.calories > 0 ? 6 : 0) : 0}%` }} />
                                                </div>
                                                <span className={`text-[9px] font-extrabold uppercase tracking-wider transition-colors ${d.date === selectedDate ? 'text-[#10B981]' : 'text-[#829A8B] group-hover:text-white'}`}>{d.day.slice(0, 3)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="premium-card p-6">
                                    <h3 className="text-xs font-bold text-[#829A8B] uppercase tracking-wider mb-4 pb-2 border-b border-[#1A271E]/50">Quick Add</h3>
                                    <div className="grid grid-cols-4 gap-2.5">
                                        {quickFoods.map((food) => (
                                            <button key={food.name} onClick={() => addFood(food.name, food.calories, '1 serving')}
                                                className="flex flex-col items-center p-2.5 rounded-xl bg-[#1A271E]/30 hover:bg-[rgba(16,185,129,0.06)] hover:border-[#10B981]/40 border border-[#1A271E] transition-all text-center group active:scale-95 duration-200">
                                                <span className="text-lg select-none group-hover:scale-110 transition-transform">{food.emoji}</span>
                                                <span className="text-[10px] text-[#F3F4F6] mt-1.5 leading-tight font-extrabold truncate w-full">{food.name}</span>
                                                <span className="text-[9px] text-[#10B981] font-bold mt-0.5">{food.calories} kcal</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => setShowAddModal(true)}
                                        className="w-full mt-4 py-3 bg-[#10B981] hover:bg-[#34D399] text-black font-extrabold rounded-xl transition-all active:scale-[0.98] text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10">
                                        <Plus className="w-4 h-4" /> Log Custom Food
                                    </button>
                                </div>

                                <div className="premium-card p-6">
                                    <h3 className="text-xs font-bold text-[#829A8B] uppercase tracking-wider mb-4 pb-2 border-b border-[#1A271E]/50">Today&apos;s Log</h3>
                                    {todayFoods.length === 0 ? (
                                        <div className="py-6 text-center border border-dashed border-[#1A271E] rounded-xl bg-black/10">
                                            <p className="text-[11px] text-[#829A8B]">No foods logged yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[280px] overflow-y-auto elegant-scrollbar pr-1">
                                            <AnimatePresence>
                                                {todayFoods.map((food) => (
                                                    <motion.div key={food.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                                                        className="flex items-center justify-between p-3 rounded-xl bg-[#1A271E]/20 border border-[#1A271E] hover:border-[#24362A] hover:bg-[#1A271E]/40 transition-all group">
                                                        <div className="flex-1 min-w-0 pr-3">
                                                            <p className="text-[13px] text-[#F3F4F6] font-bold truncate">{food.name}</p>
                                                            <p className="text-[10px] text-[#829A8B] uppercase font-bold tracking-wider mt-0.5">{food.portion} · {food.time}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-extrabold text-[#10B981]">{food.calories} kcal</span>
                                                            <button onClick={() => deleteFood(food.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg transition-all">
                                                                <Trash2 className="w-3.5 h-3.5 text-red-400/80 hover:text-red-400" />
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0B120E] border border-[#24362A] rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <h2 className="text-base font-bold text-[#F3F4F6] mb-4">Log Food</h2>
                            <div className="space-y-3">
                                <input type="text" placeholder="Food name" value={foodName} onChange={(e) => setFoodName(e.target.value)}
                                    className="w-full p-3 bg-[#111A14] border border-[#1A271E] rounded-xl text-sm text-[#F3F4F6] placeholder-[#829A8B] outline-none focus:border-[#10B981] transition-colors" autoFocus />
                                <input type="text" placeholder="Portion (e.g. 1 cup, 200g)" value={foodPortion} onChange={(e) => setFoodPortion(e.target.value)}
                                    className="w-full p-3 bg-[#111A14] border border-[#1A271E] rounded-xl text-sm text-[#F3F4F6] placeholder-[#829A8B] outline-none focus:border-[#10B981] transition-colors" />
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Calories" value={foodCalories} onChange={(e) => setFoodCalories(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddFood()}
                                        className="flex-1 p-3 bg-[#111A14] border border-[#1A271E] rounded-xl text-sm text-[#F3F4F6] placeholder-[#829A8B] outline-none focus:border-[#10B981] transition-colors" />
                                    <button onClick={handleAIEstimate} disabled={isEstimating || !foodName.trim()}
                                        className="px-4 py-2.5 bg-[rgba(16,185,129,0.1)] hover:bg-[rgba(16,185,129,0.2)] rounded-xl text-sm font-bold text-[#10B981] transition-colors disabled:opacity-30 flex items-center gap-1.5">
                                        {isEstimating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} AI
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2.5 mt-4">
                                <button onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 bg-[#1A271E] text-[#F3F4F6] font-bold rounded-xl hover:bg-[#24362A] transition-colors text-sm">Cancel</button>
                                <button onClick={handleAddFood} disabled={!foodName.trim() || !foodCalories}
                                    className="flex-1 py-2.5 bg-[#10B981] hover:bg-[#34D399] text-black font-bold rounded-xl disabled:opacity-40 transition-colors text-sm">Add Food</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showGoalEdit && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowGoalEdit(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0B120E] border border-[#24362A] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                            <h2 className="text-base font-bold text-[#F3F4F6] mb-4">Daily Calorie Goal</h2>
                            <input type="number" placeholder="Calories" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                                className="w-full p-3 bg-[#111A14] border border-[#1A271E] rounded-xl text-sm text-[#F3F4F6] placeholder-[#829A8B] outline-none focus:border-[#10B981] mb-3 transition-colors" autoFocus />
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {[1500, 2000, 2500, 3000].map(val => (
                                    <button key={val} onClick={() => setGoalInput(val.toString())}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${goalInput === val.toString() ? 'bg-[#10B981] text-black' : 'bg-[#1A271E] text-[#829A8B] hover:text-[#10B981]'}`}>{val}</button>
                                ))}
                            </div>
                            <div className="flex gap-2.5">
                                <button onClick={() => setShowGoalEdit(false)}
                                    className="flex-1 py-2.5 bg-[#1A271E] text-[#F3F4F6] font-bold rounded-xl hover:bg-[#24362A] transition-colors text-sm">Cancel</button>
                                <button onClick={saveGoal}
                                    className="flex-1 py-2.5 bg-[#10B981] hover:bg-[#34D399] text-black font-bold rounded-xl transition-colors text-sm">Save</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default CaloriesPage
