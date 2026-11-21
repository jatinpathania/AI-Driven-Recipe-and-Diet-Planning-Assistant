"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, Sparkles, Loader2, Pause, Play, X, ShoppingCart, ArrowRight, Lightbulb, CalendarPlus } from 'lucide-react'
import { useKitchenData, MEAL_SLOTS, SLOT_EMOJI } from '@/context/KitchenDataContext'
import { useTimers, formatClock } from '@/context/TimersContext'
import { useToast } from '@/components/ui/Toaster'
import ProgressRing from '@/components/ui/ProgressRing'
import { sendChatMessage } from '@/utils/api'
import { useGuestQuota, isGuestLimitError } from '@/lib/guestQuota'

const TIPS = [
    'Salt pasta water like the sea.',
    'Rest meat 5 minutes before slicing.',
    'Scrape ginger with a spoon to peel it.',
    'Lemon at the end brightens any greens.',
    'Dry protein sears; wet protein steams.',
    'Toast spices in a dry pan for 30 seconds.',
]

const card = {
    hidden: { opacity: 0, y: 24, rotateX: -14 },
    show: (i) => ({ opacity: 1, y: 0, rotateX: 0, transition: { delay: 0.08 * i, type: 'spring', stiffness: 220, damping: 24 } }),
}

function Card({ i, children, className = '' }) {
    return (
        <motion.section
            custom={i}
            variants={card}
            initial="hidden"
            animate="show"
            style={{ transformPerspective: 900, transformOrigin: '50% 0%' }}
            className={`premium-card p-4 ${className}`}
        >
            {children}
        </motion.section>
    )
}

/* ── Calories: ring + one-line quick log ─────────────────── */
function CalorieCard({ i }) {
    const toast = useToast()
    const quota = useGuestQuota()
    const { today, totalFor, addCalorieEntry, settings } = useKitchenData()
    const [food, setFood] = useState('')
    const [kcal, setKcal] = useState('')
    const [estimating, setEstimating] = useState(false)

    const goal = settings.dailyCalorieGoal || 2000
    const eaten = today ? totalFor(today) : 0
    const left = goal - eaten

    const log = (e) => {
        e.preventDefault()
        const n = parseInt(kcal, 10)
        if (!food.trim() || !(n > 0)) {
            toast('Add a food and its calories', { type: 'info' })
            return
        }
        addCalorieEntry({ name: food, calories: n }, today)
        toast(`Logged ${food.trim()} · ${n} kcal`)
        setFood('')
        setKcal('')
    }

    const estimate = async () => {
        if (!food.trim() || estimating || !quota.guard()) return
        setEstimating(true)
        try {
            const res = await sendChatMessage(food.trim(), [], { mode: 'estimate' })
            quota.record(res.quota)
            if (res.success) {
                setKcal(String(res.calories))
            } else {
                toast(res.message || 'Could not estimate that', { type: 'info' })
            }
        } catch (err) {
            if (isGuestLimitError(err)) quota.exhaust()
            else {
                quota.record(err?.data?.quota)
                toast(err.message, { type: 'error' })
            }
        } finally {
            setEstimating(false)
        }
    }

    return (
        <Card i={i}>
            <div className="flex items-center gap-4">
                <ProgressRing value={eaten / goal} size={92} stroke={9} label={`${eaten} of ${goal} calories`}>
                    <span className="text-lg font-extrabold leading-none tabular-nums text-[var(--text-main)]">{eaten.toLocaleString()}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">kcal</span>
                </ProgressRing>
                <div className="min-w-0">
                    <p className="k-label mb-1">Today</p>
                    <p className={`text-2xl font-extrabold tabular-nums ${left < 0 ? 'text-rose-400' : 'text-[var(--brand)]'}`}>
                        {Math.abs(left).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-semibold text-[var(--text-muted)]">{left < 0 ? 'over goal' : `left of ${goal.toLocaleString()}`}</p>
                </div>
            </div>

            <form onSubmit={log} className="mt-3.5 flex gap-1.5">
                <input
                    value={food}
                    onChange={(e) => setFood(e.target.value)}
                    placeholder="Ate something?"
                    aria-label="Food"
                    className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-2.5 py-2 text-xs text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]"
                />
                <div className="relative w-[70px]">
                    <input
                        value={kcal}
                        onChange={(e) => setKcal(e.target.value.replace(/\D/g, ''))}
                        inputMode="numeric"
                        placeholder="kcal"
                        aria-label="Calories"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] py-2 pl-2.5 pr-6 text-xs text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]"
                    />
                    <button
                        type="button"
                        onClick={estimate}
                        disabled={!food.trim() || estimating}
                        aria-label="Estimate calories with AI"
                        title="Estimate with AI"
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--brand)] disabled:opacity-30"
                    >
                        {estimating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    </button>
                </div>
                <button type="submit" aria-label="Log food" className="grid w-8 place-items-center rounded-lg bg-[var(--brand)] text-black transition-transform hover:bg-[var(--brand-hover)] active:scale-90">
                    <Plus className="h-4 w-4" />
                </button>
            </form>
        </Card>
    )
}

