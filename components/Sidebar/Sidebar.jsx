"use client"

import React, { useState, useEffect } from 'react'
import { MessageSquare, UtensilsCrossed, Calendar, Timer, Flame, Menu, X, LogOut, ChefHat } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useGuestUser } from '@/context/GuestUserContext'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'

const Sidebar = () => {
    const pathname = usePathname()
    const router = useRouter()
    const { data: session } = useSession()
    const { logout, userId } = useGuestUser()
    const [isOpen, setIsOpen] = useState(false)
    const [todayCalories, setTodayCalories] = useState(0)
    const [username, setUsername] = useState('')
    const [logoWordIndex, setLogoWordIndex] = useState(0)

    const logoWords = ['AI', 'Cook', 'Plan', 'Track']

    useEffect(() => {
        const interval = setInterval(() => {
            setLogoWordIndex(prev => (prev + 1) % logoWords.length)
        }, 2500)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (session?.user?.name) {
            setUsername(session.user.name)
        } else {
            const stored = localStorage.getItem('flavourai_username')
            setUsername(stored || 'Chef')
        }
    }, [session])

    useEffect(() => {
        try {
            const logs = JSON.parse(localStorage.getItem('flavourai_calorie_logs') || '[]')
            const today = new Date().toDateString()
            const todayLogs = logs.filter(l => new Date(l.date).toDateString() === today)
            setTodayCalories(todayLogs.reduce((s, l) => s + (l.calories || 0), 0))
        } catch { }
    }, [pathname])

    const handleLogout = async () => {
        logout()
        await signOut({ redirect: false })
        router.push('/')
    }

    const mainNav = [
        { name: 'Chat', path: '/kitchen', icon: MessageSquare, exact: true },
        { name: 'Recipes', path: '/kitchen/recipes', icon: UtensilsCrossed },
        { name: 'Meal Plan', path: '/kitchen/meal-plan', icon: Calendar },
        { name: 'Cook', path: '/kitchen/cook', icon: ChefHat },
    ]

    const toolNav = [
        { name: 'Timer', path: '/kitchen/timer', icon: Timer },
        { name: 'Calories', path: '/kitchen/calories', icon: Flame, badge: todayCalories > 0 ? todayCalories : null },
    ]

    const isActive = (item) => item.exact ? pathname === item.path : pathname.startsWith(item.path)

    const NavLink = ({ item }) => {
        const active = isActive(item)
        return (
            <Link href={item.path} onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all relative
                    ${active
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-400/20'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-white/[0.04] hover:text-gray-700 dark:hover:text-gray-300 border border-transparent hover:border-emerald-400/10'
                    }`}>
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-500 rounded-full" />}
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
                {item.badge && (
                    <span className="ml-auto text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md">
                        {item.badge}
                    </span>
                )}
            </Link>
        )
    }

    const avatar = session?.user?.image
    const initial = (username || 'C')[0].toUpperCase()

    const SidebarContent = () => (
        <div className="flex flex-col h-full relative overflow-hidden bg-gradient-to-b from-white/80 via-white/60 to-emerald-50/40 dark:from-[#0c1117] dark:via-[#0f1419] dark:to-[#0c1a14] border-r border-black/[0.06] dark:border-white/[0.04] backdrop-blur-2xl">
            <div className="absolute top-[-20%] left-[-30%] w-[200px] h-[200px] bg-emerald-200/20 dark:bg-emerald-500/[0.04] rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-20%] w-[180px] h-[180px] bg-blue-200/15 dark:bg-blue-500/[0.03] rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
                <div className="p-4 pb-3">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10">
                            <Image src="/icon.png" alt="Flavour" width={20} height={20} className="relative z-10" />
                            <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        </div>
                        <div className="leading-none">
                            <div className="flex items-baseline gap-0">
                                <span className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Flavour</span>
                                <span className="text-[15px] font-bold text-emerald-500">.</span>
                            </div>
                            <div className="h-4 overflow-hidden">
                                <div className="transition-transform duration-500 ease-in-out" style={{ transform: `translateY(-${logoWordIndex * 16}px)` }}>
                                    {logoWords.map((w, i) => (
                                        <p key={i} className="text-[10px] font-medium text-emerald-500/70 h-4 leading-4">{w}</p>
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
                                <Image src={avatar} alt={username} width={32} height={32} className="rounded-lg" />
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10">
                                    {initial}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{username}</p>
                                <p className="text-[10px] text-emerald-500 font-medium">Pro Plan ✦</p>
                            </div>
                        </Link>
                        <button onClick={handleLogout}
                            className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <>
            <div className="hidden md:block w-56 flex-shrink-0 h-screen">
                <SidebarContent />
            </div>

            <button onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-xl bg-white/70 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] backdrop-blur-xl shadow-sm">
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            {isOpen && (
                <>
                    <div className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setIsOpen(false)} />
                    <div className="md:hidden fixed inset-y-0 left-0 w-56 z-50 shadow-2xl">
                        <button onClick={() => setIsOpen(false)}
                            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] z-10 transition-colors">
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                        <SidebarContent />
                    </div>
                </>
            )}
        </>
    )
}

export default Sidebar
