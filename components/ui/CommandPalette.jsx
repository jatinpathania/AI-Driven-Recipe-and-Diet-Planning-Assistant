"use client"

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, MessageSquare, BookOpen, Calendar, ChefHat, Timer, Flame,
    Heart, ShoppingCart, Settings, User, CornerDownLeft, ArrowUp, ArrowDown, Play,
} from 'lucide-react'
import { useKitchenData } from '@/context/KitchenDataContext'
import { useTimers } from '@/context/TimersContext'
import { useToast } from '@/components/ui/Toaster'

/**
 * ⌘K / Ctrl-K palette.
 *
 * Navigation, saved recipes and a few verbs ("start a 10 minute timer",
 * "add X to the list") in one box, so none of it needs a dedicated button.
 */

export const OPEN_PALETTE_EVENT = 'flavour:open-palette'

/** Opens the palette from anywhere — buttons, empty states, onboarding hints. */
export const openCommandPalette = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT))
}

const NAV = [
    { id: 'chat', label: 'AI Chef Chat', hint: 'Ask anything about cooking', icon: MessageSquare, href: '/kitchen' },
    { id: 'recipes', label: 'Recipes', hint: 'Your saved recipe library', icon: BookOpen, href: '/kitchen/recipes' },
    { id: 'favourites', label: 'Favourites', hint: 'Recipes you starred', icon: Heart, href: '/kitchen/favourites' },
    { id: 'meal-plan', label: 'Meal Plan', hint: 'Plan the week', icon: Calendar, href: '/kitchen/meal-plan' },
    { id: 'shopping', label: 'Shopping List', hint: 'What to buy', icon: ShoppingCart, href: '/kitchen/shopping' },
    { id: 'cook', label: 'Cook Mode', hint: 'Step-by-step guidance', icon: ChefHat, href: '/kitchen/cook' },
    { id: 'timer', label: 'Timers', hint: 'Run cooking timers', icon: Timer, href: '/kitchen/timer' },
    { id: 'calories', label: 'Calories', hint: 'Track today’s intake', icon: Flame, href: '/kitchen/calories' },
    { id: 'settings', label: 'Settings', hint: 'Preferences and data', icon: Settings, href: '/kitchen/settings' },
    { id: 'profile', label: 'Profile', hint: 'Your account', icon: User, href: '/kitchen/profile' },
]

// Subsequence match, so "mlpn" still finds "Meal Plan".
const fuzzy = (text, query) => {
    if (!query) return true
    const t = text.toLowerCase()
    const q = query.toLowerCase()
    if (t.includes(q)) return true

    let i = 0
    for (const ch of q) {
        i = t.indexOf(ch, i)
        if (i === -1) return false
        i++
    }
    return true
}

