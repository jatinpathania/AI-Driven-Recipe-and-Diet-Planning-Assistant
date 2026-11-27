"use client"

import React, { useEffect, useEffectEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft, ArrowRight, Check, Play, Pause, Utensils, ChefHat, Minus, Plus, Timer as TimerIcon, Lightbulb, X, RotateCcw, Clock, Lock,
} from 'lucide-react'
import MobileMenuButton from '@/components/Layout/MobileMenuButton'
import ProgressRing from '@/components/ui/ProgressRing'
import { useKitchenData } from '@/context/KitchenDataContext'
import { useTimers, formatClock } from '@/context/TimersContext'
import { useToast } from '@/components/ui/Toaster'
import { scaleIngredient, hasQuantities, parseDurations, stepText } from '@/lib/recipe/parse'
import { normalizeRecipe } from '@/lib/recipe/normalize'
import useWakeLock from '@/lib/hooks/useWakeLock'

// Recipes don't record their yield, so 2 is the assumed base for scaling.
const BASE_SERVINGS = 2

/** Whole-recipe time: the stated time, else the sum of the timed steps. */
const totalMinutesFor = (recipe) => {
    if (recipe?.minutes > 0) return recipe.minutes
    const sum = (recipe?.steps || []).reduce((s, step) => s + parseDurations(step).reduce((n, d) => n + d.minutes, 0), 0)
    return sum > 0 ? Math.round(sum) : 0
}

