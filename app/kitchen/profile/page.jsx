"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, BookOpen, ChefHat, Flame, Zap, LogOut, Loader2, ArrowRight, Settings, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { useKitchenTheme } from '@/context/KitchenThemeContext'
import { useGuestUser } from '@/context/GuestUserContext'
import { getCurrentUser, getUserProfile, getUserData, isAuthenticated, clearUserData, updateUserProfile } from '@/utils/api'
import Link from 'next/link'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ThemeSwitch from '@/components/ui/ThemeSwitch'

const ProfilePage = () => {
    const router = useRouter()
    const { data: session } = useSession()
    const { theme, toggleTheme, mounted } = useKitchenTheme()
    const { userId, guestId, isGuest, login, logout } = useGuestUser()
    const [userData, setUserData] = useState(null)
    const [savedRecipes, setSavedRecipes] = useState([])
    const [todayCalories, setTodayCalories] = useState(0)
    const [isMounted, setIsMounted] = useState(false)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

    const [showSettings, setShowSettings] = useState(false)
    const [usernameInput, setUsernameInput] = useState('')
    const [fullNameInput, setFullNameInput] = useState('')
    const [bioInput, setBioInput] = useState('')
    const [isSavingSettings, setIsSavingSettings] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [toast, setToast] = useState(null)

    const triggerToast = (message) => {
        setToast(message)
        setTimeout(() => setToast(null), 3000)
    }

    const handleSaveSettings = async () => {
        if (!usernameInput.trim()) {
            setErrorMsg("Username cannot be empty")
            return
        }

        setIsSavingSettings(true)
        setErrorMsg("")

        try {
            if (!isGuest) {
                const response = await updateUserProfile({ 
                    username: usernameInput.trim(),
                    fullName: fullNameInput.trim(),
                    bio: bioInput.trim()
                })
                if (response?.success) {
                    if (userData) {
                        setUserData(prev => ({ 
                            ...prev, 
                            username: response.data?.username || usernameInput.trim(),
                            fullName: response.data?.fullName || fullNameInput.trim(),
                            bio: response.data?.bio || bioInput.trim()
                        }))
                    }
                    localStorage.setItem('username', usernameInput.trim())
                    localStorage.setItem('flavourai_username', usernameInput.trim())
                    triggerToast("Profile updated successfully!")
                    setTimeout(() => {
                        window.location.reload()
                    }, 1000)
                } else {
                    setErrorMsg(response?.message || "Failed to update username")
                }
            } else {
                localStorage.setItem('flavourai_username', usernameInput.trim())
                localStorage.setItem('username', usernameInput.trim())
                localStorage.setItem('flavourai_fullname', fullNameInput.trim())
                localStorage.setItem('flavourai_bio', bioInput.trim())
                triggerToast("Profile updated successfully!")
                setTimeout(() => {
                    window.location.reload()
                }, 1000)
            }
        } catch (error) {
            console.error("Save settings error:", error)
            setErrorMsg(error.message || "Failed to update settings")
        } finally {
            setIsSavingSettings(false)
        }
    }

    useEffect(() => {
        setIsMounted(true)
    }, [])

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
        }
        loadData()
    }, [session, login])

    const isLoggedIn = session || isAuthenticated()
    const emailAuthData = getUserData()
    const displayName = isGuest
        ? 'Guest Chef'
        : (userData?.username || session?.user?.username || emailAuthData?.username || userData?.name || session?.user?.name || 'Chef')
    const displaySubtitle = isGuest ? 'guest account' : 'User'
    const displayEmail = isGuest
        ? ''
        : (session?.user?.email || emailAuthData?.email || userData?.email || '')

    const guestFullName = typeof window !== 'undefined' ? (localStorage.getItem('flavourai_fullname') || '') : ''
    const guestBio = typeof window !== 'undefined' ? (localStorage.getItem('flavourai_bio') || '') : ''
    const userFullName = isGuest ? guestFullName : (userData?.fullName || session?.user?.name || '')
    const userBio = isGuest ? guestBio : (userData?.bio || '')
    // Database is source of truth for profile image
    // It gets filled when: 1) Email signup (empty), 2) Google fills it if empty, 3) Custom upload
    // Once image exists, it's locked and won't be overwritten
    const profileImage = userData?.profileImage || session?.user?.image

    const handleLogout = () => {
        setShowLogoutConfirm(true)
    }

    const confirmLogout = async () => {
        setShowLogoutConfirm(false)
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
    if (!isMounted) {
        return (
            <div className="flex flex-col h-screen relative overflow-hidden w-full bg-[var(--bg-base)] text-[var(--text-main)]" />
        )
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden w-full bg-[var(--bg-base)] text-[var(--text-main)]">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#10B981] text-black font-bold text-xs px-4 py-2.5 rounded-full shadow-lg z-[100]">
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-shrink-0 border-b border-[#1A271E]">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-lg font-bold text-[#F3F4F6]">Profile</h1>
                            <p className="text-[11px] text-[#829A8B]">Your cooking journey</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => {
                            const currentUsername = userData?.username || session?.user?.username || emailAuthData?.username || '';
                            const currentFullName = isGuest ? guestFullName : (userData?.fullName || session?.user?.name || '');
                            const currentBio = isGuest ? guestBio : (userData?.bio || '');
                            setUsernameInput(currentUsername || localStorage.getItem('flavourai_username') || '');
                            setFullNameInput(currentFullName || '');
                            setBioInput(currentBio || '');
                            setErrorMsg('');
                            setShowSettings(true);
                        }}
                            className="w-9 h-9 rounded-xl bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center hover:border-emerald-400/30 transition-all text-[#829A8B] hover:text-white cursor-pointer"
                            title="Settings">
                            <Settings className="w-4 h-4" />
                        </button>
                        {mounted && (
                            <ThemeSwitch theme={theme} toggleTheme={toggleTheme} />
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar">
                    <div className="w-full max-w-4xl mx-auto p-6 space-y-4">
                        <div className="bg-[#111A14] border border-[#1A271E] rounded-2xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981] to-teal-500 p-[2px]">
                                        <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#070B09] flex items-center justify-center">
                                            {profileImage ? (
                                                <Image src={profileImage} alt={displayName} width={64} height={64} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl">👨‍🍳</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-[var(--text-main)]">{displayName}</h2>
                                    {userFullName && <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">{userFullName}</p>}
                                    {displayEmail && <p className="text-[11px] text-[#829A8B]">{displayEmail}</p>}
                                    {userBio && <p className="text-xs text-gray-300 italic mt-2 border-l border-emerald-500/30 pl-2">{userBio}</p>}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isLoggedIn && !isGuest ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-black/[0.04] dark:bg-white/[0.04] text-[var(--text-muted)]'}`}>
                                            {displaySubtitle}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={handleLogout}
                                    className="p-2.5 rounded-xl bg-[#1A271E] hover:bg-red-500/10 transition-colors group cursor-pointer">
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
            <ConfirmDialog
                isOpen={showLogoutConfirm}
                title="Logout?"
                message="Are you sure you want to logout? You'll be taken back to the home page."
                onConfirm={confirmLogout}
                onCancel={() => setShowLogoutConfirm(false)}
                confirmText="Yes, Logout"
                cancelText="Cancel"
                isDangerous={true}
            />

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <div onClick={() => setShowSettings(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()} className="bg-[#0B120E] border border-[#24362A] max-w-[420px] w-full rounded-xl p-6 shadow-2xl space-y-5">
                            <div className="flex justify-between items-center border-b border-[#1A271E] pb-3">
                                <h3 className="font-bold flex items-center gap-2 text-white"><Settings size={16} className="text-[#10B981]" /> Settings</h3>
                                <button onClick={() => setShowSettings(false)} className="text-[#829A8B] hover:text-white cursor-pointer"><X size={16} /></button>
                            </div>
                            <div className="space-y-4 text-xs">
                                <div>
                                    <label className="text-[#829A8B] font-semibold uppercase tracking-wider text-[10px] block mb-1.5">Chef Username</label>
                                    <input type="text" value={usernameInput} onChange={e => setUsernameInput(e.target.value)}
                                        className="w-full bg-[#111A14] border border-[#1A271E] rounded-lg p-2.5 text-gray-200 outline-none focus:border-[#10B981]" />
                                </div>
                                <div>
                                    <label className="text-[#829A8B] font-semibold uppercase tracking-wider text-[10px] block mb-1.5">Full Name</label>
                                    <input type="text" value={fullNameInput} onChange={e => setFullNameInput(e.target.value)}
                                        className="w-full bg-[#111A14] border border-[#1A271E] rounded-lg p-2.5 text-gray-200 outline-none focus:border-[#10B981]" placeholder="e.g. John Doe" />
                                </div>
                                <div>
                                    <label className="text-[#829A8B] font-semibold uppercase tracking-wider text-[10px] block mb-1.5">Cooking Bio / Dietary Preference</label>
                                    <textarea value={bioInput} onChange={e => setBioInput(e.target.value)}
                                        rows={3}
                                        className="w-full bg-[#111A14] border border-[#1A271E] rounded-lg p-2.5 text-gray-200 outline-none focus:border-[#10B981] resize-none" placeholder="e.g. Vegetarian, keto diet, love spicy foods!" />
                                </div>
                                {errorMsg && (
                                    <p className="text-red-400 text-[11px] font-medium">{errorMsg}</p>
                                )}
                            </div>
                            <button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full bg-[#10B981] text-black font-bold text-xs py-2.5 rounded-lg hover:bg-[#34D399] transition-colors disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer">
                                {isSavingSettings ? <Loader2 size={12} className="animate-spin" /> : null}
                                {isSavingSettings ? 'Applying...' : 'Apply'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ProfilePage