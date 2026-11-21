"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BookOpen, Calendar, ChefHat, Flame, Heart, MessageSquare, Play, Search, Settings, ShoppingCart, Timer, X, LogIn, Sparkles,
} from 'lucide-react'
import { getCurrentUser, getUserData } from '@/utils/api'
import { useGuestUser } from '@/context/GuestUserContext'
import { usePremiumLayout } from '@/context/PremiumLayoutContext'
import { useKitchenData } from '@/context/KitchenDataContext'
import { useTimers } from '@/context/TimersContext'
import { useGuestQuota } from '@/lib/guestQuota'
import { openCommandPalette } from '@/components/ui/CommandPalette'

const MAIN_NAV = [
    { href: '/kitchen', label: 'Chat', Icon: MessageSquare },
    { href: '/kitchen/recipes', label: 'Recipes', Icon: BookOpen },
    { href: '/kitchen/favourites', label: 'Favourites', Icon: Heart, badge: 'favourites' },
    { href: '/kitchen/meal-plan', label: 'Meal Plan', Icon: Calendar },
    { href: '/kitchen/cook', label: 'Cook', Icon: ChefHat, badge: 'cook' },
]

const TOOL_NAV = [
    { href: '/kitchen/timer', label: 'Timers', Icon: Timer, badge: 'timers' },
    { href: '/kitchen/calories', label: 'Calories', Icon: Flame },
    { href: '/kitchen/shopping', label: 'Shopping', Icon: ShoppingCart, badge: 'shopping' },
    { href: '/kitchen/settings', label: 'Settings', Icon: Settings },
]

const WORDS = ['AI', 'Cook', 'Plan', 'Track']

