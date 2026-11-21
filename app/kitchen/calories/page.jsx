"use client"

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ChevronLeft, ChevronRight, Sparkles, Loader2, Target, Flame, X } from 'lucide-react'
import MobileMenuButton from '@/components/Layout/MobileMenuButton'
import ProgressRing from '@/components/ui/ProgressRing'
import Modal from '@/components/ui/Modal'
import { useKitchenData } from '@/context/KitchenDataContext'
import { useToast } from '@/components/ui/Toaster'
import { sendChatMessage } from '@/utils/api'
import { useGuestQuota, isGuestLimitError } from '@/lib/guestQuota'
import { addDays, parseDateKey } from '@/lib/date'

const QUICK = [
    { name: 'Apple', emoji: '🍎', calories: 95 },
    { name: 'Banana', emoji: '🍌', calories: 105 },
    { name: 'Coffee', emoji: '☕', calories: 5 },
    { name: 'Egg', emoji: '🥚', calories: 78 },
    { name: 'Rice bowl', emoji: '🍚', calories: 206 },
    { name: 'Chicken', emoji: '🍗', calories: 165 },
    { name: 'Salad', emoji: '🥗', calories: 150 },
    { name: 'Milk', emoji: '🥛', calories: 149 },
]

const GOALS = [1500, 1800, 2000, 2200, 2500]

