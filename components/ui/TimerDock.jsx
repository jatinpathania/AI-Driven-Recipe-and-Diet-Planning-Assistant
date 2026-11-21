"use client"

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, X } from 'lucide-react'
import { useTimers, formatClock } from '@/context/TimersContext'
import ProgressRing from '@/components/ui/ProgressRing'

/**
 * Running timers follow you around the kitchen. Hidden on the Timer page
 * (which shows them in full) and in cook mode (which has its own panel).
 */
export default function TimerDock() {
    const pathname = usePathname()
    const router = useRouter()
    const { timers, pauseTimer, resumeTimer, removeTimer } = useTimers()

    const hidden = pathname === '/kitchen/timer' || pathname === '/kitchen/cook'
    const shown = hidden ? [] : timers.filter((t) => t.state !== 'paused' || t.remaining < t.totalMs / 1000).slice(0, 3)

    return (
        <div className="pointer-events-none fixed bottom-4 left-4 z-[110] flex flex-col gap-2 md:left-[calc(var(--sidebar-w,260px)+16px)]">
            <AnimatePresence initial={false}>
                {shown.map((t) => {
                    const done = t.state === 'done'
                    return (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, x: -30, rotateY: -40 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                            exit={{ opacity: 0, x: -30, rotateY: 40 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                            style={{ transformPerspective: 600 }}
                            className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl border bg-[var(--bg-card)]/95 py-1.5 pl-1.5 pr-2 shadow-xl backdrop-blur-xl ${done ? 'border-rose-400/60 animate-pulse' : 'border-[var(--border-light)]'}`}
                        >
                            <button type="button" onClick={() => router.push('/kitchen/timer')} className="flex items-center gap-2.5" aria-label={`Open timers — ${t.label}`}>
                                <ProgressRing value={done ? 1 : t.progress} size={36} stroke={4} color={done ? '#f43f5e' : 'var(--brand)'}>
                                    <span className="text-xs">{t.emoji}</span>
                                </ProgressRing>
                                <span className="text-left">
                                    <span className="block max-w-[120px] truncate text-[11px] font-semibold text-[var(--text-muted)]">{t.label}</span>
                                    <span className={`block font-mono text-sm font-bold tabular-nums ${done ? 'text-rose-400' : 'text-[var(--text-main)]'}`}>
                                        {done ? "Time's up" : formatClock(t.remaining)}
                                    </span>
                                </span>
                            </button>
                            {!done && (
                                <button
                                    type="button"
                                    onClick={() => (t.state === 'running' ? pauseTimer(t.id) : resumeTimer(t.id))}
                                    aria-label={t.state === 'running' ? 'Pause timer' : 'Resume timer'}
                                    className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]"
                                >
                                    {t.state === 'running' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => removeTimer(t.id)}
                                aria-label="Dismiss timer"
                                className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-rose-400"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