/** Isolated so its 3-second tick re-renders one span, not the whole sidebar. */
function RotatingWord() {
    const [i, setI] = useState(0)
    useEffect(() => {
        const id = setInterval(() => setI((n) => (n + 1) % WORDS.length), 3000)
        return () => clearInterval(id)
    }, [])
    return (
        <span className="relative block h-4 overflow-hidden" style={{ perspective: 200 }}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={WORDS[i]}
                    initial={{ rotateX: -90, y: 8, opacity: 0 }}
                    animate={{ rotateX: 0, y: 0, opacity: 1 }}
                    exit={{ rotateX: 90, y: -8, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="block text-[11px] font-bold uppercase leading-4 tracking-[0.14em] text-[var(--brand)]"
                >
                    {WORDS[i]}
                </motion.span>
            </AnimatePresence>
        </span>
    )
}

/** Running-timer count; subscribes to the 4Hz timer tick so the rest of the sidebar doesn't. */
function TimerBadge() {
    const { running, timers } = useTimers()
    const done = timers.some((t) => t.state === 'done')
    if (!running.length && !done) return null
    return (
        <span className={`ml-auto flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold leading-none ${done ? 'bg-rose-500 text-white' : 'bg-[var(--brand)] text-black'}`}>
            {!done && <span className="k-live" style={{ width: 6, height: 6, background: "#000" }} />}
            {done ? '!' : running.length}
        </span>
    )
}

const MIN_W = 220
const MAX_W = 380

export default function SidebarContent() {
    const router = useRouter()
    const pathname = usePathname()
    const { isGuest } = useGuestUser()
    const { data: session } = useSession()
    const { mobileLeftOpen, setMobileLeftOpen } = usePremiumLayout()
    const { shopping, favourites, activeCook, streak, recentlyCooked, relativeDay, findRecipe, startCooking } = useKitchenData()
    const quota = useGuestQuota()

    const [userData, setUserData] = useState(null)
    const [width, setWidth] = useState(260)
    const dragging = useRef(false)

    // Resize listeners exist only for the duration of a drag.
    const startResize = useCallback((e) => {
        e.preventDefault()
        dragging.current = true
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'

        const onMove = (ev) => {
            if (dragging.current) setWidth(Math.min(MAX_W, Math.max(MIN_W, ev.clientX)))
        }
        const onUp = () => {
            dragging.current = false
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
    }, [])

    // Floating overlays (timer dock) align to the sidebar edge.
    useEffect(() => {
        document.documentElement.style.setProperty('--sidebar-w', `${width}px`)
    }, [width])

    useEffect(() => {
        if (isGuest) return
        let alive = true
        getCurrentUser()
            .then((res) => alive && res?.success && setUserData(res.data))
            .catch(() => {})
        return () => {
            alive = false
        }
    }, [isGuest])

    const close = () => setMobileLeftOpen(false)

    const displayName = isGuest
        ? 'Guest Chef'
        : userData?.username || session?.user?.username || getUserData()?.username || session?.user?.name || 'Chef'
    const avatar = userData?.profileImage || session?.user?.image || null
    const initial = (displayName || 'C')[0].toUpperCase()

    const badges = {
        favourites: favourites.length ? <span className="ml-auto text-[10px] font-bold text-[var(--text-muted)]">{favourites.length}</span> : null,
        shopping: shopping.some((i) => !i.checked) ? (
            <span className="ml-auto rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-[9px] font-extrabold leading-none text-black">
                {shopping.filter((i) => !i.checked).length}
            </span>
        ) : null,
        cook: activeCook ? <span className="ml-auto text-[10px] font-bold text-[var(--brand)]">{activeCook.step}/{activeCook.total}</span> : null,
        timers: <TimerBadge />,
    }

    const reopen = (entry) => {
        const recipe = findRecipe(entry.key || entry.name)
        if (recipe) startCooking(recipe)
        router.push('/kitchen/cook')
        close()
    }

    const renderNav = ({ href, label, Icon, badge }) => {
        const active = pathname === href
        return (
            <Link
                key={href}
                href={href}
                onClick={close}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${active ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
                {active && (
                    <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl border border-[var(--brand)]/25 bg-[var(--brand-light)] shadow-[inset_3px_0_0_var(--brand)]"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                )}
                <Icon size={16} className="relative transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
                <span className="relative">{label}</span>
                {badge && <span className="relative ml-auto flex">{badges[badge]}</span>}
            </Link>
        )
    }

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 flex h-full max-w-[85vw] shrink-0 flex-col gap-5 overflow-y-auto overscroll-contain border-r border-[var(--border)] bg-[var(--bg-panel)]/95 px-3.5 py-5 backdrop-blur-xl transition-transform duration-300 ease-out hide-scrollbar md:relative md:translate-x-0 ${mobileLeftOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
            style={{ width }}
        >
            <div onPointerDown={startResize} className="absolute right-0 top-0 z-50 hidden h-full w-1.5 cursor-col-resize opacity-0 transition-opacity hover:bg-[var(--brand)]/50 hover:opacity-100 md:block" />

            <div className="flex items-center justify-between px-1.5">
                <Link href="/" className="group flex items-center gap-3">
                    <motion.div
                        whileHover={{ rotateY: 180 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                        style={{ transformPerspective: 400 }}
                        className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20"
                    >
                        <Image src="/icon.png" alt="" width={24} height={24} />
                        <span className="absolute -right-0.5 -top-0.5"><span className="k-live block" /></span>
                    </motion.div>
                    <span className="leading-none">
                        <span className="block text-[18px] font-extrabold tracking-tight text-[var(--text-main)] transition-colors group-hover:text-[var(--brand)]">
                            Flavour<span className="text-[var(--brand)]">.</span>
                        </span>
                        <RotatingWord />
                    </span>
                </Link>
                <button onClick={close} aria-label="Close menu" className="rounded-lg bg-[var(--bg-hover)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] md:hidden">
                    <X size={16} />
                </button>
            </div>

            <button
                type="button"
                onClick={() => { close(); openCommandPalette() }}
                className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-left text-[var(--text-muted)] transition-colors hover:border-[var(--border-light)] hover:text-[var(--text-main)]"
            >
                <Search size={14} className="shrink-0" />
                <span className="flex-1 text-xs font-semibold">Search</span>
                <kbd className="rounded border border-[var(--border-light)] px-1.5 py-0.5 text-[9px] font-bold">⌘K</kbd>
            </button>

            <nav aria-label="Kitchen" className="flex flex-col gap-0.5">
                {MAIN_NAV.map(renderNav)}
                <div className="my-2 h-px bg-[var(--border)]" />
                {TOOL_NAV.map(renderNav)}
            </nav>

            {activeCook && (
                <Link
                    href="/kitchen/cook"
                    onClick={close}
                    className="group rounded-2xl border border-[var(--brand)]/30 bg-[var(--brand-light)] p-3 transition-colors hover:border-[var(--brand)]"
                >
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--brand)]">
                        <span className="k-live" /> Cooking now
                    </span>
                    <span className="mt-1.5 flex items-center gap-2">
                        <span className="text-lg leading-none">{activeCook.recipe.emoji}</span>
                        <span className="truncate text-[13px] font-bold text-[var(--text-main)]">{activeCook.recipe.name}</span>
                    </span>
                    <span className="mt-2 block h-1 overflow-hidden rounded-full bg-[var(--border)]">
                        <motion.span className="block h-full rounded-full bg-[var(--brand)]" initial={false} animate={{ width: `${activeCook.pct}%` }} />
                    </span>
                </Link>
            )}

            {recentlyCooked.length > 0 && (
                <div>
                    <div className="mb-2 px-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Recent</div>
                    <div className="flex flex-col gap-1">
                        {recentlyCooked.slice(0, 3).map((entry) => (
                            <button
                                key={entry.key}
                                type="button"
                                onClick={() => reopen(entry)}
                                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-[var(--bg-hover)]"
                            >
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--bg-card)] text-base shadow-sm">{entry.emoji}</span>
                                <span className="min-w-0">
                                    <span className="block truncate text-[12.5px] font-semibold text-[var(--text-main)]">{entry.name}</span>
                                    <span className="block text-[10.5px] text-[var(--text-muted)]">{relativeDay(entry.cookedAt)}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Streak as a 7-day strip instead of a sentence */}
            <div className="mt-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3.5">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--text-main)]">
                        <Flame size={14} className={streak.count ? 'text-orange-400' : 'text-[var(--text-muted)]'} />
                        {streak.count ? `${streak.count}-day streak` : 'Start a streak'}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)]">{streak.thisWeek}/7</span>
                </div>
                <div className="mt-2.5 grid grid-cols-7 gap-1">
                    {(streak.week.length ? streak.week : Array.from({ length: 7 }, (_, i) => ({ key: i, cooked: false, label: '' }))).map((d, i) => (
                        <motion.span
                            key={d.key}
                            initial={{ scaleY: 0.3, opacity: 0 }}
                            animate={{ scaleY: 1, opacity: 1 }}
                            transition={{ delay: i * 0.04 }}
                            title={d.cooked ? 'Cooked' : 'No cook logged'}
                            className={`flex h-7 items-end justify-center rounded-md pb-0.5 text-[8px] font-bold ${d.cooked ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 text-white shadow-[0_4px_10px_-4px_var(--brand-glow)]' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'}`}
                        >
                            {d.label}
                        </motion.span>
                    ))}
                </div>
            </div>

            <Link
                href="/kitchen/recipes"
                onClick={close}
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-black shadow-lg shadow-emerald-500/15 transition-all hover:bg-[var(--brand-hover)] active:scale-[0.98]"
            >
                <Play size={15} fill="black" /> Start cooking
            </Link>

            <div className="border-t border-[var(--border)] pt-3">
                <Link href="/kitchen/profile" onClick={close} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--bg-hover)]">
                    {avatar ? (
                        <Image src={avatar} alt="" width={32} height={32} className="rounded-lg" />
                    ) : (
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold text-white">{initial}</span>
                    )}
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[var(--text-main)]">{displayName}</span>
                        <span className="block text-[10px] font-semibold text-[var(--brand)]">
                            {isGuest ? (quota.limited ? `${quota.remaining} free AI prompt${quota.remaining === 1 ? '' : 's'} left` : 'Guest') : 'Member'}
                        </span>
                    </span>
                </Link>
                {isGuest && (
                    <Link
                        href="/login"
                        className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-[var(--brand)]/40 py-2 text-xs font-bold text-[var(--brand)] transition-colors hover:bg-[var(--brand-light)]"
                    >
                        <LogIn size={13} /> Sign in for unlimited AI <Sparkles size={12} />
                    </Link>
                )}
            </div>
        </aside>
    )
}
