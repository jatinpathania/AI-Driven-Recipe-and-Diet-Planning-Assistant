"use client"

import React, { useState, useEffect } from 'react'
import { Timer, Flame, CalendarDays, TrendingUp, ChevronRight, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useGuestUser } from '@/context/GuestUserContext'
import { getFoodLog } from '@/utils/api'

const OverviewPanel = ({ mobile = false, onClose }) => {
    const router = useRouter()
    const { userId, guestId } = useGuestUser()
    const [todayCalories, setTodayCalories] = useState(0)
    const [mealsPlanned, setMealsPlanned] = useState(0)

    useEffect(() => {
        if (!userId && !guestId) return
        const loadStats = async () => {
            try {
                const res = await getFoodLog(userId, guestId)
                if (res.foodLogs) {
                    const today = new Date().toDateString()
                    const todayLogs = res.foodLogs.filter(l => new Date(l.date).toDateString() === today)
                    setTodayCalories(todayLogs.reduce((s, l) => s + (l.calories || 0), 0))
                }
            } catch {}
            try {
                const stored = JSON.parse(localStorage.getItem('flavourai_meal_plan') || '{}')
                const days = Object.values(stored)
                setMealsPlanned(days.reduce((s, d) => s + (Array.isArray(d) ? d.length : 0), 0))
            } catch {}
        }
        loadStats()
    }, [userId, guestId])

    const getGreeting = () => {
        const h = new Date().getHours()
        if (h < 12) return 'Good morning'
        if (h < 17) return 'Good afternoon'
        return 'Good evening'
    }

    const nav = (path) => {
        router.push(path)
        onClose?.()
    }

    const featured = [
        { name: 'Sesame Glazed Salmon', emoji: '🍣', time: '25 min', calories: 420, protein: 34 },
        { name: 'Miso Ramen', emoji: '🍜', time: '35 min', calories: 380, protein: 22 },
        { name: 'Avocado Toast Deluxe', emoji: '🥑', time: '10 min', calories: 290, protein: 11 },
    ]

    return (
        <div className={`${mobile ? 'w-80' : 'w-80'} h-full flex flex-col bg-white/60 dark:bg-white/[0.02] border-l border-black/[0.06] dark:border-white/[0.04] backdrop-blur-2xl overflow-y-auto no-scrollbar`}>
            <div className="p-5 pb-4 border-b border-black/[0.04] dark:border-white/[0.04]">
                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-1">Overview</p>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{getGreeting()} 👋</h2>
            </div>

            <div className="p-5 space-y-6">
                <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={() => nav('/kitchen/calories')}
                        className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl p-3 text-left hover:border-emerald-400/30 transition-all group">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Flame className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Calories</span>
                        </div>
                        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{todayCalories}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">today</p>
                    </button>
                    <button onClick={() => nav('/kitchen/meal-plan')}
                        className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl p-3 text-left hover:border-emerald-400/30 transition-all group">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Planned</span>
                        </div>
                        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{mealsPlanned}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">meals</p>
                    </button>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Trending Tonight</p>
                        <TrendingUp className="w-3 h-3 text-gray-400 dark:text-gray-600" />
                    </div>
                    <div className="space-y-2">
                        {featured.map((r, i) => (
                            <button key={i} onClick={() => nav('/kitchen/recipes')}
                                className="w-full flex items-center gap-3 bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl p-2.5 hover:border-emerald-400/30 transition-all group">
                                <span className="text-xl shrink-0">{r.emoji}</span>
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{r.name}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{r.time} · {r.calories} kcal · {r.protein}g protein</p>
                                </div>
                                <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-700 group-hover:text-emerald-400 transition-colors shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OverviewPanel
