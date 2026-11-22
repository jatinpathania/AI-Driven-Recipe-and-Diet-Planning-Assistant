"use client"

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Carrot, Search, Plus, X, Check, Loader2, Wand2, CalendarDays, ArrowRight, Pencil } from 'lucide-react'
import MobileMenuButton from '@/components/Layout/MobileMenuButton'
import { useKitchenData, SLOT_EMOJI } from '@/context/KitchenDataContext'
import { useToast } from '@/components/ui/Toaster'
import { planWeekFromVegetables } from '@/utils/api'
import { useGuestQuota, isGuestLimitError } from '@/lib/guestQuota'
import { KEYS, updateJSON } from '@/lib/store/local'
import { useStored } from '@/lib/store/hooks'
import { addDays, dayName, parseDateKey } from '@/lib/date'
import { VEGETABLES, VEGETABLE_GROUPS, STAPLES, DEFAULT_STAPLES } from '@/lib/kitchen/vegetables'

/**
 * Week planner: pick the vegetables you brought home, press Plan, and the AI
 * fills breakfast, lunch and dinner for the coming days using only those
 * vegetables (checked server-side). The plan lands in the regular meal plan,
 * where every meal can be edited, ticked off or removed.
 */

const PLAN_SLOTS = ['Breakfast', 'Lunch', 'Dinner']
const DAY_OPTIONS = [3, 5, 7]
const DIET_LABEL = { vegetarian: 'vegetarian', vegan: 'vegan', pescatarian: 'pescatarian', keto: 'keto', 'high-protein': 'high-protein' }

const asObj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
const savePantry = (patch) => updateJSON(KEYS.pantry, null, (p) => ({ ...asObj(p), ...patch }))