export default function CaloriesPage() {
    const toast = useToast()
    const quota = useGuestQuota()
    const { today, caloriesFor, totalFor, addCalorieEntry, removeCalorieEntry, settings, updateSettings } = useKitchenData()

    const [offset, setOffset] = useState(0)
    const [showAdd, setShowAdd] = useState(false)
    const [showGoal, setShowGoal] = useState(false)
    const [form, setForm] = useState({ name: '', portion: '', calories: '' })
    const [estimating, setEstimating] = useState(false)

    const selected = today ? addDays(today, offset) : null
    const entries = selected ? caloriesFor(selected) : []
    const total = selected ? totalFor(selected) : 0
    const goal = settings.dailyCalorieGoal || 2000
    const remaining = goal - total

    const week = useMemo(() => {
        if (!today) return []
        return Array.from({ length: 7 }, (_, i) => {
            const key = addDays(today, i - 6)
            return { key, kcal: totalFor(key), label: parseDateKey(key).toLocaleDateString(undefined, { weekday: 'short' }) }
        })
    }, [today, totalFor])
    const maxWeek = Math.max(goal, ...week.map((d) => d.kcal))
    const avg = week.length ? Math.round(week.reduce((s, d) => s + d.kcal, 0) / week.filter((d) => d.kcal).length || 0) : 0

    const dateLabel = !selected
        ? ''
        : offset === 0
            ? 'Today'
            : offset === -1
                ? 'Yesterday'
                : parseDateKey(selected).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

    const quickAdd = (f) => {
        addCalorieEntry({ name: f.name, calories: f.calories }, selected)
        toast(`${f.emoji} ${f.name} · ${f.calories} kcal`)
    }

    const estimate = async () => {
        if (!form.name.trim() || estimating || !quota.guard()) return
        setEstimating(true)
        try {
            const res = await sendChatMessage(form.name.trim(), [], { mode: 'estimate', portion: form.portion })
            quota.record(res.quota)
            if (res.success) {
                setForm((f) => ({ ...f, calories: String(res.calories) }))
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

    const submit = (e) => {
        e.preventDefault()
        const n = parseInt(form.calories, 10)
        if (!form.name.trim() || !(n > 0)) return
        addCalorieEntry({ name: form.name, calories: n, portion: form.portion.trim() || '1 serving' }, selected)
        setForm({ name: '', portion: '', calories: '' })
        setShowAdd(false)
    }

    return (
        <div className="flex h-dvh w-full flex-col overflow-hidden">
            <header className="flex min-h-[64px] shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-6 md:px-10">
                <div className="flex min-w-0 items-center gap-3">
                    <MobileMenuButton />
                    <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/20 xs:grid">
                        <Flame className="h-5 w-5" />
                    </div>
                    <h1 className="text-lg font-extrabold text-[var(--text-main)]">Calories</h1>
                </div>
                <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
                    <button type="button" onClick={() => setOffset((o) => o - 1)} aria-label="Previous day" className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-[96px] text-center text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-main)]">{dateLabel}</span>
                    <button type="button" onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset >= 0} aria-label="Next day" className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] disabled:opacity-30">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain py-6 elegant-scrollbar sm:py-8">
                <div className="mx-auto grid max-w-4xl grid-cols-1 items-start gap-6 px-4 sm:px-6 md:px-10 lg:grid-cols-2">
                    <div className="space-y-6">
                        {/* Ring */}
                        <motion.div
                            initial={{ opacity: 0, rotateX: -20, y: 20 }}
                            animate={{ opacity: 1, rotateX: 0, y: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                            style={{ transformPerspective: 900 }}
                            className="premium-card relative overflow-hidden p-6 text-center"
                        >
                            <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[var(--brand)]/15 blur-3xl" />
                            <ProgressRing value={total / goal} size={168} stroke={12} className="mx-auto" label={`${total} of ${goal} calories`}>
                                <motion.span key={total} initial={{ scale: 1.25, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className={`text-3xl font-extrabold tabular-nums ${remaining < 0 ? 'text-rose-400' : 'text-[var(--text-main)]'}`}>
                                    {total.toLocaleString()}
                                </motion.span>
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">kcal</span>
                            </ProgressRing>
                            <div className="mt-5 grid grid-cols-3 divide-x divide-[var(--border)]">
                                <Stat value={goal} label="Goal" />
                                <Stat value={Math.abs(remaining)} label={remaining < 0 ? 'Over' : 'Left'} tone={remaining < 0 ? 'text-rose-400' : 'text-[var(--brand)]'} />
                                <Stat value={avg || '—'} label="7-day avg" />
                            </div>
                            <button type="button" onClick={() => setShowGoal(true)} className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] transition-colors hover:text-[var(--brand)]">
                                <Target className="h-3.5 w-3.5" /> Change goal
                            </button>
                        </motion.div>

                        {/* 7-day bars against the goal line */}
                        <div className="premium-card p-5">
                            <p className="k-label">Last 7 days</p>
                            <div className="relative flex h-32 items-end gap-2">
                                <span className="absolute inset-x-0 border-t border-dashed border-[var(--brand)]/50" style={{ bottom: `${(goal / maxWeek) * 100}%` }} />
                                {week.map((d, i) => {
                                    const isSel = d.key === selected
                                    return (
                                        <button key={d.key} type="button" onClick={() => setOffset(i - 6)} className="group flex h-full flex-1 flex-col justify-end" aria-label={`${d.label}: ${d.kcal} kcal`}>
                                            <span className="mb-1 text-center text-[9px] font-bold text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100">{d.kcal || ''}</span>
                                            <motion.span
                                                initial={{ height: 0 }}
                                                animate={{ height: `${Math.max(d.kcal ? 5 : 2, (d.kcal / maxWeek) * 100)}%` }}
                                                transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.05 }}
                                                className={`block w-full rounded-t-lg ${isSel ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/25' : d.kcal > goal ? 'bg-rose-400/60' : 'bg-[var(--border-light)] group-hover:bg-[var(--brand)]/50'}`}
                                            />
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="mt-2 flex gap-2">
                                {week.map((d) => (
                                    <span key={d.key} className={`flex-1 text-center text-[9px] font-extrabold uppercase ${d.key === selected ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`}>{d.label.slice(0, 2)}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="premium-card p-5">
                            <p className="k-label">Quick add</p>
                            <div className="grid grid-cols-4 gap-2">
                                {QUICK.map((f, i) => (
                                    <motion.button
                                        key={f.name}
                                        type="button"
                                        onClick={() => quickAdd(f)}
                                        initial={{ opacity: 0, rotateY: 90 }}
                                        animate={{ opacity: 1, rotateY: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        whileHover={{ y: -3 }}
                                        whileTap={{ scale: 0.9 }}
                                        style={{ transformPerspective: 500 }}
                                        className="flex flex-col items-center rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-2 transition-colors hover:border-[var(--brand)]"
                                    >
                                        <span className="text-xl">{f.emoji}</span>
                                        <span className="mt-1 w-full truncate text-[10px] font-bold text-[var(--text-main)]">{f.name}</span>
                                        <span className="text-[9px] font-bold text-[var(--brand)]">{f.calories}</span>
                                    </motion.button>
                                ))}
                            </div>
                            <button type="button" onClick={() => setShowAdd(true)} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] py-3 text-xs font-extrabold uppercase tracking-wider text-black shadow-md shadow-emerald-500/15 transition-all hover:bg-[var(--brand-hover)] active:scale-[0.98]">
                                <Plus className="h-4 w-4" /> Log food
                            </button>
                        </div>

                        <div className="premium-card p-5">
                            <p className="k-label">{dateLabel}&apos;s log</p>
                            {entries.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-[var(--border-light)] py-6 text-center text-[11px] text-[var(--text-muted)]">Nothing logged</p>
                            ) : (
                                <ul className="max-h-[300px] space-y-1.5 overflow-y-auto pr-1 elegant-scrollbar">
                                    <AnimatePresence initial={false}>
                                        {entries.map((e) => (
                                            <motion.li
                                                key={e.id}
                                                layout
                                                initial={{ opacity: 0, x: -12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="group flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5"
                                            >
                                                <span className="min-w-0 pr-3">
                                                    <span className="block truncate text-[13px] font-bold text-[var(--text-main)]">{e.name}</span>
                                                    <span className="block text-[10px] font-semibold text-[var(--text-muted)]">{[e.portion, e.time].filter(Boolean).join(' · ')}</span>
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    <span className="text-sm font-extrabold text-[var(--brand)]">{e.calories}</span>
                                                    <button type="button" onClick={() => removeCalorieEntry(e.id, selected)} aria-label={`Delete ${e.name}`} className="rounded-lg p-1.5 text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-rose-500/10 hover:text-rose-400 focus-visible:opacity-100 group-hover:opacity-100">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log food">
                <form onSubmit={submit} className="space-y-2.5">
                    <Field value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="What did you eat?" autoFocus />
                    <Field value={form.portion} onChange={(v) => setForm((f) => ({ ...f, portion: v }))} placeholder="Portion (e.g. 1 cup)" />
                    <div className="flex gap-2">
                        <Field value={form.calories} onChange={(v) => setForm((f) => ({ ...f, calories: v.replace(/\D/g, '') }))} placeholder="kcal" inputMode="numeric" />
                        <button type="button" onClick={estimate} disabled={!form.name.trim() || estimating} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--brand-light)] px-4 text-sm font-bold text-[var(--brand)] transition-colors hover:bg-[var(--brand)] hover:text-black disabled:opacity-40">
                            {estimating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} AI
                        </button>
                    </div>
                    <button type="submit" disabled={!form.name.trim() || !form.calories} className="w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-black transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-40">
                        Add
                    </button>
                </form>
            </Modal>

            <Modal open={showGoal} onClose={() => setShowGoal(false)} title="Daily goal">
                <div className="grid grid-cols-5 gap-2">
                    {GOALS.map((g) => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => {
                                updateSettings({ dailyCalorieGoal: g })
                                setShowGoal(false)
                            }}
                            className={`rounded-xl py-3 text-xs font-bold transition-all active:scale-95 ${goal === g ? 'bg-[var(--brand)] text-black' : 'bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
                <form
                    className="mt-3 flex gap-2"
                    onSubmit={(e) => {
                        e.preventDefault()
                        const n = parseInt(new FormData(e.currentTarget).get('goal'), 10)
                        if (n >= 800 && n <= 6000) {
                            updateSettings({ dailyCalorieGoal: n })
                            setShowGoal(false)
                        }
                    }}
                >
                    <input name="goal" inputMode="numeric" placeholder="Custom (800–6000)" className="flex-1 rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--brand)]" />
                    <button type="submit" className="rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-black">Set</button>
                </form>
            </Modal>
        </div>
    )
}

function Stat({ value, label, tone = 'text-[var(--text-main)]' }) {
    return (
        <div>
            <p className={`text-base font-extrabold tabular-nums ${tone}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
        </div>
    )
}

function Field({ value, onChange, ...rest }) {
    return (
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] p-3 text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]"
            {...rest}
        />
    )
}
