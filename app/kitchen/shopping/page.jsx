"use client"

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Plus, Check, X, Trash2, CalendarDays, Copy } from 'lucide-react'
import MobileMenuButton from '@/components/Layout/MobileMenuButton'
import { useKitchenData, AISLE_LABELS } from '@/context/KitchenDataContext'
import { useToast } from '@/components/ui/Toaster'
import { weekKeys } from '@/lib/date'

const AISLE_ORDER = ['produce', 'protein', 'dairy', 'pantry', 'other']

const AISLE_ICON = {
    produce: '🥦',
    protein: '🍗',
    dairy: '🧀',
    pantry: '🫙',
    other: '🛒',
}

export default function ShoppingPage() {
    const toast = useToast()
    const {
        shopping, addShoppingItems, toggleShoppingItem,
        removeShoppingItem, clearCheckedShopping, clearShopping, hydrated, today, ingredientsForDays,
    } = useKitchenData()

    const [draft, setDraft] = useState('')

    const { grouped, done, total } = useMemo(() => {
        const g = {}
        for (const item of shopping) {
            const aisle = item.aisle || 'other'
                ; (g[aisle] ||= []).push(item)
        }
        return {
            grouped: g,
            done: shopping.filter((i) => i.checked).length,
            total: shopping.length,
        }
    }, [shopping])

    const submit = (e) => {
        e.preventDefault()
        const names = draft.split(',').map((s) => s.trim()).filter(Boolean)
        if (!names.length) return

        const added = addShoppingItems(names, 'Added manually')
        setDraft('')
        if (!added) toast('Already on your list', { type: 'info' })
    }

    /** Every ingredient from the recipes planned this week (Mon–Sun). */
    const fillFromPlan = () => {
        if (!today) return
        const { ingredients, meals } = ingredientsForDays(weekKeys(0, today))

        if (!meals) {
            toast('Nothing planned this week yet', { type: 'info' })
            return
        }

        if (!ingredients.length) {
            toast('Your planned meals have no saved ingredients', { type: 'info' })
            return
        }

        const added = addShoppingItems(ingredients, 'From meal plan')
        toast(
            added ? `Added ${added} ingredient${added === 1 ? '' : 's'} from your plan` : 'Everything from your plan is already listed',
            { type: added ? 'success' : 'info' }
        )
    }

    const copyList = async () => {
        const text = AISLE_ORDER
            .filter((a) => grouped[a]?.length)
            .map((a) => `${AISLE_LABELS[a]}\n${grouped[a].map((i) => `- ${i.name}`).join('\n')}`)
            .join('\n\n')

        try {
            await navigator.clipboard.writeText(text)
            toast('Shopping list copied', { type: 'success' })
        } catch {
            toast('Could not copy — clipboard is blocked', { type: 'error' })
        }
    }

    const progress = total ? Math.round((done / total) * 100) : 0

    return (
        <div className="flex flex-col h-dvh relative overflow-hidden w-full bg-[var(--bg-base)] text-[var(--text-main)]">
            <div className="relative z-10 flex flex-col h-full w-full">
                <header className="px-4 sm:px-6 md:px-10 py-4 sm:py-5 flex items-center justify-between flex-shrink-0 border-b border-[var(--border)] min-h-[64px] sm:min-h-[72px] gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <MobileMenuButton />
                        <div className="hidden xs:flex w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 items-center justify-center text-white shadow-lg shadow-amber-500/10 shrink-0">
                            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold text-[var(--text-main)] truncate">Shopping List</h1>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">
                                {total === 0 ? 'Nothing to buy yet' : `${total - done} of ${total} still to get`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={fillFromPlan}
                            className="flex items-center gap-1.5 bg-[#10B981] hover:bg-[#34D399] text-black px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] shadow-md shadow-emerald-500/10"
                        >
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">From meal plan</span>
                            <span className="sm:hidden">Auto</span>
                        </button>
                        {total > 0 && (
                            <button
                                onClick={copyList}
                                aria-label="Copy list to clipboard"
                                className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </header>

                {total > 0 && (
                    <div className="px-4 sm:px-6 md:px-10 pt-4 shrink-0">
                        <div className="max-w-2xl mx-auto">
                            <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-emerald-400"
                                    animate={{ width: `${progress}%` }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto overscroll-contain elegant-scrollbar py-6 w-full">
                    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 md:px-10">
                        <form onSubmit={submit} className="flex gap-2 mb-6">
                            <label className="sr-only" htmlFor="shopping-add">Add an item</label>
                            <input
                                id="shopping-add"
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder="Add an item — or paste a few, comma separated"
                                className="flex-1 h-11 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-4 text-sm text-[var(--text-main)] outline-none transition-colors focus:border-[#10B981]"
                            />
                            <button
                                type="submit"
                                disabled={!draft.trim()}
                                aria-label="Add to list"
                                className="shrink-0 w-11 h-11 rounded-xl bg-[#10B981] text-black grid place-items-center hover:bg-[#34D399] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </form>

                        {!hydrated ? (
                            <div className="space-y-2">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div key={i} className="premium-card h-12 animate-pulse opacity-50" />
                                ))}
                            </div>
                        ) : total === 0 ? (
                            <EmptyState onAuto={fillFromPlan} />
                        ) : (
                            <>
                                {AISLE_ORDER.filter((a) => grouped[a]?.length).map((aisle) => (
                                    <section key={aisle} className="mb-6">
                                        <h2 className="mb-2 flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                            <span aria-hidden="true">{AISLE_ICON[aisle]}</span>
                                            {AISLE_LABELS[aisle]}
                                            <span className="ml-auto normal-case tracking-normal">
                                                {grouped[aisle].filter((i) => !i.checked).length} left
                                            </span>
                                        </h2>

                                        <ul className="space-y-1.5">
                                            <AnimatePresence initial={false}>
                                                {grouped[aisle].map((item) => (
                                                    <motion.li
                                                        key={item.id}
                                                        layout
                                                        initial={{ opacity: 0, y: 6 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, x: -12 }}
                                                        transition={{ duration: 0.18 }}
                                                    >
                                                        <div
                                                            className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${item.checked
                                                                ? 'border-[var(--border)] bg-[var(--bg-card)]/40 opacity-55'
                                                                : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-light)]'
                                                                }`}
                                                        >
                                                            <button
                                                                onClick={() => toggleShoppingItem(item.id)}
                                                                role="checkbox"
                                                                aria-checked={item.checked}
                                                                aria-label={item.name}
                                                                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${item.checked
                                                                    ? 'border-[#10B981] bg-[#10B981]'
                                                                    : 'border-[var(--text-muted)] hover:border-[#10B981]'
                                                                    }`}
                                                            >
                                                                {item.checked && <Check className="h-3 w-3 stroke-[4] text-black" />}
                                                            </button>

                                                            <span className="min-w-0 flex-1">
                                                                <span className={`block truncate text-[13px] font-semibold ${item.checked ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-main)]'}`}>
                                                                    {item.name}
                                                                </span>
                                                                {item.source && (
                                                                    <span className="block truncate text-[10px] text-[var(--text-muted)]">{item.source}</span>
                                                                )}
                                                            </span>

                                                            <button
                                                                onClick={() => removeShoppingItem(item.id)}
                                                                aria-label={`Remove ${item.name}`}
                                                                className="shrink-0 rounded-md p-1 text-[var(--text-muted)] opacity-0 transition-all hover:text-rose-400 focus-visible:opacity-100 group-hover:opacity-100"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </motion.li>
                                                ))}
                                            </AnimatePresence>
                                        </ul>
                                    </section>
                                ))}

                                <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-5">
                                    {done > 0 && (
                                        <button
                                            onClick={() => { clearCheckedShopping(); toast(`Cleared ${done} picked up`, { type: 'success' }) }}
                                            className="flex items-center gap-1.5 rounded-xl bg-[var(--bg-hover)] px-4 py-2 text-xs font-bold text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
                                        >
                                            <Check className="h-3.5 w-3.5" /> Clear {done} picked up
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { clearShopping(); toast('Shopping list emptied', { type: 'info' }) }}
                                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-rose-400 transition-colors hover:bg-rose-500/10"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" /> Empty list
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function EmptyState({ onAuto }) {
    return (
        <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-5 grid h-20 w-20 place-items-center rounded-2xl bg-amber-500/10">
                <ShoppingCart className="h-9 w-9 text-amber-400" />
            </div>
            <h2 className="text-base font-bold text-[var(--text-main)]">Your list is empty</h2>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-[var(--text-muted)]">
                Add items above, pull every ingredient straight from this week&apos;s meal plan, or
                send them over from any recipe.
            </p>
            <button
                onClick={onAuto}
                className="mt-6 flex items-center gap-1.5 rounded-xl bg-[#10B981] px-5 py-2.5 text-xs font-bold text-black transition-all hover:bg-[#34D399] active:scale-[0.98]"
            >
                <CalendarDays className="h-3.5 w-3.5" /> Fill from meal plan
            </button>
        </div>
    )
}
