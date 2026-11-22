"use client"

import React, { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import {
    ArrowUp, Mic, MicOff, PanelRightOpen, X, Leaf, Zap, Timer as TimerIcon, Sprout, Clock, Flame, Play, RotateCcw, LogIn,
} from 'lucide-react'
import { sendChatMessage, getUserData } from '@/utils/api'
import { usePremiumLayout } from '@/context/PremiumLayoutContext'
import { useKitchenData } from '@/context/KitchenDataContext'
import { useTimers } from '@/context/TimersContext'
import { CHAT_SESSION_KEY } from '@/context/GuestUserContext'
import { useGuestQuota, isGuestLimitError, openGuestGate, LAST_PROMPT_NOTICE } from '@/lib/guestQuota'
import { useHour } from '@/lib/store/hooks'
import { suggestionsFor } from '@/lib/recipe/normalize'
import { uid } from '@/lib/store/local'
import ChatMessage, { AIAvatar } from '@/components/AIChef/ChatMessage'
import MobileMenuButton from '@/components/Layout/MobileMenuButton'
import TodayPanel from '@/components/Kitchen/TodayPanel'
import RecipeSheet from '@/components/Kitchen/RecipeSheet'
import Tilt from '@/components/ui/Tilt'

/* ── Chat transcript in sessionStorage ────────────────────────
   Survives navigating to another kitchen page and back (it used to reset
   every time), clears when the tab closes or the user signs out.          */

const CHAT_EVENT = 'flavour:chat'
const NO_MESSAGES = []
let chatCache = { raw: undefined, value: NO_MESSAGES, memory: false }

const readChat = () => {
    if (chatCache.memory) return chatCache.value
    let raw = null
    try {
        raw = sessionStorage.getItem(CHAT_SESSION_KEY)
    } catch {
        return chatCache.value
    }
    if (raw === chatCache.raw) return chatCache.value
    let value = NO_MESSAGES
    try {
        const parsed = raw ? JSON.parse(raw) : null
        if (Array.isArray(parsed)) value = parsed
    } catch {
        // corrupt transcript — start fresh
    }
    chatCache = { raw, value, memory: false }
    return value
}

const writeChat = (list) => {
    const value = list.slice(-40)
    const raw = JSON.stringify(value)
    try {
        sessionStorage.setItem(CHAT_SESSION_KEY, raw)
        chatCache = { raw, value, memory: false }
    } catch {
        chatCache = { raw, value, memory: true }
    }
    window.dispatchEvent(new Event(CHAT_EVENT))
}

const subscribeChat = (cb) => {
    window.addEventListener(CHAT_EVENT, cb)
    return () => window.removeEventListener(CHAT_EVENT, cb)
}

const appendChat = (...items) => writeChat([...readChat(), ...items])

/* ── Voice input (Web Speech API, where the browser has it) ── */

const subscribeNone = () => () => {}
const getRecognizer = () => (typeof window === 'undefined' ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null)

function useSpeech(onText) {
    const supported = useSyncExternalStore(subscribeNone, () => !!getRecognizer(), () => false)
    const [listening, setListening] = useState(false)
    const recRef = useRef(null)

    const stop = useCallback(() => {
        recRef.current?.stop()
    }, [])

    const start = useCallback(() => {
        const Recognizer = getRecognizer()
        if (!Recognizer) return
        const rec = new Recognizer()
        rec.lang = navigator.language || 'en-US'
        rec.interimResults = true
        rec.onresult = (e) => onText(Array.from(e.results).map((r) => r[0].transcript).join(' '))
        rec.onend = () => setListening(false)
        rec.onerror = () => setListening(false)
        recRef.current = rec
        rec.start()
        setListening(true)
    }, [onText])

    useEffect(() => () => recRef.current?.abort?.(), [])

    return { supported, listening, start, stop }
}

/* ── Local intents: things that shouldn't spend an AI prompt ── */

const TIMER_RE = /^(?:set |start )?(?:a )?(\d{1,3})\s*(?:-|\s)?(?:min(?:ute)?s?|m)\s*timer$|^timer\s*(?:for\s*)?(\d{1,3})\s*(?:min(?:ute)?s?|m)?$/i

const STARTERS = [
    { Icon: Leaf, label: 'Use my leftovers', prompt: 'I have chicken, rice and spinach. What can I make in 20 minutes?' },
    { Icon: Zap, label: 'High protein', prompt: 'A high-protein dinner under 500 calories' },
    { Icon: TimerIcon, label: '15-min meal', prompt: 'Something tasty I can make in 15 minutes' },
    { Icon: Sprout, label: 'Veggie tonight', prompt: 'An easy vegetarian dinner idea' },
]

const greetingFor = (h) => {
    if (h == null) return 'Hello'
    if (h < 5) return 'Late night'
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
}

export default function KitchenDashboard() {
    const { data: session } = useSession()
    const { mobileRightOpen, setMobileRightOpen } = usePremiumLayout()
    const { hydrated, today, settings, activeCook } = useKitchenData()
    const { addTimer } = useTimers()
    const quota = useGuestQuota()
    const hour = useHour()

    const messages = useSyncExternalStore(subscribeChat, readChat, () => NO_MESSAGES)
    const [input, setInput] = useState('')
    const [busy, setBusy] = useState(false)
    const [sheet, setSheet] = useState(null)
    const endRef = useRef(null)
    const inputRef = useRef(null)

    const speech = useSpeech(setInput)

    const name = hydrated ? (session?.user?.name?.split(' ')[0] || getUserData()?.username || '') : ''
    const initial = (name || 'C')[0].toUpperCase()

    // Rotate suggestions daily, filtered by the diet in Settings.
    const daySalt = today ? Number(today.replaceAll('-', '')) : 0
    const picks = useMemo(() => suggestionsFor(settings.diet, 4, daySalt), [settings.diet, daySalt])

    // Follow the conversation; never scroll the welcome screen past its own heading.
    useEffect(() => {
        if (!messages.length && !busy) return
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [messages.length, busy])

    const autosize = (el) => {
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`
    }

    const send = async (text) => {
        const content = String(text ?? input).trim()
        if (!content || busy) return
        if (speech.listening) speech.stop()

        // "20 min timer" → start one locally, no AI round-trip, no prompt spent.
        const t = content.match(TIMER_RE)
        if (t) {
            const minutes = parseInt(t[1] || t[2], 10)
            addTimer({ label: `${minutes} min timer`, minutes })
            appendChat(
                { id: uid(), role: 'user', content },
                { id: uid(), role: 'ai', content: `⏱️ **${minutes} minute timer started.** I'll chime when it's done — it keeps running even if you leave this page.` }
            )
            setInput('')
            return
        }

        if (!quota.guard()) return

        const history = readChat().slice(-8).map(({ role, content: c }) => ({ role, content: c }))
        appendChat({ id: uid(), role: 'user', content })
        setInput('')
        requestAnimationFrame(() => autosize(inputRef.current))
        setBusy(true)

        try {
            const res = await sendChatMessage(content, history)
            const left = quota.record(res.quota)
            appendChat({ id: uid(), role: 'ai', content: res.message || 'Hmm, I came up empty — try rephrasing?', error: !res.success })
            if (left === 0) appendChat({ id: uid(), role: 'ai', content: LAST_PROMPT_NOTICE })
        } catch (err) {
            if (isGuestLimitError(err)) {
                quota.exhaust()
                appendChat({ id: uid(), role: 'ai', content: "You've used your free prompts. **Sign in** to keep cooking with AI — it's free.", error: true })
            } else {
                const left = quota.record(err?.data?.quota)
                appendChat({ id: uid(), role: 'ai', content: err.message || 'Something went wrong. Try again?', error: true })
                if (left === 0) appendChat({ id: uid(), role: 'ai', content: LAST_PROMPT_NOTICE })
            }
        } finally {
            setBusy(false)
        }
    }

    // /kitchen?ask=... (e.g. "Get the recipe" on a planned meal) sends that
    // question once. The param is cleared first, so a reload or React's
    // double-run in development can't send it twice.
    const askFromUrl = useEffectEvent(() => {
        const ask = new URLSearchParams(window.location.search).get('ask')
        if (!ask) return
        window.history.replaceState(null, '', '/kitchen')
        send(ask.slice(0, 500))
    })
    useEffect(() => {
        if (hydrated) askFromUrl()
    }, [hydrated])

    const newChat = () => {
        writeChat([])
        inputRef.current?.focus()
    }

    const closePanel = () => setMobileRightOpen(false)
    const empty = messages.length === 0

    return (
        <>
            {mobileRightOpen && <div onClick={closePanel} className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm xl:hidden" aria-hidden="true" />}

            <section className="relative flex h-full min-w-0 flex-1 flex-col" aria-label="Kitchen chat">
                <header className="flex min-h-[64px] shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-6 md:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <MobileMenuButton />
                        <div className="min-w-0">
                            <p className="truncate text-[11px] font-semibold text-[var(--text-muted)]">{greetingFor(hour)}{name ? `, ${name}` : ''}</p>
                            <h1 className="flex items-center gap-2 text-base font-extrabold text-[var(--text-main)]">
                                Kitchen <span className="k-live" aria-hidden="true" />
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!empty && (
                            <button
                                type="button"
                                onClick={newChat}
                                className="flex items-center gap-1.5 rounded-xl border border-[var(--border-light)] px-3 py-2 text-xs font-bold text-[var(--text-muted)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
                            >
                                <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">New chat</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setMobileRightOpen(true)}
                            aria-label="Open today panel"
                            className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)] xl:hidden"
                        >
                            <PanelRightOpen className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overscroll-contain hide-scrollbar">
                    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 md:py-8">
                        {activeCook && <ResumeBanner cook={activeCook} />}

                        {empty ? (
                            <Welcome name={name} picks={picks} onPrompt={send} onOpen={setSheet} busy={busy} />
                        ) : (
                            messages.map((m) => <ChatMessage key={m.id} message={m} userInitial={initial} />)
                        )}

                        <AnimatePresence>
                            {busy && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 flex gap-3">
                                    <AIAvatar />
                                    <div className="flex items-center gap-3 rounded-[4px_20px_20px_20px] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
                                        <span className="k-dots"><span /><span /><span /></span>
                                        <span className="text-xs font-medium text-[var(--text-muted)]">Cooking up an answer…</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div ref={endRef} />
                    </div>
                </div>

                {/* Composer */}
                <div className="shrink-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)] to-transparent px-4 pb-4 pt-2 sm:px-6 sm:pb-5">
                    <div className="mx-auto w-full max-w-3xl">
                        <QuotaChip quota={quota} />
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                send()
                            }}
                            className="k-composer flex items-end gap-2 p-2 pl-4"
                        >
                            <label htmlFor="kitchen-input" className="sr-only">Ask the kitchen</label>
                            <textarea
                                id="kitchen-input"
                                ref={inputRef}
                                rows={1}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value)
                                    autosize(e.target)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        send()
                                    }
                                }}
                                placeholder={speech.listening ? 'Listening…' : 'What’s in your fridge?'}
                                className="max-h-[140px] flex-1 resize-none bg-transparent py-2 text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
                            />
                            {speech.supported && (
                                <button
                                    type="button"
                                    onClick={speech.listening ? speech.stop : speech.start}
                                    aria-label={speech.listening ? 'Stop voice input' : 'Speak your question'}
                                    aria-pressed={speech.listening}
                                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors ${speech.listening ? 'animate-pulse bg-rose-500/15 text-rose-400' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'}`}
                                >
                                    {speech.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                </button>
                            )}
                            <motion.button
                                type="submit"
                                disabled={busy || !input.trim()}
                                whileTap={{ scale: 0.88, rotate: -12 }}
                                aria-label="Send"
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--brand)] text-black shadow-md shadow-emerald-500/25 transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-30 disabled:shadow-none"
                            >
                                <ArrowUp className="h-4 w-4" />
                            </motion.button>
                        </form>
                        <p className="mt-2 text-center text-[10px] text-[var(--text-muted)]">Double-check anything that matters for allergies or medical diets.</p>
                    </div>
                </div>
            </section>

            {/* Today panel: static on xl, a drawer below */}
            <aside
                className={`fixed right-0 top-0 z-30 h-full w-[340px] max-w-[88vw] shrink-0 overflow-y-auto overscroll-contain border-l border-[var(--border)] bg-[var(--bg-panel)] px-4 py-5 transition-transform duration-300 ease-out elegant-scrollbar xl:relative xl:translate-x-0 ${mobileRightOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}`}
                aria-label="Today"
            >
                <div className="mb-3 flex items-center justify-between xl:hidden">
                    <span className="k-label mb-0">Today</span>
                    <button type="button" onClick={closePanel} aria-label="Close panel" className="rounded-lg bg-[var(--bg-hover)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)]">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <TodayPanel onClose={closePanel} />
            </aside>

            <RecipeSheet recipe={sheet} onClose={() => setSheet(null)} />
        </>
    )
}

