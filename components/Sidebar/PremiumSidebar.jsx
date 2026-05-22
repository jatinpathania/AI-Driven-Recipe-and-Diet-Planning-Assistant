"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Leaf, MessageSquare, BookOpen, Calendar, ChefHat, Timer, Flame, Play, X, LogOut } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useGuestUser } from '@/context/GuestUserContext'
import { useSession, signOut } from 'next-auth/react'
import { getSessions } from '@/utils/api'
import Image from 'next/image'
import { usePremiumLayout } from '@/context/PremiumLayoutContext'

const PremiumSidebar = () => {
    const router = useRouter()
    const pathname = usePathname()
    const { userId, guestId, logout } = useGuestUser()
    const { data: session } = useSession()
    const { mobileLeftOpen, setMobileLeftOpen } = usePremiumLayout()

    const [username, setUsername] = useState('Chef User')
    const [activeCookingRecipe, setActiveCookingRecipe] = useState(null)
    
    // -- RESIZE LOGIC --
    const [sidebarWidth, setSidebarWidth] = useState(260)
    const isResizing = useRef(false)

    const startResizing = useCallback((e) => {
        e.preventDefault()
        isResizing.current = true
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
    }, [])

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing.current) return
            let newWidth = e.clientX
            if (newWidth < 200) newWidth = 200
            if (newWidth > 450) newWidth = 450
            setSidebarWidth(newWidth)
        }
        const handleMouseUp = () => {
            if (isResizing.current) {
                isResizing.current = false
                document.body.style.cursor = 'default'
                document.body.style.userSelect = 'auto'
            }
        }
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    // Sync username
    useEffect(() => {
        if (session?.user?.name) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUsername(session.user.name)
        } else {
            const stored = localStorage.getItem('flavourai_username') || localStorage.getItem('username')
            if (stored) setUsername(stored)
        }
    }, [session])

    // Fetch active session
    useEffect(() => {
        if (!userId && !guestId) return
        const loadSession = async () => {
            try {
                const sessRes = await getSessions(userId, guestId)
                if (Array.isArray(sessRes) && sessRes.length > 0) {
                    const latest = sessRes[0]
                    const completedSteps = latest.steps?.filter(s => s.completed).length || 0
                    const totalSteps = latest.steps?.length || 6
                    setActiveCookingRecipe({
                        name: latest.recipeId?.recipeName || latest.recipeId?.name || 'Active Recipe',
                        step: completedSteps,
                        totalSteps
                    })
                } else {
                    const stored = localStorage.getItem('flavourai_cooking_recipe')
                    if (stored) {
                        const parsed = JSON.parse(stored)
                        setActiveCookingRecipe({
                            name: parsed.name,
                            step: parsed.step || 3,
                            totalSteps: parsed.totalSteps || 6
                        })
                    }
                }
            } catch {
                try {
                    const stored = localStorage.getItem('flavourai_cooking_recipe')
                    if (stored) {
                        const parsed = JSON.parse(stored)
                        setActiveCookingRecipe({
                            name: parsed.name,
                            step: parsed.step || 3,
                            totalSteps: parsed.totalSteps || 6
                        })
                    }
                } catch {}
            }
        }
        loadSession()
    }, [userId, guestId, pathname])

    const handleLogout = async () => {
        logout()
        await signOut({ redirect: false })
        router.push('/')
    }

    const defaultRecipes = [
        { name: 'Lemon Herb Chicken', desc: 'Yesterday' },
        { name: 'Thai Basil Stir Fry', desc: '2 days ago' }
    ]

    const handleRecentCooked = (recipe) => {
        // Just route to recipes page for simplicity in global sidebar
        router.push('/kitchen/recipes')
        setMobileLeftOpen(false)
    }

    const navItemClass = (path) => {
        const isActive = pathname === path
        return `relative flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer transition-all duration-200 select-none ${
            isActive 
                ? 'bg-[rgba(16,185,129,0.06)] text-[#10B981] border-l-2 border-[#10B981] rounded-l-none pl-3 shadow-[inset_4px_0_12px_rgba(16,185,129,0.04)] font-bold' 
                : 'text-[#829A8B] hover:text-white hover:bg-[#1A271E]/60 hover:translate-x-0.5'
        }`
    }

    const avatar = session?.user?.image
    const initial = (username || 'C')[0].toUpperCase()

    return (
        <aside 
            className={`bg-[#0B120E] border-r border-[#1A271E] flex flex-col py-6 px-4 gap-6 z-40 shrink-0 transition-transform duration-300 md:translate-x-0 fixed md:relative h-full overflow-y-auto hide-scrollbar ${mobileLeftOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ width: `${sidebarWidth}px` }}
        >
            {/* Resizer Handle */}
            <div 
                onMouseDown={startResizing}
                className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-[#10B981]/50 z-50 opacity-0 hover:opacity-100 transition-opacity"
            />

            <div className="flex-between">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 bg-[rgba(16,185,129,0.1)] rounded-[10px] flex items-center justify-center text-[#10B981]">
                        <Leaf size={18} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-[#F3F4F6]">Flavour <span className="text-[#10B981] font-medium">AI</span></h2>
                        <span className="text-[10px] text-[#829A8B]">Cook</span>
                    </div>
                </div>
                <button onClick={() => setMobileLeftOpen(false)} className="md:hidden p-1.5 rounded-lg bg-[#1A271E] text-[#829A8B] hover:text-white transition-colors"><X size={16} /></button>
            </div>

            {/* Main Nav */}
            <div>
                <div className="text-[0.7rem] font-bold text-[#829A8B] uppercase tracking-wider mb-3 px-3">Main</div>
                <nav className="flex flex-col gap-1">
                    <div onClick={() => { router.push('/kitchen'); setMobileLeftOpen(false) }} className={navItemClass('/kitchen')}>
                        <MessageSquare size={16} /> Chat
                    </div>
                    <div onClick={() => { router.push('/kitchen/recipes'); setMobileLeftOpen(false) }} className={navItemClass('/kitchen/recipes')}>
                        <BookOpen size={16} /> Recipes
                    </div>
                    <div onClick={() => { router.push('/kitchen/meal-plan'); setMobileLeftOpen(false) }} className={navItemClass('/kitchen/meal-plan')}>
                        <Calendar size={16} /> Meal Plan
                    </div>
                    <div onClick={() => { router.push('/kitchen/cook'); setMobileLeftOpen(false) }} className={navItemClass('/kitchen/cook')}>
                        <ChefHat size={16} /> Cook
                        {activeCookingRecipe && <span className="ml-auto text-[10px] text-[#829A8B]">[Step {activeCookingRecipe.step}/{activeCookingRecipe.totalSteps}]</span>}
                    </div>
                </nav>
            </div>

            {/* Tools Nav */}
            <div>
                <div className="text-[0.7rem] font-bold text-[#829A8B] uppercase tracking-wider mb-3 px-3">Tools</div>
                <nav className="flex flex-col gap-1">
                    <div onClick={() => { router.push('/kitchen/timer'); setMobileLeftOpen(false) }} className={navItemClass('/kitchen/timer')}><Timer size={16} /> Timer</div>
                    <div onClick={() => { router.push('/kitchen/calories'); setMobileLeftOpen(false) }} className={navItemClass('/kitchen/calories')}><Flame size={16} /> Calories</div>
                </nav>
            </div>

            {/* Recently Cooked */}
            <div>
                <div className="text-[0.65rem] font-bold text-[#829A8B] uppercase tracking-widest mb-3 px-3">Recently Cooked</div>
                <div className="flex flex-col gap-2">
                    {defaultRecipes.map((recipe, idx) => (
                        <div key={idx} onClick={() => handleRecentCooked(recipe)} className="bg-[#111A14] border border-[#1A271E] rounded-xl p-3.5 cursor-pointer hover:border-[#24362A] hover:bg-[#152019] transition-all duration-300">
                            <h4 className="text-[13px] font-semibold text-[#F3F4F6]">{recipe.name}</h4>
                            <p className="text-[11px] text-[#829A8B]">{recipe.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
 
            {/* Streak */}
            <div className="border border-[#24362A] bg-[#111A14]/30 rounded-xl p-4 mt-auto hover:border-[#10B981]/30 transition-all duration-300">
                <h4 className="text-[13px] font-bold flex items-center gap-2 mb-1 text-[#F3F4F6]"><Flame size={14} className="text-[#10B981]" /> Healthy Streak</h4>
                <p className="text-[11px] text-[#829A8B] mb-3">5 balanced meals this week</p>
                <div className="h-1 bg-[#1A271E] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#10B981] to-emerald-400 rounded-full" style={{ width: '70%' }}></div></div>
            </div>
 
            {/* Start Cooking */}
            <button onClick={() => { router.push('/kitchen/cook'); setMobileLeftOpen(false) }} className="bg-[#10B981] text-black font-bold text-sm rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-[#34D399] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/10">
                <Play size={16} fill="black" /> Start Cooking
            </button>
 
            {/* User Profile */}
            <div className="flex items-center gap-3 px-2 pt-3.5 border-t border-[#1A271E]">
                <div onClick={() => { router.push('/kitchen/profile'); setMobileLeftOpen(false) }} className="flex items-center gap-3 flex-1 cursor-pointer group">
                    {avatar
                        ? <Image src={avatar} alt={username} className="w-9 h-9 rounded-full object-cover group-hover:ring-2 group-hover:ring-[#10B981]/50 transition-all" />
                        : <div className="w-9 h-9 rounded-full bg-[#F59E0B] text-black flex items-center justify-center font-bold text-sm group-hover:ring-2 group-hover:ring-[#10B981]/50 transition-all">{initial}</div>
                    }
                    <div className="min-w-0">
                        <h4 className="text-sm font-semibold truncate text-[#F3F4F6] group-hover:text-white transition-colors">{username}</h4>
                        <p className="text-[11px] text-[#829A8B]">Pro Plan</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-500/10 text-[#829A8B] hover:text-red-400 transition-colors"><LogOut size={15} /></button>
            </div>
        </aside>
    )
}

export default PremiumSidebar