export default function CookPage() {
    const toast = useToast()
    const { activeRecipe, cookProgress, updateCookProgress, finishCooking, settings, updateSettings, hydrated } = useKitchenData()
    const { timers, addTimer, pauseTimer, resumeTimer, removeTimer, removeTimersByRef } = useTimers()

    const recipe = activeRecipe ? normalizeRecipe(activeRecipe) : null
    const steps = recipe?.steps || []
    const progress = cookProgress && recipe && cookProgress.key === recipe.key ? cookProgress : null
    const cooking = !!(progress?.startedAt && !progress.finishedAt)
    const current = Math.min(progress?.step || 0, Math.max(0, steps.length - 1))
    const doneList = progress?.done
    const done = useMemo(() => new Set(doneList || []), [doneList])

    // Every timer this cook session starts carries a ref under this prefix, so
    // the page can show "its" timers and clear them on Finish / Start over.
    const refBase = recipe ? `cook:${recipe.key}:` : ''
    const stepRef = (i, d) => `${refBase}step:${i}:${d.label}`
    const autoTimers = settings.autoStepTimers !== false
    const totalMinutes = totalMinutesFor(recipe)
    const totalTimer = timers.find((t) => t.ref === `${refBase}total`)

    // Optional chaining: this is defined before the "no recipe" early return,
    // and the React Compiler may read its captured values while rendering.
    const startStepTimer = (i, d) =>
        addTimer({ label: `Step ${i + 1} · ${d.label}`, emoji: recipe?.emoji || '🍳', minutes: d.minutes, source: 'cook', ref: stepRef(i, d) })

    // Arriving at a timed step starts its timer once (tracked in `timed`, so
    // going back to a step, or reloading the page, never restarts it).
    const autoStartStep = useEffectEvent(() => {
        if (!recipe || !autoTimers) return
        const timed = Array.isArray(progress?.timed) ? progress.timed : []
        if (timed.includes(current)) return
        const durations = parseDurations(steps[current])
        if (!durations.length) return
        durations.forEach((d) => startStepTimer(current, d))
        updateCookProgress({ timed: [...timed, current] })
        toast(`Step ${current + 1} timer started: ${durations.map((d) => d.label).join(' + ')}`, { type: 'info' })
    })

    useEffect(() => {
        if (cooking) autoStartStep()
    }, [cooking, current, autoTimers])

    const [servings, setServings] = useState(BASE_SERVINGS)
    const [keepAwake, setKeepAwake] = useState(true)
    const [celebrate, setCelebrate] = useState(null)
    const [direction, setDirection] = useState(1)
    const [now, setNow] = useState(null)

    // Elapsed clock derived from startedAt, so it's right after navigation or a reload.
    useEffect(() => {
        if (!cooking) return undefined
        const tick = () => setNow(Date.now())
        const first = setTimeout(tick, 0)
        const id = setInterval(tick, 1000)
        return () => {
            clearTimeout(first)
            clearInterval(id)
        }
    }, [cooking])

    const elapsed = cooking && now ? Math.max(0, Math.floor((now - new Date(progress.startedAt).getTime()) / 1000)) : 0
    const wake = useWakeLock(cooking && keepAwake)

    // Plain functions: the React Compiler memoises them for us.
    const goTo = (i) => {
        const next = Math.max(0, Math.min(steps.length - 1, i))
        setDirection(next >= current ? 1 : -1)
        updateCookProgress({ step: next })
    }

    const toggleDone = (i) => {
        const wasDone = done.has(i)
        const set = new Set(done)
        if (wasDone) set.delete(i)
        else set.add(i)
        updateCookProgress({ done: [...set] })
        // Ticking the current step moves you on, like turning a page.
        if (!wasDone && i === current && i < steps.length - 1) goTo(i + 1)
    }

    /* ── Step gate ──────────────────────────────────────────
       You can't move past a step until it's complete: marked done, or all of
       its timers have run out. Finished timers are recorded in `cleared`, so
       clearing them from the timer list later doesn't lock the step again.
       Going back is always allowed.                                      */
    const clearedList = progress?.cleared
    const cleared = useMemo(() => new Set(clearedList || []), [clearedList])

    const timersFinished = (i) => {
        const durations = parseDurations(steps[i])
        return durations.length > 0 && durations.every((d) => timers.find((t) => t.ref === stepRef(i, d))?.state === 'done')
    }
    const stepComplete = (i) => done.has(i) || cleared.has(i) || timersFinished(i)
    const isLast = current >= steps.length - 1
    const canNext = !isLast && stepComplete(current)
    // A later step is reachable only if every step before it, from here, is complete.
    const canReach = (i) => {
        if (i <= current) return true
        for (let j = current; j < i; j++) if (!stepComplete(j)) return false
        return true
    }

    const next = () => {
        if (canNext) goTo(current + 1)
    }

    const doneTimerRefs = timers
        .filter((t) => t.state === 'done' && refBase && t.ref?.startsWith(`${refBase}step:`))
        .map((t) => t.ref)
        .join('|')
    const recordCleared = useEffectEvent(() => {
        const newly = steps.map((_, i) => i).filter((i) => !cleared.has(i) && timersFinished(i))
        if (newly.length) updateCookProgress({ cleared: [...cleared, ...newly] })
    })
    useEffect(() => {
        if (cooking && doneTimerRefs) recordCleared()
    }, [cooking, doneTimerRefs])

    // Hands-free-ish: ← → move between steps, space ticks the current one.
    // useEffectEvent always sees the latest step without re-binding the listener.
    const onKey = useEffectEvent((e) => {
        if (e.target.closest?.('input, textarea, button')) return
        if (e.key === 'ArrowRight') next()
        if (e.key === 'ArrowLeft') goTo(current - 1)
        if (e.key === ' ') {
            e.preventDefault()
            toggleDone(current)
        }
    })

    useEffect(() => {
        if (!cooking) return undefined
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [cooking])

    if (!hydrated) return <div className="flex h-dvh w-full" />

    // These run before the "no recipe" early return below. The React Compiler
    // caches each handler keyed on the recipe fields it reads, and reads those
    // keys while rendering, so every access here must be null-safe (`recipe?.`).
    const start = () => {
        removeTimersByRef(refBase) // leftovers from an earlier attempt at this recipe
        updateCookProgress({ key: recipe?.key, total: steps.length, startedAt: new Date().toISOString(), finishedAt: null, step: 0, done: [], timed: [], cleared: [] })
        if (totalMinutes > 0) {
            addTimer({ label: `${recipe?.name} · ready`, emoji: recipe?.emoji, minutes: totalMinutes, source: 'cook', ref: `${refBase}total` })
        }
    }

    const startOver = () => {
        removeTimersByRef(refBase)
        updateCookProgress({ startedAt: null, step: 0, done: [], timed: [], cleared: [] })
    }

    const finish = () => {
        removeTimersByRef(refBase)
        finishCooking()
        setCelebrate({ name: recipe?.name, emoji: recipe?.emoji, time: elapsed })
        toast(`${recipe?.name} added to your streak 🔥`)
    }

    const factor = servings / BASE_SERVINGS
    const scalable = recipe ? hasQuantities(recipe.ingredients) : false
    const ingredients = (recipe?.ingredients || []).map((l) => scaleIngredient(l, factor, settings.units))
    const stepTimers = cooking ? parseDurations(steps[current]) : []
    const pct = steps.length ? done.size / steps.length : 0

    /* ── Empty ── */
    if (!recipe) {
        return (
            <Shell title="Cook">
                <div className="flex flex-1 items-center justify-center p-6">
                    <div className="text-center">
                        <motion.div
                            initial={{ rotateY: -180, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                            style={{ transformPerspective: 500 }}
                            className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-card)]"
                        >
                            <Utensils className="h-8 w-8 text-[var(--brand)]" />
                        </motion.div>
                        <h2 className="text-lg font-extrabold text-[var(--text-main)]">Nothing on the stove</h2>
                        <Link href="/kitchen/recipes" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-[var(--brand-hover)]">
                            Pick a recipe
                        </Link>
                    </div>
                </div>
            </Shell>
        )
    }

    /* ── Finished ── */
    if (celebrate) {
        return (
            <Shell title="Cook">
                <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
                    {['🎉', '✨', '🔥', '🍽️', '⭐', '🥳'].map((e, i) => (
                        <motion.span
                            key={e}
                            aria-hidden="true"
                            className="pointer-events-none absolute text-3xl"
                            initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }}
                            animate={{ x: Math.cos((i / 6) * Math.PI * 2) * 180, y: Math.sin((i / 6) * Math.PI * 2) * 140, opacity: [0, 1, 0], scale: [0.3, 1.3, 1], rotate: 360 }}
                            transition={{ duration: 1.6, delay: 0.1 + i * 0.05, ease: 'easeOut' }}
                        >
                            {e}
                        </motion.span>
                    ))}
                    <motion.div
                        initial={{ rotateX: 60, opacity: 0, y: 40 }}
                        animate={{ rotateX: 0, opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                        style={{ transformPerspective: 800 }}
                        className="premium-card relative w-full max-w-sm p-8 text-center"
                    >
                        <div className="text-6xl">{celebrate.emoji}</div>
                        <h2 className="mt-3 text-2xl font-extrabold text-[var(--text-main)]">Done!</h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{celebrate.name}</p>
                        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-light)] px-3 py-1 font-mono text-sm font-bold text-[var(--brand)]">
                            <Clock className="h-3.5 w-3.5" /> {formatClock(celebrate.time)}
                        </p>
                        <div className="mt-6 flex gap-2">
                            <Link href="/kitchen" className="flex-1 rounded-xl border border-[var(--border-light)] py-2.5 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]">Kitchen</Link>
                            <Link href="/kitchen/recipes" className="flex-1 rounded-xl bg-[var(--brand)] py-2.5 text-sm font-bold text-black hover:bg-[var(--brand-hover)]">Next recipe</Link>
                        </div>
                    </motion.div>
                </div>
            </Shell>
        )
    }

    const headerActions = (
        <div className="flex shrink-0 items-center gap-2 print:hidden">
            {wake.supported && cooking && (
                <button
                    type="button"
                    onClick={() => setKeepAwake((v) => !v)}
                    aria-pressed={keepAwake}
                    title={wake.held ? 'Screen is kept awake' : 'Screen may sleep'}
                    className={`hidden items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-colors sm:flex ${wake.held ? 'border-[var(--brand)]/40 bg-[var(--brand-light)] text-[var(--brand)]' : 'border-[var(--border-light)] text-[var(--text-muted)]'}`}
                >
                    <Lightbulb className="h-3.5 w-3.5" /> {wake.held ? 'Awake' : 'Sleep ok'}
                </button>
            )}
            <button
                type="button"
                onClick={() => updateSettings({ autoStepTimers: !autoTimers })}
                aria-pressed={autoTimers}
                title={autoTimers ? 'Step timers start by themselves' : 'Tap a time to start a step timer'}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-colors ${autoTimers ? 'border-[var(--brand)]/40 bg-[var(--brand-light)] text-[var(--brand)]' : 'border-[var(--border-light)] text-[var(--text-muted)]'}`}
            >
                <TimerIcon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Auto timers</span> {autoTimers ? 'on' : 'off'}
            </button>
            {cooking && (
                <button type="button" onClick={finish} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-bold text-black shadow-md shadow-emerald-500/20 hover:bg-[var(--brand-hover)]">
                    Finish
                </button>
            )}
        </div>
    )

    const servingsControl = scalable && (
        <div className="flex items-center gap-1 rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] p-1 print:hidden">
            <button type="button" onClick={() => setServings((s) => Math.max(1, s - 1))} disabled={servings <= 1} aria-label="Fewer servings" className="grid h-7 w-7 place-items-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30">
                <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[64px] text-center text-[11px] font-bold tabular-nums text-[var(--text-main)]">{servings} serving{servings === 1 ? '' : 's'}</span>
            <button type="button" onClick={() => setServings((s) => Math.min(12, s + 1))} disabled={servings >= 12} aria-label="More servings" className="grid h-7 w-7 place-items-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30">
                <Plus className="h-3.5 w-3.5" />
            </button>
        </div>
    )

    return (
        <Shell
            title={recipe.name}
            subtitle={cooking ? `Step ${current + 1}/${steps.length} · ${formatClock(elapsed)}` : `${steps.length} steps${recipe.time ? ` · ${recipe.time}` : ''}`}
            actions={headerActions}
        >
            {!cooking ? (
                /* ── Overview ── */
                <div className="flex-1 overflow-y-auto hide-scrollbar">
                    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
                        <motion.div
                            initial={{ rotateX: -30, opacity: 0 }}
                            animate={{ rotateX: 0, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                            style={{ transformPerspective: 800 }}
                            className="premium-card flex items-center gap-4 p-5"
                        >
                            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[var(--bg-hover)] text-4xl">{recipe.emoji}</span>
                            <div className="min-w-0">
                                <h2 className="text-xl font-extrabold text-[var(--text-main)]">{recipe.name}</h2>
                                <p className="mt-1 flex flex-wrap gap-3 text-xs font-bold text-[var(--text-muted)]">
                                    {recipe.time && <span>⏱ {recipe.time}</span>}
                                    {recipe.calories ? <span>🔥 {recipe.calories} kcal</span> : null}
                                    <span>🧾 {recipe.ingredients.length} ingredients</span>
                                </p>
                            </div>
                        </motion.div>

                        <div className="premium-card p-5">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="k-label mb-0">Ingredients</p>
                                {servingsControl}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {ingredients.map((line, i) => (
                                    <span key={`${i}-${line}`} className="rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-[13px] text-[var(--text-main)]">{line}</span>
                                ))}
                            </div>
                        </div>

                        <div className="premium-card p-5">
                            <p className="k-label">Method</p>
                            <ol className="space-y-2">
                                {steps.map((step, i) => {
                                    const d = parseDurations(step)
                                    return (
                                        <li key={i} className="flex items-start gap-3 rounded-xl bg-[var(--bg-hover)]/40 p-2.5">
                                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--brand-light)] text-xs font-bold text-[var(--brand)]">{i + 1}</span>
                                            <span className="text-sm leading-relaxed text-[var(--text-main)]">
                                                {stepText(step)}
                                                {d.length > 0 && <span className="ml-1.5 inline-flex items-center gap-1 align-middle text-[10px] font-bold uppercase text-[var(--brand)]"><TimerIcon className="h-3 w-3" />{d.map((x) => x.label).join(' + ')}</span>}
                                            </span>
                                        </li>
                                    )
                                })}
                            </ol>
                        </div>

                        <motion.button
                            type="button"
                            onClick={start}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] py-4 text-base font-extrabold text-black shadow-lg shadow-emerald-500/25 transition-colors hover:bg-[var(--brand-hover)]"
                        >
                            <Play className="h-5 w-5 fill-current" /> Start cooking
                        </motion.button>
                        <p className="text-center text-[11px] text-[var(--text-muted)]">
                            {totalMinutes > 0 ? `A ${totalMinutes}-minute cooking timer starts with you` : 'The cooking clock starts with you'}
                            {autoTimers ? ', and each step’s timer starts when you reach it.' : '. Tap a time in a step to start its timer.'}
                        </p>
                    </div>
                </div>
            ) : (
                /* ── Cooking ── */
                <div className="flex-1 overflow-y-auto hide-scrollbar">
                    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
                        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
                            <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" animate={{ width: `${pct * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <div className="space-y-4 lg:col-span-2">
                                {/* Step card flips like a deck */}
                                <div className="k-stage relative min-h-[240px]">
                                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                                        <motion.div
                                            key={current}
                                            custom={direction}
                                            initial={{ rotateY: direction * 70, x: direction * 60, opacity: 0 }}
                                            animate={{ rotateY: 0, x: 0, opacity: 1 }}
                                            exit={{ rotateY: direction * -70, x: direction * -60, opacity: 0 }}
                                            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                                            className="premium-card p-6 sm:p-7"
                                        >
                                            <div className="mb-4 flex items-center gap-3">
                                                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand)] text-base font-extrabold text-black shadow-lg shadow-emerald-500/25">{current + 1}</span>
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">of {steps.length}</span>
                                            </div>
                                            <p className="text-lg leading-relaxed text-[var(--text-main)] sm:text-xl">{stepText(steps[current])}</p>

                                            {stepTimers.length > 0 && (
                                                <div className="mt-5 flex flex-wrap gap-2">
                                                    {stepTimers.map((d) => {
                                                        const t = timers.find((x) => x.ref === stepRef(current, d))
                                                        if (!t) {
                                                            return (
                                                                <button
                                                                    key={d.label}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        startStepTimer(current, d)
                                                                        toast(`Timer running: ${d.label}`, { type: 'info' })
                                                                    }}
                                                                    className="flex items-center gap-1.5 rounded-xl bg-[var(--brand-light)] px-3.5 py-2 text-sm font-bold text-[var(--brand)] transition-all hover:bg-[var(--brand)] hover:text-black active:scale-95"
                                                                >
                                                                    <Play className="h-4 w-4 fill-current" /> Start {d.label}
                                                                </button>
                                                            )
                                                        }
                                                        const isDone = t.state === 'done'
                                                        return (
                                                            <div
                                                                key={d.label}
                                                                className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${isDone ? 'border-rose-400/40 bg-rose-500/10' : 'border-[var(--brand)]/30 bg-[var(--brand-light)]'}`}
                                                            >
                                                                <ProgressRing value={isDone ? 1 : t.progress} size={40} stroke={4} color={isDone ? '#f43f5e' : 'var(--brand)'} />
                                                                <span>
                                                                    <span className={`block font-mono text-xl font-extrabold tabular-nums ${isDone ? 'text-rose-400' : 'text-[var(--text-main)]'}`} aria-live="polite">
                                                                        {isDone ? "Time's up" : formatClock(t.remaining)}
                                                                    </span>
                                                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                                                        {d.label}{t.state === 'paused' ? ' · paused' : ''}
                                                                    </span>
                                                                </span>
                                                                {isDone ? (
                                                                    <button type="button" onClick={() => { removeTimer(t.id); startStepTimer(current, d) }} aria-label={`Restart ${d.label} timer`} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]">
                                                                        <RotateCcw className="h-4 w-4" />
                                                                    </button>
                                                                ) : (
                                                                    <button type="button" onClick={() => (t.state === 'running' ? pauseTimer(t.id) : resumeTimer(t.id))} aria-label={t.state === 'running' ? `Pause ${d.label} timer` : `Resume ${d.label} timer`} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]">
                                                                        {t.state === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            <div className="mt-6 flex items-center justify-between gap-2">
                                                <button type="button" onClick={() => goTo(current - 1)} disabled={current === 0} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30">
                                                    <ArrowLeft className="h-4 w-4" /> Back
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleDone(current)}
                                                    className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-all active:scale-95 ${done.has(current) ? 'bg-[var(--brand)] text-black' : 'border border-[var(--border-light)] bg-[var(--bg-hover)] text-[var(--text-main)] hover:border-[var(--brand)]'}`}
                                                >
                                                    <Check className="h-4 w-4" /> {done.has(current) ? 'Done' : 'Mark done'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={next}
                                                    disabled={!canNext}
                                                    title={!isLast && !canNext ? 'Finish the timer or mark this step done first' : undefined}
                                                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${canNext ? 'text-[var(--brand)] hover:bg-[var(--brand-light)]' : 'text-[var(--text-muted)]'}`}
                                                >
                                                    {!isLast && !canNext && <Lock className="h-3.5 w-3.5" />} Next <ArrowRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                            {!isLast && !canNext && (
                                                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] font-semibold text-[var(--text-muted)]" aria-live="polite">
                                                    <Lock className="h-3 w-3" />
                                                    {stepTimers.length
                                                        ? 'Next unlocks when the timer finishes, or tap Mark done.'
                                                        : 'Tap Mark done when this step is finished to unlock Next.'}
                                                </p>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar" role="tablist" aria-label="Steps">
                                    {steps.map((step, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            role="tab"
                                            aria-selected={i === current}
                                            onClick={() => goTo(i)}
                                            disabled={!canReach(i)}
                                            title={canReach(i) ? stepText(step) : 'Finish the steps before this one first'}
                                            className={`grid h-9 min-w-9 shrink-0 place-items-center rounded-xl text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-35 ${i === current ? 'scale-110 bg-[var(--brand)] text-black shadow-md' : stepComplete(i) ? 'bg-[var(--brand-light)] text-[var(--brand)]' : 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] enabled:hover:border-[var(--brand)]'}`}
                                        >
                                            {stepComplete(i) && i !== current ? <Check className="h-3.5 w-3.5" /> : !canReach(i) ? <Lock className="h-3 w-3" /> : i + 1}
                                        </button>
                                    ))}
                                </div>
                                <p className="hidden text-[11px] text-[var(--text-muted)] sm:block">← → to move · space to tick</p>
                            </div>

                            <div className="space-y-4">
                                {/* Cooking clock: time since Start, and the whole-recipe countdown. */}
                                <div className="premium-card flex items-center gap-4 p-5">
                                    <ProgressRing
                                        value={totalTimer ? (totalTimer.state === 'done' ? 1 : totalTimer.progress) : pct}
                                        size={76}
                                        stroke={7}
                                        color={totalTimer?.state === 'done' ? '#f43f5e' : 'var(--brand)'}
                                        label="Cooking progress"
                                    >
                                        <Clock className="h-5 w-5 text-[var(--brand)]" />
                                    </ProgressRing>
                                    <div className="min-w-0">
                                        <p className="k-label mb-0.5">Cooking for</p>
                                        <p className="font-mono text-2xl font-extrabold tabular-nums text-[var(--text-main)]">{formatClock(elapsed)}</p>
                                        {totalTimer ? (
                                            <p className={`flex items-center gap-1.5 text-[12px] font-bold ${totalTimer.state === 'done' ? 'text-rose-400' : 'text-[var(--text-muted)]'}`}>
                                                {totalTimer.state === 'done' ? 'Should be ready now 🍽️' : `Ready in ${formatClock(totalTimer.remaining)}${totalTimer.state === 'paused' ? ' (paused)' : ''}`}
                                                {totalTimer.state !== 'done' && (
                                                    <button type="button" onClick={() => (totalTimer.state === 'running' ? pauseTimer(totalTimer.id) : resumeTimer(totalTimer.id))} aria-label={totalTimer.state === 'running' ? 'Pause cooking timer' : 'Resume cooking timer'} className="rounded p-0.5 hover:text-[var(--text-main)]">
                                                        {totalTimer.state === 'running' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                                    </button>
                                                )}
                                            </p>
                                        ) : (
                                            <p className="text-[12px] text-[var(--text-muted)]">{done.size} of {steps.length} steps done</p>
                                        )}
                                    </div>
                                </div>

                                <div className="premium-card p-5">
                                    <p className="k-label">Timers</p>
                                    {timers.length === 0 ? (
                                        <p className="text-xs text-[var(--text-muted)]">Tap a time in any step.</p>
                                    ) : (
                                        <ul className="space-y-2.5">
                                            {timers.slice(0, 4).map((t) => {
                                                const isDone = t.state === 'done'
                                                return (
                                                    <li key={t.id} className="flex items-center gap-3">
                                                        <ProgressRing value={isDone ? 1 : t.progress} size={44} stroke={5} color={isDone ? '#f43f5e' : 'var(--brand)'} />
                                                        <span className="min-w-0 flex-1">
                                                            <span className={`block font-mono text-base font-bold tabular-nums ${isDone ? 'text-rose-400' : 'text-[var(--text-main)]'}`}>{isDone ? "Time's up" : formatClock(t.remaining)}</span>
                                                            <span className="block truncate text-[11px] text-[var(--text-muted)]">{t.label}</span>
                                                        </span>
                                                        {!isDone && (
                                                            <button type="button" onClick={() => (t.state === 'running' ? pauseTimer(t.id) : resumeTimer(t.id))} aria-label="Pause or resume" className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]">
                                                                {t.state === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                            </button>
                                                        )}
                                                        <button type="button" onClick={() => removeTimer(t.id)} aria-label="Remove timer" className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-rose-400">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    )}
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {[1, 3, 5, 10, 15].map((m) => (
                                            <button key={m} type="button" onClick={() => addTimer({ label: `${m} min`, emoji: recipe.emoji, minutes: m, source: 'cook' })} className="rounded-lg bg-[var(--bg-hover)] px-2.5 py-1 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--brand)]">
                                                {m}m
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="premium-card p-5">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <p className="k-label mb-0">Ingredients</p>
                                        {servingsControl}
                                    </div>
                                    <ul className="space-y-1">
                                        {ingredients.map((line, i) => (
                                            <li key={`${i}-${line}`} className="flex items-center gap-2 text-[13px] text-[var(--text-main)]">
                                                <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--brand)]" /> {line}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button type="button" onClick={startOver} className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-[var(--text-muted)] hover:text-rose-400">
                                    <RotateCcw className="h-3.5 w-3.5" /> Start over
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Shell>
    )
}

function Shell({ title, subtitle, actions, children }) {
    return (
        <div className="flex h-dvh w-full flex-col overflow-hidden">
            <header className="flex min-h-[64px] shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-6 md:px-8">
                <div className="flex min-w-0 items-center gap-3">
                    <MobileMenuButton />
                    <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20 xs:grid">
                        <ChefHat className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-base font-extrabold text-[var(--text-main)] sm:text-lg">{title}</h1>
                        {subtitle && <p className="font-mono text-[11px] text-[var(--text-muted)]">{subtitle}</p>}
                    </div>
                </div>
                {actions}
            </header>
            {children}
        </div>
    )
}