/* ── Pieces ────────────────────────────────────────────────── */

function QuotaChip({ quota }) {
    if (!quota.limited) return null
    const spent = quota.remaining === 0
    return (
        <div className="mb-2 flex items-center justify-center gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
            <span className="flex gap-1" aria-hidden="true">
                {Array.from({ length: quota.limit }, (_, i) => (
                    <motion.span
                        key={i}
                        initial={false}
                        animate={{ scale: i < quota.remaining ? 1 : 0.7, opacity: i < quota.remaining ? 1 : 0.3 }}
                        className="h-1.5 w-4 rounded-full bg-[var(--brand)]"
                    />
                ))}
            </span>
            {spent ? (
                <button type="button" onClick={() => openGuestGate()} className="flex items-center gap-1 font-bold text-[var(--brand)] hover:underline">
                    <LogIn className="h-3 w-3" /> Sign in for unlimited AI
                </button>
            ) : (
                <span>{quota.remaining} free prompt{quota.remaining === 1 ? '' : 's'} left</span>
            )}
        </div>
    )
}

function ResumeBanner({ cook }) {
    return (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Link
                href="/kitchen/cook"
                className="group flex items-center gap-3 rounded-2xl border border-[var(--brand)]/30 bg-[var(--brand-light)] p-3 pr-4 transition-colors hover:border-[var(--brand)]"
            >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--bg-card)] text-xl shadow-sm">{cook.recipe.emoji}</span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--brand)]">Pick up where you left off</span>
                    <span className="block truncate text-sm font-bold text-[var(--text-main)]">{cook.recipe.name} · step {cook.step}/{cook.total}</span>
                    <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-[var(--border)]">
                        <span className="block h-full rounded-full bg-[var(--brand)] transition-[width] duration-700" style={{ width: `${cook.pct}%` }} />
                    </span>
                </span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--brand)] text-black transition-transform group-hover:scale-110">
                    <Play className="h-4 w-4 fill-current" />
                </span>
            </Link>
        </motion.div>
    )
}

