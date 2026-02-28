"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, BookOpen, ChefHat, Flame, Zap, LogOut, Moon, Sun, Loader2, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useKitchenTheme } from '@/context/KitchenThemeContext'
import { useGuestUser } from '@/context/GuestUserContext'
import { getUserProfile, getUserData, isAuthenticated } from '@/utils/api'
import Link from 'next/link'

const ProfilePage = () => {
    const router = useRouter()
    const { data: session } = useSession()
    const { theme, toggleTheme, mounted } = useKitchenTheme()
    const { userId, guestId, isGuest, logout } = useGuestUser()
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [savedRecipes, setSavedRecipes] = useState([])
    const [todayCalories, setTodayCalories] = useState(0)

    useEffect(() => {
        const loadData = async () => {
            try {
                if (isAuthenticated()) {
                    const profile = await getUserProfile()
                    setUserData(profile)
                }
            } catch {}

            try {
                const recipes = JSON.parse(localStorage.getItem('flavourai_recipes') || '[]')
                setSavedRecipes(recipes)
            } catch {}

            try {
                const calories = JSON.parse(localStorage.getItem('flavourai_calories') || '{}')
                const today = new Date().toISOString().split('T')[0]
                const todayFoods = calories[today] || []
                setTodayCalories(todayFoods.reduce((sum, f) => sum + (f.calories || 0), 0))
            } catch {}

            setLoading(false)
        }
        loadData()
    }, [])

    const isLoggedIn = session || isAuthenticated()
    const displayName = session?.user?.name || userData?.name || (isGuest ? 'Guest Chef' : 'Chef')
    const displayEmail = session?.user?.email || userData?.email || (isGuest ? 'Guest account' : '')
    const profileImage = session?.user?.image || userData?.avatar

    const handleLogout = async () => {
        logout()
        if (session) await signOut({ redirect: false })
        router.push('/')
    }

    const stats = [
        { label: 'Saved Recipes', value: savedRecipes.length, icon: BookOpen, color: 'emerald' },
        { label: 'Meals Cooked', value: 0, icon: ChefHat, color: 'orange' },
        { label: 'Calories Today', value: todayCalories, icon: Flame, color: 'red' },
        { label: 'Streak', value: '0 days', icon: Zap, color: 'yellow' },
    ]

    if (loading) {
        return (
            <div className="flex flex-col h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-[#0c1117] dark:via-[#0f1419] dark:to-[#0c1a14]" />
                <div className="relative z-10 flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-[#0c1117] dark:via-[#0f1419] dark:to-[#0c1a14]" />
            <div className="absolute top-[-10%] left-[25%] w-[400px] h-[400px] bg-emerald-200/15 dark:bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[20%] w-[350px] h-[350px] bg-blue-200/12 dark:bg-blue-500/[0.02] rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-shrink-0 border-b border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Profile</h1>
                            <p className="text-[11px] text-gray-400 dark:text-gray-600">Your cooking journey</p>
                        </div>
                    </div>
                    {mounted && (
                        <button onClick={toggleTheme}
                            className="w-9 h-9 rounded-xl bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center hover:border-emerald-400/30 transition-all">
                            {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="max-w-3xl mx-auto p-6 space-y-4">
                        <div className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 p-[2px]">
                                        <div className="w-full h-full rounded-[14px] overflow-hidden bg-white dark:bg-[#0f1419] flex items-center justify-center">
                                            {profileImage ? (
                                                <img src={profileImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl">👨‍🍳</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{displayName}</h2>
                                    {displayEmail && <p className="text-sm text-gray-400 dark:text-gray-600">{displayEmail}</p>}
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isLoggedIn && !isGuest ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-black/[0.04] dark:bg-white/[0.04] text-gray-500 dark:text-gray-400'}`}>
                                            {isLoggedIn && !isGuest ? 'Pro Member' : 'Home Cook'}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={handleLogout}
                                    className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-red-500/10 transition-colors group">
                                    <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {stats.map((stat) => (
                                <div key={stat.label} className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 backdrop-blur-sm text-center hover:border-emerald-400/20 transition-all">
                                    <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color === 'emerald' ? 'text-emerald-500' : stat.color === 'orange' ? 'text-orange-500' : stat.color === 'red' ? 'text-red-400' : 'text-yellow-500'}`} />
                                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wider mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {savedRecipes.length > 0 && (
                            <div className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Saved Recipes</h3>
                                    <Link href="/kitchen/recipes" className="text-[11px] text-emerald-500 font-medium hover:text-emerald-600">View all</Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {savedRecipes.slice(0, 6).map((recipe, i) => (
                                        <button key={i} onClick={() => { localStorage.setItem('flavourai_cooking_recipe', JSON.stringify(recipe)); router.push('/kitchen/cook') }}
                                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all text-left group">
                                            <span className="text-lg">{recipe.emoji || '🍽️'}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">{recipe.name || recipe.title}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-600">{recipe.cookTime || recipe.time || 'Quick cook'}</p>
                                            </div>
                                            <ArrowRight className="w-3 h-3 text-gray-300 dark:text-gray-700 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { label: 'Start Cooking', href: '/kitchen/cook', emoji: '🍳' },
                                { label: 'Plan Meals', href: '/kitchen/meal-plan', emoji: '📋' },
                                { label: 'Track Calories', href: '/kitchen/calories', emoji: '🔥' },
                            ].map((action) => (
                                <Link key={action.label} href={action.href}
                                    className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 backdrop-blur-sm hover:border-emerald-400/30 transition-all flex items-center gap-3 group">
                                    <span className="text-xl">{action.emoji}</span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-700 group-hover:text-emerald-400 ml-auto transition-colors" />
                                </Link>
                            ))}
                        </div>

                        {isGuest && (
                            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/[0.06] dark:to-teal-500/[0.06] border border-emerald-400/20 rounded-2xl p-5 text-center">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Sign in for the full experience</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Save recipes, sync across devices, and unlock all features</p>
                                <Link href="/login" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
                                    Sign In
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage
