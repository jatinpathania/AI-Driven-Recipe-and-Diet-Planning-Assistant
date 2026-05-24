import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Calendar, ChefHat, Flame, Leaf, LogOut, MessageSquare, Play, Timer, X } from 'lucide-react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { getSessions, getCurrentUser, getUserData } from '@/utils/api'
import { useGuestUser } from '@/context/GuestUserContext'
import { usePremiumLayout } from '@/context/PremiumLayoutContext'

const StandardSidebarContent = ({ mainNav, toolNav, NavLink, logoWordIndex, logoWords, avatar, initial, displayName, displaySubtitle, setIsOpen, handleLogout }) => {
    return (
        <div className="flex flex-col h-full relative overflow-hidden bg-gradient-to-b from-white/80 via-white/60 to-emerald-50/40 dark:from-[#0c1117] dark:via-[#0f1419] dark:to-[#0c1a14] border-r border-black/[0.06] dark:border-white/[0.04] backdrop-blur-2xl">
            <div className="absolute top-[-20%] left-[-30%] w-[200px] h-[200px] bg-emerald-200/20 dark:bg-emerald-500/[0.04] rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-20%] w-[180px] h-[180px] bg-blue-200/15 dark:bg-blue-500/[0.03] rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
                <div className="p-4 pb-3">
                    <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10 transition-transform group-hover:scale-105">
                            <Image src="/icon.png" alt="Flavour" width={24} height={24} className="relative z-10" />
                            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                        </div>
                        <div className="leading-none">
                            <div className="flex items-baseline gap-0">
                                <span className="text-[18px] font-extrabold text-gray-800 dark:text-gray-100 group-hover:text-emerald-500 transition-colors">Flavour</span>
                                <span className="text-[18px] font-extrabold text-[#10B981]">.</span>
                            </div>
                            <div className="h-5 overflow-hidden mt-0.5">
                                <div className="transition-transform duration-500 ease-in-out" style={{ transform: `translateY(-${logoWordIndex * 20}px)` }}>
                                    {logoWords.map((w, i) => (
                                        <p key={i} className="text-[12px] font-semibold text-emerald-500/70 dark:text-emerald-400/80 h-5 leading-5">{w}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 px-3 space-y-5 overflow-y-auto no-scrollbar">
                    <div>
                        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider px-3 mb-2">Main</p>
                        <div className="space-y-0.5">
                            {mainNav.map(item => <NavLink key={item.path} item={item} />)}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider px-3 mb-2">Tools</p>
                        <div className="space-y-0.5">
                            {toolNav.map(item => <NavLink key={item.path} item={item} />)}
                        </div>
                    </div>
                </nav>

                <div className="p-3 border-t border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex items-center gap-3 group relative">
                        <Link href="/kitchen/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 flex-1 px-2 py-2 rounded-xl hover:bg-white/40 dark:hover:bg-white/[0.04] transition-all">
                            {avatar ? (
                                <Image src={avatar} alt={displayName} width={32} height={32} className="rounded-lg" />
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10">
                                    {initial}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{displayName}</p>
                                <p className="text-[10px] text-emerald-500 font-medium">{displaySubtitle}</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

const PremiumSidebarContent = () => {
    const router = useRouter()
    const pathname = usePathname()
    const { userId, guestId, logout, isGuest } = useGuestUser()
    const { data: session } = useSession()
    const { mobileLeftOpen, setMobileLeftOpen } = usePremiumLayout()

    const [userData, setUserData] = useState(null)
    const [activeCookingRecipe, setActiveCookingRecipe] = useState(null)
    const [sidebarWidth, setSidebarWidth] = useState(260)
    const isResizing = useRef(false)

    const [logoWordIndex, setLogoWordIndex] = useState(0)
    const logoWords = ["AI", "Cook", "Plan", "Track"]

    useEffect(() => {
        const interval = setInterval(() => {
            setLogoWordIndex((prev) => (prev + 1) % logoWords.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [logoWords.length])

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

    useEffect(() => {
        if (isGuest) {
            return
        }

        const fetchUserData = async () => {
            try {
                if (typeof window !== 'undefined') {
                    const result = await getCurrentUser()
                    if (result?.success) {
                        setUserData(result.data)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error)
            }
        }

        fetchUserData()
    }, [isGuest])

    const displayName = isGuest
        ? 'Guest Chef'
        : (session?.user?.username || (typeof window !== 'undefined' ? getUserData()?.username : null) || userData?.username || userData?.name || session?.user?.name || (typeof window !== 'undefined' ? (localStorage.getItem('flavourai_username') || localStorage.getItem('username')) : null) || 'Chef')

    const displaySubtitle = isGuest ? 'guest account' : 'User'

    useEffect(() => {
        if (!userId && !guestId) return

        const loadSession = async () => {
            try {
                const sessRes = await getSessions(userId, guestId)
                if (Array.isArray(sessRes) && sessRes.length > 0) {
                    const latest = sessRes[0]
                    const completedSteps = latest.steps?.filter((s) => s.completed).length || 0
                    const totalSteps = latest.steps?.length || 6
                    setActiveCookingRecipe({
                        name: latest.recipeId?.recipeName || latest.recipeId?.name || 'Active Recipe',
                        step: completedSteps,
                        totalSteps,
                    })
                } else {
                    const stored = localStorage.getItem('flavourai_cooking_recipe')
                    if (stored) {
                        const parsed = JSON.parse(stored)
                        setActiveCookingRecipe({
                            name: parsed.name,
                            step: parsed.step || 3,
                            totalSteps: parsed.totalSteps || 6,
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
                            totalSteps: parsed.totalSteps || 6,
                        })
                    }
                } catch { }
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
        { name: 'Thai Basil Stir Fry', desc: '2 days ago' },
    ]

    const handleRecentCooked = () => {
        router.push('/kitchen/recipes')
        setMobileLeftOpen(false)
    }

    const navItemClass = (path) => {
        const isActive = pathname === path
        return `relative flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer transition-all duration-200 select-none ${isActive
                ? 'bg-[rgba(16,185,129,0.06)] text-[#10B981] border-l-2 border-[#10B981] rounded-l-none pl-3 shadow-[inset_4px_0_12px_rgba(16,185,129,0.04)] font-bold'
                : 'text-[#829A8B] hover:text-white hover:bg-[#1A271E]/60 hover:translate-x-0.5'
            }`
    }

    const avatar = userData?.profileImage || session?.user?.image || null
    const initial = (displayName || 'C')[0].toUpperCase()

    return (
        <aside
            className={`bg-[var(--bg-panel)] border-r border-[var(--border)] flex flex-col py-6 px-4 gap-6 z-40 shrink-0 transition-transform duration-300 md:translate-x-0 fixed md:relative h-full overflow-y-auto hide-scrollbar ${mobileLeftOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ width: `${sidebarWidth}px` }}
        >
            <div
                onMouseDown={startResizing}
                className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-[#10B981]/50 z-50 opacity-0 hover:opacity-100 transition-opacity"
            />

            <div className="flex-between">
                <Link href="/" className="flex items-center gap-3 px-2 cursor-pointer group">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10 transition-transform group-hover:scale-105">
                        <Image src="/icon.png" alt="Flavour" width={24} height={24} className="relative z-10" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                    </div>
                    <div className="leading-none">
                        <h2 className="text-[18px] font-extrabold tracking-tight text-gray-800 dark:text-gray-100 flex items-baseline leading-none group-hover:text-[#10B981] transition-colors">
                            Flavour<span className="text-[#10B981] font-bold">.</span>
                        </h2>
                        <div className="h-5 overflow-hidden mt-0.5">
                            <div className="transition-transform duration-500 ease-in-out" style={{ transform: `translateY(-${logoWordIndex * 20}px)` }}>
                                {logoWords.map((w, i) => (
                                    <p key={i} className="text-[12px] font-bold text-[#10B981] h-5 leading-5">{w}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </Link>
                <button onClick={() => setMobileLeftOpen(false)} className="md:hidden p-1.5 rounded-lg bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                    <X size={16} />
                </button>
            </div>

            <div>
                <div className="text-[0.7rem] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 px-3">Main</div>
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

            <div>
                <div className="text-[0.7rem] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 px-3">Tools</div>
                <nav className="flex flex-col gap-1">
                    <div onClick={() => { router.push('/kitchen/timer'); setMobileLeftOpen(false) }} className={navItemClass('/kitchen/timer')}>
                        <Timer size={16} /> Timer
                    </div>
                    <div onClick={() => { router.push('/kitchen/calories'); setMobileLeftOpen(false) }} className={navItemClass('/kitchen/calories')}>
                        <Flame size={16} /> Calories
                    </div>
                </nav>
            </div>

            <div>
                <div className="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 px-3">Recently Cooked</div>
                <div className="flex flex-col gap-2">
                    {defaultRecipes.map((recipe, idx) => (
                        <div key={idx} onClick={handleRecentCooked} className="bg-[#111A14] border border-[#1A271E] rounded-xl p-3.5 cursor-pointer hover:border-[#24362A] hover:bg-[#152019] transition-all duration-300">
                            <h4 className="text-[13px] font-semibold text-[#F3F4F6]">{recipe.name}</h4>
                            <p className="text-[11px] text-[#829A8B]">{recipe.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border border-[var(--border)] bg-[rgba(16,185,129,0.03)] rounded-xl p-4 mt-auto hover:border-[#10B981]/30 transition-all duration-300">
                <h4 className="text-[13px] font-bold flex items-center gap-2 mb-1 text-[var(--text-main)]">
                    <Flame size={14} className="text-[#10B981]" /> Healthy Streak
                </h4>
                <p className="text-[11px] text-[var(--text-muted)] mb-3">5 balanced meals this week</p>
                <div className="h-1 bg-[var(--border-light)] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#10B981] to-emerald-400 rounded-full" style={{ width: '70%' }} />
                </div>
            </div>

            <button onClick={() => { router.push('/kitchen/cook'); setMobileLeftOpen(false) }} className="bg-[#10B981] text-black font-bold text-sm rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-[#34D399] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/10">
                <Play size={16} fill="black" /> Start Cooking
            </button>

            <div className="p-3 border-t border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center gap-3 group relative">
                    <Link href="/kitchen/profile" onClick={() => setMobileLeftOpen(false)} className="flex items-center gap-3 flex-1 px-2 py-2 rounded-xl hover:bg-white/40 dark:hover:bg-white/[0.04] transition-all">
                        {avatar ? (
                            <Image src={avatar} alt={displayName} width={32} height={32} className="rounded-lg" />
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10">
                                {initial}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{displayName}</p>
                            <p className="text-[10px] text-emerald-500 font-medium">{displaySubtitle}</p>
                        </div>
                    </Link>
                </div>
            </div>
        </aside>
    )
}

const SidebarContent = (props) => {
    if (props?.variant === 'premium') {
        return <PremiumSidebarContent />
    }

    return <StandardSidebarContent {...props} />
}

export default SidebarContent