function Welcome({ name, picks, onPrompt, onOpen, busy }) {
    return (
        <div className="pb-4">
            <div className="flex flex-col items-center pt-2 text-center sm:pt-6">
                <div className="k-orb" aria-hidden="true">
                    <span className="k-orb-ring a" />
                    <span className="k-orb-ring b" />
                    <span className="k-orb-core"><Leaf className="h-6 w-6" /></span>
                </div>
                <motion.h2
                    initial={{ opacity: 0, y: 14, rotateX: -40 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.05 }}
                    style={{ transformPerspective: 600 }}
                    className="mt-5 text-2xl font-extrabold tracking-tight text-[var(--text-main)] sm:text-3xl"
                >
                    What are we cooking{name ? `, ${name}` : ''}?
                </motion.h2>
                <p className="mt-1.5 text-sm text-[var(--text-muted)]">Ingredients in, recipe out.</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STARTERS.map(({ Icon, label, prompt }, i) => (
                    <motion.button
                        key={label}
                        type="button"
                        disabled={busy}
                        onClick={() => onPrompt(prompt)}
                        initial={{ opacity: 0, y: 16, rotateX: -30 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ delay: 0.12 + i * 0.06, type: 'spring', stiffness: 240, damping: 22 }}
                        whileHover={{ y: -3 }}
                        style={{ transformPerspective: 600 }}
                        className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-3 text-left text-[12.5px] font-semibold text-[var(--text-main)] shadow-[var(--shadow-card)] transition-colors hover:border-[var(--brand)] disabled:opacity-50"
                    >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--brand-light)] text-[var(--brand)]"><Icon className="h-3.5 w-3.5" /></span>
                        {label}
                    </motion.button>
                ))}
            </div>

            <div className="mt-8 flex items-baseline justify-between">
                <h3 className="k-label mb-3">Picked for you</h3>
                <Link href="/kitchen/recipes" className="text-[11px] font-bold text-[var(--brand)] hover:underline">All recipes</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {picks.map((r, i) => (
                    <motion.div
                        key={r.key}
                        initial={{ opacity: 0, y: 24, rotateY: -25 }}
                        animate={{ opacity: 1, y: 0, rotateY: 0 }}
                        transition={{ delay: 0.25 + i * 0.07, type: 'spring', stiffness: 200, damping: 22 }}
                        style={{ transformPerspective: 900 }}
                    >
                        <Tilt max={10} onClick={() => onOpen(r)}>
                            <button type="button" className="group block w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] text-left shadow-[var(--shadow-card)] transition-colors hover:border-[var(--brand)]">
                                <span className="relative block aspect-[4/3] overflow-hidden bg-[var(--bg-hover)]">
                                    {r.image ? (
                                        <Image src={r.image} alt="" fill sizes="(min-width:1024px) 180px, 45vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <span className="grid h-full place-items-center text-5xl">{r.emoji}</span>
                                    )}
                                    <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                    <span className="absolute bottom-2 left-2.5 right-2.5 text-[13px] font-extrabold leading-tight text-white drop-shadow">{r.name}</span>
                                </span>
                                <span className="flex gap-2 px-2.5 py-2 text-[10.5px] font-bold">
                                    <span className="flex items-center gap-1 text-orange-400"><Clock className="h-3 w-3" />{r.time}</span>
                                    <span className="flex items-center gap-1 text-rose-400"><Flame className="h-3 w-3" />{r.calories}</span>
                                </span>
                            </button>
                        </Tilt>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