export default function CommandPalette() {
    const router = useRouter()
    const toast = useToast()
    const { favourites, recipes: library, addShoppingItems, startCooking } = useKitchenData()
    const { addTimer } = useTimers()

    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [cursor, setCursor] = useState(0)
    const inputRef = useRef(null)
    const listRef = useRef(null)

    // Global shortcut, plus an event so any button can open it.
    useEffect(() => {
        const onKey = (e) => {
            const mod = e.metaKey || e.ctrlKey
            if (mod && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                setOpen((v) => !v)
            }
            if (e.key === 'Escape') setOpen(false)
        }
        const onRequest = () => setOpen(true)

        window.addEventListener('keydown', onKey)
        window.addEventListener(OPEN_PALETTE_EVENT, onRequest)
        return () => {
            window.removeEventListener('keydown', onKey)
            window.removeEventListener(OPEN_PALETTE_EVENT, onRequest)
        }
    }, [])

    // Reset the query each time it opens.
    useEffect(() => {
        if (!open) return
        setQuery('')
        setCursor(0)
        const t = setTimeout(() => inputRef.current?.focus(), 40)
        return () => clearTimeout(t)
    }, [open])

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    const go = useCallback(
        (href) => {
            setOpen(false)
            router.push(href)
        },
        [router]
    )

    const startTimer = useCallback(
        (minutes) => {
            setOpen(false)
            addTimer({ label: `${minutes} min timer`, minutes })
            toast(`${minutes} minute timer started`, { type: 'info', action: { label: 'View', onClick: () => router.push('/kitchen/timer') } })
        },
        [addTimer, router, toast]
    )

    const items = useMemo(() => {
        const q = query.trim()
        const groups = []

        // "20 min timer", "timer 5"
        const minutes = q.match(/(\d{1,3})\s*(?:m|min|mins|minute|minutes)?\b/)
        if (minutes && /tim|min/i.test(q)) {
            const n = parseInt(minutes[1], 10)
            if (n > 0 && n <= 600) {
                groups.push({
                    heading: 'Action',
                    items: [{
                        id: `timer-${n}`,
                        label: `Start a ${n} minute timer`,
                        hint: 'Runs in the background, chimes when done',
                        icon: Timer,
                        run: () => startTimer(n),
                    }],
                })
            }
        }

        // "add milk to list"
        const add = q.match(/^(?:add|buy)\s+(.+?)(?:\s+to\s+(?:the\s+)?(?:list|shopping).*)?$/i)
        if (add?.[1]) {
            const name = add[1].trim()
            groups.push({
                heading: 'Action',
                items: [{
                    id: `shop-${name}`,
                    label: `Add “${name}” to shopping list`,
                    hint: 'Saved to your list',
                    icon: ShoppingCart,
                    run: () => {
                        setOpen(false)
                        const n = addShoppingItems([name], 'Command palette')
                        toast(n ? `Added ${name} to your list` : `${name} is already on your list`, {
                            type: n ? 'success' : 'info',
                            action: { label: 'View', onClick: () => router.push('/kitchen/shopping') },
                        })
                    },
                }],
            })
        }

        const nav = NAV.filter((n) => fuzzy(`${n.label} ${n.hint}`, q)).map((n) => ({
            ...n,
            run: () => go(n.href),
        }))
        if (nav.length) groups.push({ heading: 'Go to', items: nav })

        const favs = favourites
            .filter((f) => fuzzy(f.name || '', q))
            .slice(0, 4)
            .map((f) => ({
                id: `fav-${f.key}`,
                label: f.name,
                hint: 'Favourite · open cook mode',
                emoji: f.emoji,
                icon: Play,
                run: () => {
                    startCooking(f)
                    go('/kitchen/cook')
                },
            }))
        if (favs.length) groups.push({ heading: 'Favourites', items: favs })

        const recipes = library
            .filter((r) => fuzzy(`${r.name} ${(r.ingredients || []).join(' ')}`, q))
            .slice(0, 5)
            .map((r) => ({
                id: `rec-${r.id}`,
                label: r.name,
                hint: [r.time, r.calories ? `${r.calories} kcal` : null].filter(Boolean).join(' · ') || 'Recipe',
                emoji: r.emoji,
                icon: BookOpen,
                run: () => {
                    startCooking(r)
                    go('/kitchen/cook')
                },
            }))
        if (recipes.length) groups.push({ heading: 'Recipes', items: recipes })

        return groups
    }, [query, library, favourites, go, startTimer, addShoppingItems, startCooking, toast, router])

    const flat = useMemo(() => items.flatMap((g) => g.items), [items])

    useEffect(() => {
        if (cursor > flat.length - 1) setCursor(0)
    }, [flat.length, cursor])

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setCursor((c) => (c + 1) % Math.max(flat.length, 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setCursor((c) => (c - 1 + flat.length) % Math.max(flat.length, 1))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            flat[cursor]?.run?.()
        }
    }

    // Keep the highlighted row in view while arrowing.
    useEffect(() => {
        const el = listRef.current?.querySelector('[data-active="true"]')
        el?.scrollIntoView({ block: 'nearest' })
    }, [cursor])

    let runningIndex = -1

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[130] flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setOpen(false)}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Command palette"
                        initial={{ opacity: 0, y: -12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border shadow-2xl"
                        style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-light)' }}
                    >
                        <div className="flex items-center gap-3 border-b px-4" style={{ borderColor: 'var(--border)' }}>
                            <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setCursor(0) }}
                                onKeyDown={onKeyDown}
                                placeholder="Search, or try “20 min timer” or “add milk”…"
                                aria-label="Search commands and recipes"
                                className="h-14 flex-1 bg-transparent text-[15px] text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
                            />
                            <kbd className="hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-muted)] sm:block" style={{ borderColor: 'var(--border-light)' }}>
                                ESC
                            </kbd>
                        </div>

                        <div ref={listRef} className="max-h-[52vh] overflow-y-auto elegant-scrollbar p-2">
                            {flat.length === 0 ? (
                                <p className="px-3 py-10 text-center text-sm text-[var(--text-muted)]">
                                    Nothing matches “{query}”.
                                </p>
                            ) : (
                                items.map((group) => (
                                    <div key={group.heading} className="mb-1">
                                        <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                            {group.heading}
                                        </div>
                                        {group.items.map((item) => {
                                            runningIndex++
                                            const active = runningIndex === cursor
                                            const Icon = item.icon
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    data-active={active}
                                                    onMouseEnter={() => setCursor(flat.indexOf(item))}
                                                    onClick={() => item.run()}
                                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                                                    style={{ background: active ? 'var(--bg-hover)' : 'transparent' }}
                                                >
                                                    <span
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[15px]"
                                                        style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                                                    >
                                                        {item.emoji || <Icon className="h-4 w-4" />}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-[13px] font-semibold text-[var(--text-main)]">
                                                            {item.label}
                                                        </span>
                                                        <span className="block truncate text-[11px] text-[var(--text-muted)]">
                                                            {item.hint}
                                                        </span>
                                                    </span>
                                                    {active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                ))
                            )}
                        </div>

                        <div
                            className="flex items-center gap-4 border-t px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)]"
                            style={{ borderColor: 'var(--border)' }}
                        >
                            <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> navigate</span>
                            <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> select</span>
                            <span className="ml-auto hidden sm:block">Flavour.AI</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
