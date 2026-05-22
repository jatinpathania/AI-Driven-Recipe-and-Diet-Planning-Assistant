"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { MessageSquare, UtensilsCrossed, Calendar, Timer, Flame, Menu, X, ChefHat } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useGuestUser } from '@/context/GuestUserContext'
import { getCurrentUser, scheduleAutoLogout } from '@/utils/api'
import { useSession, signOut } from 'next-auth/react'
import SidebarContent from './SidebarContent'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const LOGO_WORDS = ['AI', 'Cook', 'Plan', 'Track']

const Sidebar = () => {
    const pathname = usePathname()
    const router = useRouter()
    const { data: session } = useSession()
    const { logout, userId, isGuest } = useGuestUser()
    const [isOpen, setIsOpen] = useState(false)
    const [userData, setUserData] = useState(null)
    const [logoWordIndex, setLogoWordIndex] = useState(0)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            setLogoWordIndex(prev => (prev + 1) % LOGO_WORDS.length)
        }, 2500)
        return () => clearInterval(interval)
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

    useEffect(() => {
        if (typeof window === 'undefined' || isGuest) return

        const syncLogoutTimer = () => {
            const token = localStorage.getItem('token')

            if (token) {
                scheduleAutoLogout()
            } else if (window.__flavour_logout_timer) {
                clearTimeout(window.__flavour_logout_timer)
                window.__flavour_logout_timer = null
            }
        }

        syncLogoutTimer()
        window.addEventListener('storage', syncLogoutTimer)

        return () => {
            window.removeEventListener('storage', syncLogoutTimer)
        }
    }, [isGuest, session, userData])

    const username = useMemo(() => {
        return session?.user?.username || userData?.username || session?.user?.name || 'Chef'
    }, [session, userData])

    const displayName = isGuest ? 'Guest Chef' : username
    const displaySubtitle = isGuest ? 'guest account' : 'User'

    const profileImage = useMemo(() => {
        return session?.user?.image || userData?.profileImage || null
    }, [session, userData])

    const todayCalories = useMemo(() => {
        if (typeof window === 'undefined') return 0
        try {
            const logs = JSON.parse(localStorage.getItem('flavourai_calorie_logs') || '[]')
            const today = new Date().toDateString()
            const todayLogs = logs.filter(l => new Date(l.date).toDateString() === today)
            return todayLogs.reduce((s, l) => s + (l.calories || 0), 0)
        } catch {
            return 0
        }
    }, [])

    const handleLogoutClick = () => {
        if (!isGuest) {
            setShowLogoutConfirm(true)
        } else {
            logout()
            router.push('/')
        }
    }

    const confirmLogout = async () => {
        setShowLogoutConfirm(false)
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

    const avatar = profileImage
    const initial = (username || 'C')[0].toUpperCase()

    return (
        <>
            <div className="hidden md:block w-56 flex-shrink-0 h-screen">
                <SidebarContent mainNav={mainNav} toolNav={toolNav} isActive={isActive} NavLink={NavLink} logoWordIndex={logoWordIndex} logoWords={LOGO_WORDS} avatar={avatar} initial={initial} displayName={displayName} displaySubtitle={displaySubtitle} setIsOpen={setIsOpen} handleLogout={handleLogoutClick} />
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
                        <SidebarContent mainNav={mainNav} toolNav={toolNav} isActive={isActive} NavLink={NavLink} logoWordIndex={logoWordIndex} logoWords={LOGO_WORDS} avatar={avatar} initial={initial} displayName={displayName} displaySubtitle={displaySubtitle} setIsOpen={setIsOpen} handleLogout={handleLogoutClick} />
                    </div>
                </>
            )}

            {!isGuest && (
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
            )}
        </>
    )
}

export default Sidebar
