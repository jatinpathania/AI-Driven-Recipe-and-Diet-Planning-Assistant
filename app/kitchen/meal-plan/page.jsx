"use client"

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, ChevronLeft, ChevronRight, Loader2, Trash2, Calendar, Wand2, ShoppingCart, Flame } from 'lucide-react'
import MobileMenuButton from '@/components/Layout/MobileMenuButton'
import { useKitchenData, MEAL_SLOTS, SLOT_EMOJI } from '@/context/KitchenDataContext'
import { useToast } from '@/components/ui/Toaster'
import ProgressRing from '@/components/ui/ProgressRing'
import Tilt from '@/components/ui/Tilt'
import { sendChatMessage } from '@/utils/api'
import { useGuestQuota, isGuestLimitError } from '@/lib/guestQuota'
import { weekKeys, parseDateKey, dayName } from '@/lib/date'

const totalKcal = (day) => MEAL_SLOTS.reduce((s, slot) => s + (day[slot] || []).reduce((n, m) => n + (m.calories || 0), 0), 0)
const countMeals = (day) => MEAL_SLOTS.reduce((s, slot) => s + (day[slot]?.length || 0), 0)

export default function MealPlanPage() {
    const router = useRouter()
    const toast = useToast()
    const quota = useGuestQuota()
    const { today, mealsFor, addMeal, addMeals, removeMeal, toggleMeal, ingredientsForDays, addShoppingItems, settings } = useKitchenData()

    const [weekOffset, setWeekOffset] = useState(0)
    const [picked, setPicked] = useState(null)
    const [filling, setFilling] = useState(false)

    const week = useMemo(() => (today ? weekKeys(weekOffset, today) : []), [today, weekOffset])
    // Default selection: today on this week, Monday on any other.
    const selected = picked && week.includes(picked) ? picked : week.includes(today) ? today : week[0]
    const day = selected ? mealsFor(selected) : {}

    const stats = useMemo(() => {
        const days = week.map((k) => mealsFor(k))
        const all = days.flatMap((d) => MEAL_SLOTS.flatMap((s) => d[s] || []))
        return {
            total: all.length,
            done: all.filter((m) => m.completed).length,
            kcal: days.map(totalKcal),
        }
    }, [week, mealsFor])

    const goal = settings.dailyCalorieGoal || 2000
    const maxKcal = Math.max(goal, ...stats.kcal)

    const label = week.length
        ? `${parseDateKey(week[0]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${parseDateKey(week[6]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
        : ''

    const fillDay = async () => {
        if (!selected || filling || !quota.guard()) return
        setFilling(true)
        try {
            const res = await sendChatMessage(dayName(selected), [], { mode: 'plan' })
            quota.record(res.quota)
            if (res.success && res.meals) {
                // Only fill the empty slots; never overwrite what the user planned.
                const empty = Object.fromEntries(Object.entries(res.meals).filter(([slot]) => !(day[slot]?.length)))
                addMeals(selected, empty)
                const n = Object.keys(empty).length
                toast(n ? `Planned ${n} meal${n === 1 ? '' : 's'} for ${dayName(selected)}` : `${dayName(selected)} was already full`, { type: n ? 'success' : 'info' })
            } else {
                toast(res.message || 'Could not plan that day', { type: 'error' })
            }
        } catch (err) {
            if (isGuestLimitError(err)) quota.exhaust()
            else {
                quota.record(err?.data?.quota)
                toast(err.message, { type: 'error' })
            }
        } finally {
            setFilling(false)
        }
    }

    const shopWeek = () => {
        const { ingredients, meals, matched } = ingredientsForDays(week)
        if (!meals) return toast('Nothing planned this week yet', { type: 'info' })
        if (!ingredients.length) return toast('No saved recipes match these meals', { type: 'info' })
        const added = addShoppingItems(ingredients, 'Meal plan')
        toast(added ? `${added} items from ${matched} meal${matched === 1 ? '' : 's'} added` : 'Already on your list', {
            type: added ? 'success' : 'info',
            action: { label: 'Open', onClick: () => router.push('/kitchen/shopping') },
        })
    }

    return (
        <div className="flex h-dvh w-full flex-col overflow-hidden">
            <header className="flex min-h-[64px] shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-6 md:px-10">
                <div className="flex min-w-0 items-center gap-3">
                    <MobileMenuButton />
                    <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 xs:grid">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <h1 className="text-lg font-extrabold text-[var(--text-main)]">Meal Plan</h1>
                </div>
                <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
                    <button type="button" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week" className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setWeekOffset(0)} className="min-w-[118px] text-center text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-main)]" title="Back to this week">
                        {weekOffset === 0 ? 'This week' : label}
                    </button>
                    <button type="button" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week" className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain py-6 elegant-scrollbar">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-10">
                    {/* Week strip: 3D day tiles with a kcal bar */}
                    <div className="k-stage mb-8 grid grid-cols-7 gap-1.5 sm:gap-2.5">
                        {week.map((k, i) => {
                            const d = parseDateKey(k)
                            const isSel = k === selected
                            const isToday = k === today
                            const meals = countMeals(mealsFor(k))
                            return (
                                <motion.button
                                    key={k}
                                    type="button"
                                    onClick={() => setPicked(k)}
                                    initial={{ opacity: 0, rotateY: -70, y: 10 }}
                                    animate={{ opacity: 1, rotateY: 0, y: isSel ? -6 : 0, scale: isSel ? 1.05 : 1 }}
                                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
                                    aria-pressed={isSel}
                                    className={`relative flex flex-col items-center overflow-hidden rounded-2xl border px-1 pb-2 pt-2.5 transition-colors ${isSel ? 'border-[var(--brand)] bg-[var(--brand)] text-black shadow-xl shadow-emerald-500/25' : isToday ? 'border-[var(--brand)]/50 bg-[var(--brand-light)] text-[var(--brand)]' : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--border-light)]'}`}
                                >
                                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                                    <span className="text-lg font-extrabold leading-tight sm:text-xl">{d.getDate()}</span>
                                    <span className="mt-1 flex gap-0.5" aria-label={`${meals} meals`}>
                                        {MEAL_SLOTS.map((s, j) => (
                                            <span key={s} className={`h-1 w-1 rounded-full sm:w-1.5 ${j < meals ? (isSel ? 'bg-black/70' : 'bg-[var(--brand)]') : isSel ? 'bg-black/20' : 'bg-[var(--border-light)]'}`} />
                                        ))}
                                    </span>
                                </motion.button>
                            )
                        })}
                    </div>

                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
                        <div className="space-y-4 lg:col-span-2">
                            <div className="flex items-center justify-between gap-3">
                                <AnimatePresence mode="wait">
                                    <motion.h2
                                        key={selected}
                                        initial={{ opacity: 0, rotateX: -60 }}
                                        animate={{ opacity: 1, rotateX: 0 }}
                                        exit={{ opacity: 0, rotateX: 60 }}
                                        transition={{ duration: 0.25 }}
                                        className="text-lg font-extrabold text-[var(--text-main)]"
                                    >
                                        {selected ? dayName(selected) : ''}
                                        {selected && <span className="ml-2 text-xs font-bold text-[var(--text-muted)]">{totalKcal(day)} kcal</span>}
                                    </motion.h2>
                                </AnimatePresence>
                                <button
                                    type="button"
                                    onClick={fillDay}
                                    disabled={filling || !selected}
                                    className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-bold text-black shadow-md shadow-emerald-500/20 transition-all hover:bg-[var(--brand-hover)] active:scale-[0.98] disabled:opacity-50"
                                >
                                    {filling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                                    {filling ? 'Planning…' : 'Fill with AI'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {MEAL_SLOTS.map((slot, i) => (
                                    <SlotCard
                                        key={`${selected}-${slot}`}
                                        index={i}
                                        slot={slot}
                                        meals={day[slot] || []}
                                        onAdd={(name) => addMeal(selected, slot, name)}
                                        onToggle={(id) => toggleMeal(selected, slot, id)}
                                        onRemove={(id) => removeMeal(selected, slot, id)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Week at a glance — numbers as visuals */}
                        <div className="space-y-4">
                            <div className="premium-card flex items-center gap-4 p-5">
                                <ProgressRing value={stats.total ? stats.done / stats.total : 0} size={84} stroke={8} label="Meals eaten this week">
                                    <span className="text-lg font-extrabold text-[var(--text-main)]">{stats.done}</span>
                                    <span className="text-[9px] font-bold text-[var(--text-muted)]">of {stats.total}</span>
                                </ProgressRing>
                                <div>
                                    <p className="k-label mb-1">This week</p>
                                    <p className="text-sm font-bold text-[var(--text-main)]">{stats.total ? `${Math.round((stats.done / stats.total) * 100)}% eaten` : 'Nothing planned'}</p>
                                    <p className="text-[11px] text-[var(--text-muted)]">Tick a meal to log it</p>
                                </div>
                            </div>

                            <div className="premium-card p-5">
                                <p className="k-label flex items-center gap-1.5"><Flame className="h-3 w-3" /> Planned kcal</p>
                                <div className="relative flex h-28 items-end gap-1.5">
                                    <span className="absolute inset-x-0 border-t border-dashed border-[var(--brand)]/50" style={{ bottom: `${(goal / maxKcal) * 100}%` }} title={`Goal ${goal} kcal`} />
                                    {stats.kcal.map((kcal, i) => (
                                        <button key={week[i]} type="button" onClick={() => setPicked(week[i])} className="group flex h-full flex-1 flex-col justify-end" aria-label={`${dayName(week[i])}: ${kcal} kcal`}>
                                            <motion.span
                                                initial={{ height: 0 }}
                                                animate={{ height: `${Math.max(kcal ? 6 : 2, (kcal / maxKcal) * 100)}%` }}
                                                transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.04 }}
                                                className={`block w-full rounded-t-md ${week[i] === selected ? 'bg-[var(--brand)]' : kcal > goal ? 'bg-rose-400/60' : 'bg-[var(--border-light)] group-hover:bg-[var(--brand)]/50'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-1.5 flex gap-1.5">
                                    {week.map((k) => (
                                        <span key={k} className="flex-1 text-center text-[9px] font-bold text-[var(--text-muted)]">{dayName(k).slice(0, 1)}</span>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={shopWeek}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--brand)]/40 bg-[var(--brand-light)] py-3 text-sm font-bold text-[var(--brand)] transition-all hover:border-[var(--brand)] active:scale-[0.98]"
                            >
                                <ShoppingCart className="h-4 w-4" /> Shop this week
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SlotCard({ slot, meals, onAdd, onToggle, onRemove, index }) {
    const [adding, setAdding] = useState(false)
    const [draft, setDraft] = useState('')

    const submit = (e) => {
        e.preventDefault()
        if (draft.trim()) onAdd(draft.trim())
        setDraft('')
        setAdding(false)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, rotateX: -20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: index * 0.06, type: 'spring', stiffness: 220, damping: 22 }}
            style={{ transformPerspective: 900 }}
        >
            <Tilt max={5} scale={1.01} glare={false}>
                <div className="premium-card h-full p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[var(--text-main)]">
                            <span className="text-xl">{SLOT_EMOJI[slot]}</span> {slot}
                        </span>
                        <button
                            type="button"
                            onClick={() => setAdding((v) => !v)}
                            aria-label={`Add ${slot.toLowerCase()}`}
                            className={`grid h-7 w-7 place-items-center rounded-lg border transition-all ${adding ? 'rotate-45 border-[var(--brand)] bg-[var(--brand)] text-black' : 'border-[var(--border)] text-[var(--brand)] hover:border-[var(--brand)]'}`}
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>

                    <AnimatePresence initial={false}>
                        {adding && (
                            <motion.form
                                onSubmit={submit}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <input
                                    autoFocus
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onBlur={() => !draft.trim() && setAdding(false)}
                                    placeholder="e.g. Oats with berries (320 kcal)"
                                    className="mb-2 w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] px-3 py-2 text-[13px] text-[var(--text-main)] outline-none focus:border-[var(--brand)]"
                                />
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {meals.length === 0 && !adding ? (
                        <button type="button" onClick={() => setAdding(true)} className="w-full rounded-xl border border-dashed border-[var(--border-light)] py-5 text-[11px] font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]">
                            Nothing yet
                        </button>
                    ) : (
                        <ul className="space-y-1.5">
                            <AnimatePresence initial={false}>
                                {meals.map((meal) => (
                                    <motion.li
                                        key={meal.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20, height: 0 }}
                                        className={`group flex items-center gap-2.5 rounded-xl border px-2.5 py-2 ${meal.completed ? 'border-[var(--brand)]/20 bg-[var(--brand-light)]' : 'border-[var(--border)] bg-[var(--bg-base)]'}`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => onToggle(meal.id)}
                                            role="checkbox"
                                            aria-checked={meal.completed}
                                            aria-label={`Mark ${meal.name} eaten`}
                                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all ${meal.completed ? 'border-[var(--brand)] bg-[var(--brand)]' : 'border-[var(--border-light)] hover:border-[var(--brand)]'}`}
                                        >
                                            {meal.completed && <Check className="h-3 w-3 stroke-[3] text-black" />}
                                        </button>
                                        <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${meal.completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-main)]'}`}>
                                            {meal.emoji && <span className="mr-1">{meal.emoji}</span>}{meal.name}
                                        </span>
                                        {meal.calories ? <span className="text-[10.5px] font-bold text-[var(--text-muted)]">{meal.calories}</span> : null}
                                        <button type="button" onClick={() => onRemove(meal.id)} aria-label={`Remove ${meal.name}`} className="rounded-md p-1 text-[var(--text-muted)] opacity-0 transition-opacity hover:text-rose-400 focus-visible:opacity-100 group-hover:opacity-100">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </ul>
                    )}
                </div>
            </Tilt>
        </motion.div>
    )
}