/* ── Today's meals: tick to log ──────────────────────────── */
function PlanCard({ i, onClose }) {
    const { today, mealsFor, toggleMeal } = useKitchenData()
    const day = today ? mealsFor(today) : {}
    const planned = MEAL_SLOTS.reduce((n, s) => n + (day[s]?.length || 0), 0)

    return (
        <Card i={i}>
            <div className="flex-between mb-2">
                <p className="k-label mb-0">On the menu</p>
                <Link href="/kitchen/meal-plan" onClick={onClose} className="text-[11px] font-bold text-[var(--brand)] hover:underline">
                    {planned ? 'Edit' : 'Plan'}
                </Link>
            </div>
            <ul className="space-y-1">
                {MEAL_SLOTS.map((slot) => {
                    const meal = day[slot]?.[0]
                    return (
                        <li key={slot} className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-[var(--bg-hover)]">
                            <span className="w-5 text-center text-sm" aria-hidden="true">{SLOT_EMOJI[slot]}</span>
                            {meal ? (
                                <>
                                    <span className={`min-w-0 flex-1 truncate text-[12.5px] font-semibold ${meal.completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-main)]'}`}>
                                        {meal.emoji} {meal.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => toggleMeal(today, slot, meal.id)}
                                        role="checkbox"
                                        aria-checked={meal.completed}
                                        aria-label={`Mark ${meal.name} eaten`}
                                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all ${meal.completed ? 'scale-110 border-[var(--brand)] bg-[var(--brand)]' : 'border-[var(--border-light)] hover:border-[var(--brand)]'}`}
                                    >
                                        {meal.completed && <Check className="h-3 w-3 stroke-[3] text-black" />}
                                    </button>
                                </>
                            ) : (
                                <Link href="/kitchen/meal-plan" onClick={onClose} className="flex flex-1 items-center gap-1 text-[12px] text-[var(--text-muted)] hover:text-[var(--brand)]">
                                    <CalendarPlus className="h-3 w-3" /> {slot}
                                </Link>
                            )}
                        </li>
                    )
                })}
            </ul>
        </Card>
    )
}

/* ── Timers: one-tap presets, live list ──────────────────── */
function TimerCard({ i }) {
    const { timers, addTimer, pauseTimer, resumeTimer, removeTimer } = useTimers()
    const live = timers.slice(0, 3)

    return (
        <Card i={i}>
            <p className="k-label mb-2">Timer</p>
            <div className="grid grid-cols-5 gap-1.5">
                {[1, 5, 10, 15, 20].map((m) => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => addTimer({ label: `${m} min`, minutes: m })}
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] py-1.5 text-[11px] font-bold text-[var(--text-muted)] transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)] active:scale-95"
                    >
                        {m}m
                    </button>
                ))}
            </div>
            <AnimatePresence initial={false}>
                {live.map((t) => {
                    const done = t.state === 'done'
                    return (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-2.5 flex items-center gap-2.5">
                                <ProgressRing value={done ? 1 : t.progress} size={34} stroke={4} color={done ? '#f43f5e' : 'var(--brand)'} />
                                <div className="min-w-0 flex-1">
                                    <p className={`font-mono text-sm font-bold tabular-nums ${done ? 'text-rose-400' : 'text-[var(--text-main)]'}`}>{done ? 'Done!' : formatClock(t.remaining)}</p>
                                    <p className="truncate text-[10.5px] text-[var(--text-muted)]">{t.label}</p>
                                </div>
                                {!done && (
                                    <button type="button" onClick={() => (t.state === 'running' ? pauseTimer(t.id) : resumeTimer(t.id))} aria-label="Pause or resume" className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]">
                                        {t.state === 'running' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                    </button>
                                )}
                                <button type="button" onClick={() => removeTimer(t.id)} aria-label="Remove timer" className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-rose-400">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </Card>
    )
}

/* ── Shopping: what's still to buy ───────────────────────── */
function ShoppingCard({ i, onClose }) {
    const { shopping, toggleShoppingItem } = useKitchenData()
    const todo = shopping.filter((s) => !s.checked)

    return (
        <Card i={i}>
            <div className="flex-between mb-2">
                <p className="k-label mb-0 flex items-center gap-1.5"><ShoppingCart className="h-3 w-3" /> To buy</p>
                <span className="rounded-full bg-[var(--brand-light)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--brand)]">{todo.length}</span>
            </div>
            {todo.length === 0 ? (
                <p className="py-1 text-[12px] text-[var(--text-muted)]">All stocked up.</p>
            ) : (
                <ul className="space-y-0.5">
                    {todo.slice(0, 4).map((item) => (
                        <li key={item.id}>
                            <button type="button" onClick={() => toggleShoppingItem(item.id)} className="group flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-[var(--bg-hover)]">
                                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-[var(--border-light)] group-hover:border-[var(--brand)]">
                                    <Check className="h-2.5 w-2.5 text-[var(--brand)] opacity-0 group-hover:opacity-100" />
                                </span>
                                <span className="truncate text-[12.5px] text-[var(--text-main)]">{item.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <Link href="/kitchen/shopping" onClick={onClose} className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[var(--brand)] hover:underline">
                Open list <ArrowRight className="h-3 w-3" />
            </Link>
        </Card>
    )
}

/* ── Tip: tap to flip to the next one ────────────────────── */
function TipCard({ i }) {
    const [n, setN] = useState(0)
    return (
        <motion.button
            type="button"
            custom={i}
            variants={card}
            initial="hidden"
            animate="show"
            onClick={() => setN((x) => (x + 1) % TIPS.length)}
            className="premium-card w-full overflow-hidden border-[var(--brand)]/20 bg-[var(--brand-light)] p-4 text-left"
            style={{ transformPerspective: 900 }}
        >
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--brand)]">
                <Lightbulb className="h-3.5 w-3.5" /> Tip · tap for another
            </p>
            <AnimatePresence mode="wait" initial={false}>
                <motion.p
                    key={n}
                    initial={{ rotateX: -90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    exit={{ rotateX: 90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[13px] font-semibold text-[var(--text-main)]"
                >
                    {TIPS[n]}
                </motion.p>
            </AnimatePresence>
        </motion.button>
    )
}

export default function TodayPanel({ onClose }) {
    return (
        <div className="space-y-3">
            <CalorieCard i={0} />
            <PlanCard i={1} onClose={onClose} />
            <TimerCard i={2} />
            <ShoppingCard i={3} onClose={onClose} />
            <TipCard i={4} />
        </div>
    )
}
