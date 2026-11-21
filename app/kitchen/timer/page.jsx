"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Plus, Play, Pause, RotateCcw, X, BellRing } from 'lucide-react'
import MobileMenuButton from '@/components/Layout/MobileMenuButton'
import ProgressRing from '@/components/ui/ProgressRing'
import Modal from '@/components/ui/Modal'
import { useTimers, formatClock } from '@/context/TimersContext'

const PRESETS = [
    { label: 'Soft egg', emoji: '🥚', minutes: 6 },
    { label: 'Pasta', emoji: '🍝', minutes: 10 },
    { label: 'Rice', emoji: '🍚', minutes: 18 },
    { label: 'Salmon', emoji: '🐟', minutes: 12 },
    { label: 'Tea', emoji: '🍵', minutes: 4 },
    { label: 'Stir fry', emoji: '🍳', minutes: 5 },
    { label: 'Bread', emoji: '🍞', minutes: 35 },
    { label: 'Simmer', emoji: '🫕', minutes: 45 },
]

export default function TimerPage() {
    const { timers, running, addTimer, pauseTimer, resumeTimer, resetTimer, removeTimer, clearDone } = useTimers()
    const [showCustom, setShowCustom] = useState(false)
    const [custom, setCustom] = useState({ label: '', minutes: '', seconds: '' })
    const doneCount = timers.filter((t) => t.state === 'done').length

    const submitCustom = (e) => {
        e.preventDefault()
        const id = addTimer({
            label: custom.label.trim() || undefined,
            minutes: parseInt(custom.minutes || '0', 10),
            seconds: parseInt(custom.seconds || '0', 10),
        })
        if (id) {
            setCustom({ label: '', minutes: '', seconds: '' })
            setShowCustom(false)
        }
    }

    return (
        <div className="flex h-dvh w-full flex-col overflow-hidden">
            <header className="flex min-h-[64px] shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-6 md:px-10">
                <div className="flex min-w-0 items-center gap-3">
                    <MobileMenuButton />
                    <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20 xs:grid">
                        <Timer className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold text-[var(--text-main)]">Timers</h1>
                        {running.length > 0 && <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--brand)]"><span className="k-live" /> {running.length} running</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {doneCount > 0 && (
                        <button type="button" onClick={clearDone} className="rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]">
                            Clear done
                        </button>
                    )}
                    <button type="button" onClick={() => setShowCustom(true)} className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-bold text-black shadow-md shadow-emerald-500/20 transition-all hover:bg-[var(--brand-hover)] active:scale-[0.98]">
                        <Plus className="h-3.5 w-3.5" /> Custom
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain py-6 elegant-scrollbar sm:py-8">
                <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 md:px-10">
                    {timers.length > 0 && (
                        <div className="k-stage grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <AnimatePresence initial={false}>
                                {timers.map((t) => {
                                    const done = t.state === 'done'
                                    const isRunning = t.state === 'running'
                                    return (
                                        <motion.div
                                            key={t.id}
                                            layout
                                            initial={{ opacity: 0, rotateY: -60, scale: 0.9 }}
                                            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                                            exit={{ opacity: 0, rotateY: 60, scale: 0.9 }}
                                            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                                            className={`premium-card relative flex flex-col items-center p-5 ${done ? 'border-rose-400/60 shadow-lg shadow-rose-500/10' : isRunning ? 'border-[var(--brand)]/50' : ''}`}
                                        >
                                            <button type="button" onClick={() => removeTimer(t.id)} aria-label={`Remove ${t.label}`} className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-rose-400">
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                            <p className="mb-3 max-w-[80%] truncate text-[13px] font-bold text-[var(--text-main)]">{t.emoji} {t.label}</p>
                                            <ProgressRing value={done ? 1 : t.progress} size={150} stroke={10} color={done ? '#f43f5e' : 'var(--brand)'} label={`${t.label}: ${formatClock(t.remaining)} left`}>
                                                {done ? (
                                                    <motion.span animate={{ rotate: [0, -15, 15, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 1.2, repeatDelay: 0.6 }}>
                                                        <BellRing className="h-9 w-9 text-rose-400" />
                                                    </motion.span>
                                                ) : (
                                                    <span className={`font-mono text-3xl font-extrabold tabular-nums ${isRunning ? 'text-[var(--brand)]' : 'text-[var(--text-main)]'}`}>{formatClock(t.remaining)}</span>
                                                )}
                                            </ProgressRing>
                                            <div className="mt-4 flex w-full gap-2">
                                                {done ? (
                                                    <button type="button" onClick={() => resetTimer(t.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--bg-hover)] py-2.5 text-xs font-bold text-[var(--text-main)]">
                                                        <RotateCcw className="h-3.5 w-3.5" /> Again
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => (isRunning ? pauseTimer(t.id) : resumeTimer(t.id))}
                                                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-colors ${isRunning ? 'bg-[var(--brand-light)] text-[var(--brand)]' : 'bg-[var(--brand)] text-black hover:bg-[var(--brand-hover)]'}`}
                                                        >
                                                            {isRunning ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5 fill-current" /> Start</>}
                                                        </button>
                                                        <button type="button" onClick={() => resetTimer(t.id)} aria-label="Reset" className="rounded-xl bg-[var(--bg-hover)] px-3 text-[var(--text-muted)] hover:text-[var(--text-main)]">
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                    )}

                    <section>
                        <p className="k-label">{timers.length ? 'Add another' : 'Tap to start'}</p>
                        <div className="k-stage grid grid-cols-4 gap-3">
                            {PRESETS.map((p, i) => (
                                <motion.button
                                    key={p.label}
                                    type="button"
                                    onClick={() => addTimer({ label: p.label, emoji: p.emoji, minutes: p.minutes })}
                                    initial={{ opacity: 0, rotateX: -60, y: 20 }}
                                    animate={{ opacity: 1, rotateX: 0, y: 0 }}
                                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 240, damping: 22 }}
                                    whileHover={{ y: -4, rotateX: 8 }}
                                    whileTap={{ scale: 0.92 }}
                                    className="premium-card group flex flex-col items-center px-2 py-4"
                                >
                                    <span className="text-2xl transition-transform group-hover:scale-125 sm:text-3xl">{p.emoji}</span>
                                    <span className="mt-1.5 w-full truncate text-center text-[11px] font-bold text-[var(--text-main)] sm:text-xs">{p.label}</span>
                                    <span className="mt-1 rounded-md bg-[var(--brand-light)] px-1.5 py-0.5 text-[10px] font-extrabold text-[var(--brand)]">{p.minutes}m</span>
                                </motion.button>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            <Modal open={showCustom} onClose={() => setShowCustom(false)} title="Custom timer">
                <form onSubmit={submitCustom} className="space-y-3">
                    <input
                        value={custom.label}
                        onChange={(e) => setCustom((c) => ({ ...c, label: e.target.value }))}
                        placeholder="Label (optional)"
                        className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] p-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--brand)]"
                    />
                    <div className="flex gap-2">
                        {['minutes', 'seconds'].map((k) => (
                            <label key={k} className="flex-1">
                                <span className="sr-only">{k}</span>
                                <input
                                    value={custom[k]}
                                    onChange={(e) => setCustom((c) => ({ ...c, [k]: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                                    inputMode="numeric"
                                    placeholder={k === 'minutes' ? 'Min' : 'Sec'}
                                    className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] p-3 text-center font-mono text-lg font-bold text-[var(--text-main)] outline-none focus:border-[var(--brand)]"
                                />
                            </label>
                        ))}
                    </div>
                    <button type="submit" disabled={!(parseInt(custom.minutes || '0', 10) || parseInt(custom.seconds || '0', 10))} className="w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-black transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-40">
                        Start timer
                    </button>
                </form>
            </Modal>
        </div>
    )
}