export default function VegPlannerPage() {
    const router = useRouter()
    const toast = useToast()
    const quota = useGuestQuota()
    const { hydrated, today, mealsFor, fillDays, settings } = useKitchenData()
    const pantry = asObj(useStored(KEYS.pantry, null))

    const selected = useMemo(() => new Set(Array.isArray(pantry.vegetables) ? pantry.vegetables : []), [pantry.vegetables])
    const custom = Array.isArray(pantry.custom) ? pantry.custom : []
    const staples = useMemo(() => new Set(Array.isArray(pantry.staples) ? pantry.staples : DEFAULT_STAPLES), [pantry.staples])

    const [query, setQuery] = useState('')
    const [draft, setDraft] = useState('')
    const [start, setStart] = useState('today')
    const [dayCount, setDayCount] = useState(7)
    const [overwrite, setOverwrite] = useState(false)
    const [planning, setPlanning] = useState(false)

    const lastDates = Array.isArray(pantry.lastPlan?.dates) ? pantry.lastPlan.dates : []
    // Show the last plan while any of its days is today or later.
    const showPlan = today && lastDates.some((d) => d >= today)

    const q = query.trim().toLowerCase()
    const visible = q
        ? VEGETABLES.filter((v) => [v.name, v.hindi, ...v.aliases].some((s) => s.toLowerCase().includes(q)))
        : VEGETABLES
    const count = selected.size + custom.length

    const toggleVeg = (id) => {
        const next = new Set(selected)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        savePantry({ vegetables: [...next] })
    }

    const toggleStaple = (id) => {
        const next = new Set(staples)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        savePantry({ staples: [...next] })
    }

    const addCustom = (e) => {
        e.preventDefault()
        const name = draft.trim().slice(0, 40)
        if (!name) return
        const known = VEGETABLES.find((v) => [v.name, v.hindi, ...v.aliases].some((s) => s.toLowerCase() === name.toLowerCase()))
        if (known) {
            if (!selected.has(known.id)) toggleVeg(known.id)
        } else if (!custom.some((c) => c.toLowerCase() === name.toLowerCase())) {
            savePantry({ custom: [...custom, name].slice(0, 15) })
        }
        setDraft('')
    }

    const clearAll = () => savePantry({ vegetables: [], custom: [] })

    const plan = async () => {
        if (!count || planning || !today || !quota.guard()) return
        setPlanning(true)
        const first = start === 'today' ? today : addDays(today, 1)
        const dates = Array.from({ length: dayCount }, (_, i) => addDays(first, i))
        try {
            const res = await planWeekFromVegetables({
                vegetables: [...VEGETABLES.filter((v) => selected.has(v.id)).map((v) => v.name), ...custom],
                staples: STAPLES.filter((s) => staples.has(s.id)).map((s) => s.name),
                days: dates.map(dayName),
            })
            quota.record(res.quota)
            if (!res.success || !Array.isArray(res.days)) {
                toast(res.message || 'Could not plan the week', { type: 'error' })
                return
            }
            const byDay = {}
            dates.forEach((key, i) => {
                const day = res.days[i] || {}
                byDay[key] = Object.fromEntries(
                    PLAN_SLOTS.filter((s) => day[s]).map((s) => [s, { ...day[s], source: 'veg-plan' }])
                )
            })
            const placed = fillDays(byDay, { overwrite })
            savePantry({ lastPlan: { dates, createdAt: new Date().toISOString() } })
            const skipped = dates.length * PLAN_SLOTS.length - placed - (res.dropped || 0)
            toast(
                placed
                    ? `Planned ${placed} meals${skipped > 0 && !overwrite ? ` · kept ${skipped} you'd already planned` : ''}`
                    : 'Every slot was already planned. Turn on “Replace planned meals” to redo them.',
                { type: placed ? 'success' : 'info', action: { label: 'Meal plan', onClick: () => router.push('/kitchen/meal-plan') } }
            )
        } catch (err) {
            if (isGuestLimitError(err)) quota.exhaust()
            else {
                quota.record(err?.data?.quota)
                toast(err.message || 'Could not plan the week', { type: 'error' })
            }
        } finally {
            setPlanning(false)
        }
    }

    if (!hydrated) return <div className="flex h-dvh w-full" />

    return (
        <div className="relative flex h-dvh w-full flex-col overflow-hidden">
            <header className="flex min-h-[64px] shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-6 md:px-10">
                <div className="flex min-w-0 items-center gap-3">
                    <MobileMenuButton />
                    <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 xs:grid">
                        <Carrot className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-extrabold text-[var(--text-main)]">Week Planner</h1>
                        <p className="truncate text-[11px] text-[var(--text-muted)]">Meals from the vegetables you bought</p>
                    </div>
                </div>
                <Link href="/kitchen/meal-plan" className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border-light)] px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]">
                    <CalendarDays className="h-4 w-4" /> <span className="hidden sm:inline">Meal plan</span>
                </Link>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain pb-28 pt-6 elegant-scrollbar">
                <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 md:px-10">
                    {showPlan && <PlanPreview dates={lastDates.filter((d) => d >= today)} today={today} mealsFor={mealsFor} />}

                    {/* 1. Vegetables */}
                    <section aria-labelledby="veg-h">
                        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h2 id="veg-h" className="text-base font-extrabold text-[var(--text-main)]">1. What did you bring home?</h2>
                                <p className="text-xs text-[var(--text-muted)]">Tap every vegetable you have. Only these will be used.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="relative">
                                    <span className="sr-only">Search vegetables</span>
                                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search… (aloo, palak)"
                                        className="w-44 rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] py-2 pl-8 pr-3 text-[13px] text-[var(--text-main)] outline-none focus:border-[var(--brand)]"
                                    />
                                </label>
                                {count > 0 && (
                                    <button type="button" onClick={clearAll} className="rounded-xl px-2.5 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-rose-400">
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {VEGETABLE_GROUPS.map((group) => {
                            const items = visible.filter((v) => v.group === group.id)
                            if (!items.length) return null
                            return (
                                <div key={group.id} className="mb-5">
                                    <p className="k-label mb-2">{group.label}</p>
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                                        {items.map((v) => {
                                            const on = selected.has(v.id)
                                            return (
                                                <motion.button
                                                    key={v.id}
                                                    type="button"
                                                    onClick={() => toggleVeg(v.id)}
                                                    whileTap={{ scale: 0.95 }}
                                                    aria-pressed={on}
                                                    className={`relative flex flex-col items-center gap-0.5 rounded-2xl border px-2 py-3 text-center transition-colors ${on ? 'border-[var(--brand)] bg-[var(--brand-light)] shadow-md shadow-emerald-500/10' : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-light)]'}`}
                                                >
                                                    {on && (
                                                        <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[var(--brand)]">
                                                            <Check className="h-2.5 w-2.5 stroke-[3] text-black" />
                                                        </span>
                                                    )}
                                                    <span className="text-2xl" aria-hidden="true">{v.emoji}</span>
                                                    <span className={`text-[12px] font-bold leading-tight ${on ? 'text-[var(--brand)]' : 'text-[var(--text-main)]'}`}>{v.name}</span>
                                                    {v.hindi !== v.name && <span className="text-[10px] text-[var(--text-muted)]">{v.hindi}</span>}
                                                </motion.button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                        {!visible.length && <p className="mb-4 text-sm text-[var(--text-muted)]">No match. Add it below as your own vegetable.</p>}

                        <form onSubmit={addCustom} className="flex flex-wrap items-center gap-2">
                            <input
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder="Something else? e.g. Kohlrabi"
                                aria-label="Add another vegetable"
                                className="min-w-0 flex-1 rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] px-3 py-2 text-[13px] text-[var(--text-main)] outline-none focus:border-[var(--brand)] sm:max-w-xs"
                            />
                            <button type="submit" className="flex items-center gap-1 rounded-xl border border-[var(--border-light)] px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]">
                                <Plus className="h-3.5 w-3.5" /> Add
                            </button>
                            {custom.map((c) => (
                                <span key={c} className="flex items-center gap-1 rounded-full border border-[var(--brand)] bg-[var(--brand-light)] py-1 pl-3 pr-1 text-[12px] font-bold text-[var(--brand)]">
                                    {c}
                                    <button type="button" onClick={() => savePantry({ custom: custom.filter((x) => x !== c) })} aria-label={`Remove ${c}`} className="rounded-full p-0.5 hover:bg-[var(--brand)] hover:text-black">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </form>
                    </section>

                    {/* 2. Staples */}
                    <section aria-labelledby="staples-h">
                        <h2 id="staples-h" className="text-base font-extrabold text-[var(--text-main)]">2. What’s in the pantry?</h2>
                        <p className="mb-3 text-xs text-[var(--text-muted)]">Oil, salt and dry spices are assumed. Tap to change the rest.</p>
                        <div className="flex flex-wrap gap-2">
                            {STAPLES.map((s) => {
                                const on = staples.has(s.id)
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => toggleStaple(s.id)}
                                        aria-pressed={on}
                                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors ${on ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)]' : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                    >
                                        <span aria-hidden="true">{s.emoji}</span> {s.name}
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    {/* 3. Options */}
                    <section aria-labelledby="opts-h" className="premium-card space-y-4 p-5">
                        <h2 id="opts-h" className="text-base font-extrabold text-[var(--text-main)]">3. Plan</h2>
                        <div className="flex flex-wrap gap-6">
                            <Segmented label="Start" value={start} onChange={setStart} options={[['today', 'Today'], ['tomorrow', 'Tomorrow']]} />
                            <Segmented label="Days" value={dayCount} onChange={setDayCount} options={DAY_OPTIONS.map((n) => [n, `${n} days`])} />
                        </div>
                        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[var(--text-main)]">
                            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
                            Replace meals I’ve already planned on those days
                        </label>
                        <p className="text-[11px] text-[var(--text-muted)]">
                            Breakfast, lunch and dinner for each day.
                            {DIET_LABEL[settings.diet] ? ` Follows your ${DIET_LABEL[settings.diet]} diet` : ''}
                            {settings.avoid?.length ? `${DIET_LABEL[settings.diet] ? ' and' : ' Avoids'} ${settings.avoid.join(', ')}` : ''}
                            {DIET_LABEL[settings.diet] || settings.avoid?.length ? ' from Settings.' : ''}
                        </p>
                    </section>
                </div>
            </div>

            {/* Sticky action bar */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-4">
                <motion.button
                    type="button"
                    onClick={plan}
                    disabled={!count || planning}
                    whileTap={{ scale: 0.98 }}
                    className="pointer-events-auto flex w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] py-4 text-base font-extrabold text-black shadow-xl shadow-emerald-500/25 transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {planning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                    {planning ? 'Planning your week…' : count ? `Plan ${dayCount} days with ${count} vegetable${count === 1 ? '' : 's'}` : 'Pick your vegetables'}
                </motion.button>
            </div>
        </div>
    )
}

function Segmented({ label, value, onChange, options }) {
    return (
        <div>
            <p className="k-label mb-1.5">{label}</p>
            <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-1" role="radiogroup" aria-label={label}>
                {options.map(([v, text]) => (
                    <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={value === v}
                        onClick={() => onChange(v)}
                        className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors ${value === v ? 'bg-[var(--brand)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                        {text}
                    </button>
                ))}
            </div>
        </div>
    )
}

/** The planned days as a timetable, read live from the meal plan so edits show up here too. */
function PlanPreview({ dates, today, mealsFor }) {
    return (
        <section aria-labelledby="plan-h">
            <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                    <h2 id="plan-h" className="text-base font-extrabold text-[var(--text-main)]">Your plan</h2>
                    <p className="text-xs text-[var(--text-muted)]">Tap a day to edit it in the meal plan.</p>
                </div>
                <Link href="/kitchen/meal-plan" className="flex items-center gap-1 text-xs font-bold text-[var(--brand)] hover:underline">
                    Open meal plan <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
                <AnimatePresence initial={false}>
                    {dates.map((key, i) => {
                        const day = mealsFor(key)
                        const d = parseDateKey(key)
                        return (
                            <motion.div
                                key={key}
                                initial={{ opacity: 0, y: 12, rotateX: -20 }}
                                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                transition={{ delay: i * 0.04, type: 'spring', stiffness: 240, damping: 24 }}
                                className="w-[78%] shrink-0 snap-start sm:w-auto"
                            >
                                <Link
                                    href={`/kitchen/meal-plan?date=${key}`}
                                    className={`premium-card group block h-full p-4 transition-colors hover:border-[var(--brand)] ${key === today ? 'border-[var(--brand)]/60' : ''}`}
                                >
                                    <div className="mb-2.5 flex items-center justify-between">
                                        <span className="text-sm font-extrabold text-[var(--text-main)]">
                                            {dayName(key)} <span className="font-bold text-[var(--text-muted)]">{d.getDate()} {d.toLocaleDateString(undefined, { month: 'short' })}</span>
                                        </span>
                                        {key === today ? (
                                            <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-extrabold uppercase text-black">Today</span>
                                        ) : (
                                            <Pencil className="h-3.5 w-3.5 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                                        )}
                                    </div>
                                    <ul className="space-y-2">
                                        {PLAN_SLOTS.map((slot) => {
                                            const meal = (day[slot] || [])[0]
                                            return (
                                                <li key={slot} className="flex items-start gap-2">
                                                    <span className="mt-0.5 text-sm" title={slot} aria-label={slot}>{SLOT_EMOJI[slot]}</span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className={`block truncate text-[13px] font-semibold ${meal ? (meal.completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-main)]') : 'italic text-[var(--text-muted)]'}`}>
                                                            {meal ? `${meal.emoji ? `${meal.emoji} ` : ''}${meal.name}` : 'Nothing planned'}
                                                        </span>
                                                        {meal?.uses?.length > 0 && (
                                                            <span className="block truncate text-[10.5px] text-[var(--text-muted)]">uses {meal.uses.join(', ')}</span>
                                                        )}
                                                    </span>
                                                    {meal?.calories ? <span className="text-[10.5px] font-bold text-[var(--text-muted)]">{meal.calories}</span> : null}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </Link>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </section>
    )
}
