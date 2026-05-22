"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ChefHat, Flame, Zap, LogOut, Moon, Sun, Loader2, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useKitchenTheme } from '@/context/KitchenThemeContext'
import { useGuestUser } from '@/context/GuestUserContext'
import { getCurrentUser, getUserProfile, getUserData, isAuthenticated, clearUserData } from '@/utils/api'
import Link from 'next/link'

const ProfilePage = () => {
    const router = useRouter()
    const { data: session } = useSession()
    const { theme, toggleTheme, mounted } = useKitchenTheme()
    const { userId, guestId, isGuest, login, logout } = useGuestUser()
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [savedRecipes, setSavedRecipes] = useState([])
    const [todayCalories, setTodayCalories] = useState(0)

    useEffect(() => {
        const loadData = async () => {
            try {
                const emailAuthData = getUserData()
                const emailAuthenticated = isAuthenticated()
                const nextAuthAuthenticated = !!session?.user
 
                if (emailAuthenticated || nextAuthAuthenticated) {
                    const userId = session?.user?.id || emailAuthData?.userId
                    if (userId) {
                        login(userId) 
                        
                        const response = await getCurrentUser()
                        if (response?.success) {// databse image not changed if already signedup
                            setUserData(response.data)
                        } else if (response?.data) {
                            setUserData(response.data)
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load profile:', error)
            }

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
    }, [session])

    const isLoggedIn = session || isAuthenticated()
    const emailAuthData = getUserData()
    const displayName = session?.user?.username || emailAuthData?.username || session?.user?.name || userData?.name || userData?.username || (isGuest ? 'Guest Chef' : 'Chef')
    const displayEmail = session?.user?.email || emailAuthData?.email || userData?.email || (isGuest ? 'Guest account' : '')
    // Database is source of truth for profile image
    // It gets filled when: 1) Email signup (empty), 2) Google fills it if empty, 3) Custom upload
    // Once image exists, it's locked and won't be overwritten
    const profileImage = userData?.profileImage || session?.user?.image

    const handleLogout = async () => {
        clearUserData()  
        logout()      
        if (session) {
            await signOut({ redirect: false })
        }
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
            <div className="flex flex-col h-screen relative overflow-hidden w-full" style={{ backgroundColor: '#070B09', color: '#F3F4F6' }}>
                <div className="relative z-10 flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden w-full" style={{ backgroundColor: '#070B09', color: '#F3F4F6' }}>
            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-shrink-0 border-b border-[#1A271E]">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-lg font-bold text-[#F3F4F6]">Profile</h1>
                            <p className="text-[11px] text-[#829A8B]">Your cooking journey</p>
                        </div>
                    </div>
                    {mounted && (
                        <button onClick={toggleTheme}
                            className="w-9 h-9 rounded-xl bg-[#111A14] border border-[#1A271E] flex items-center justify-center hover:border-[#10B981] transition-all">
                            {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-[#829A8B]" />}
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar">
                    <div className="w-full max-w-4xl mx-auto p-6 space-y-4">
                        <div className="bg-[#111A14] border border-[#1A271E] rounded-2xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981] to-teal-500 p-[2px]">
                                        <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#070B09] flex items-center justify-center">
                                            {profileImage ? (
                                                <img src={profileImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl">👨‍🍳</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-[#F3F4F6]">{displayName}</h2>
                                    {displayEmail && <p className="text-sm text-[#829A8B]">{displayEmail}</p>}
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isLoggedIn && !isGuest ? 'bg-[rgba(16,185,129,0.1)] text-[#10B981]' : 'bg-[#1A271E] text-[#829A8B]'}`}>
                                            {isLoggedIn && !isGuest ? 'Pro Member' : 'Home Cook'}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={handleLogout}
                                    className="p-2.5 rounded-xl bg-[#1A271E] hover:bg-red-500/10 transition-colors group">
                                    <LogOut className="w-4 h-4 text-[#829A8B] group-hover:text-red-400" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {stats.map((stat) => (
                                <div key={stat.label} className="bg-[#111A14] border border-[#1A271E] rounded-2xl p-4 text-center hover:border-[#10B981] transition-all">
                                    <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color === 'emerald' ? 'text-[#10B981]' : stat.color === 'orange' ? 'text-orange-500' : stat.color === 'red' ? 'text-red-500' : 'text-yellow-500'}`} />
                                    <p className="text-xl font-bold text-[#F3F4F6]">{stat.value}</p>
                                    <p className="text-[10px] text-[#829A8B] uppercase tracking-wider mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {savedRecipes.length > 0 && (
                            <div className="bg-[#111A14] border border-[#1A271E] rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-[#F3F4F6]">Saved Recipes</h3>
                                    <Link href="/kitchen/recipes" className="text-[11px] text-[#10B981] font-bold uppercase tracking-wider hover:text-[#34D399]">View all</Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {savedRecipes.slice(0, 6).map((recipe, i) => (
                                        <button key={i} onClick={() => { localStorage.setItem('flavourai_cooking_recipe', JSON.stringify(recipe)); router.push('/kitchen/cook') }}
                                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#1A271E]/50 hover:bg-[#1A271E] transition-all text-left group border border-transparent hover:border-[#24362A]">
                                            <span className="text-lg">{recipe.emoji || '🍽️'}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-[#F3F4F6] font-bold truncate">{recipe.name || recipe.title}</p>
                                                <p className="text-[10px] text-[#829A8B] uppercase tracking-wider">{recipe.cookTime || recipe.time || 'Quick cook'}</p>
                                            </div>
                                            <ArrowRight className="w-3 h-3 text-[#829A8B] group-hover:text-[#10B981] transition-colors flex-shrink-0" />
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
                                    className="bg-[#111A14] border border-[#1A271E] rounded-2xl p-4 hover:border-[#10B981] transition-all flex items-center gap-3 group">
                                    <span className="text-xl">{action.emoji}</span>
                                    <span className="text-sm font-bold text-[#F3F4F6]">{action.label}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-[#829A8B] group-hover:text-[#10B981] ml-auto transition-colors" />
                                </Link>
                            ))}
                        </div>

                        {!isLoggedIn && isGuest && (
                            <div className="bg-[rgba(16,185,129,0.06)] border border-[#10B981]/20 rounded-2xl p-5 text-center">
                                <h3 className="text-sm font-bold text-[#F3F4F6] mb-1">Sign in for the full experience</h3>
                                <p className="text-xs text-[#829A8B] mb-3">Save recipes, sync across devices, and unlock all features</p>
                                <Link href="/login" className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#34D399] text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
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
