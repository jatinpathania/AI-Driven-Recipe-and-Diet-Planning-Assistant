"use client"

import React, { memo, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Play, CalendarPlus, Bookmark, BookmarkCheck, ShoppingCart, Clock, Flame, Zap, ChevronDown, Timer as TimerIcon } from 'lucide-react'
import { renderMarkdown } from '@/lib/chat/format'
import { parseRecipeText } from '@/lib/recipe/normalize'
import { parseDurations } from '@/lib/recipe/parse'
import { useKitchenData } from '@/context/KitchenDataContext'
import { useTimers } from '@/context/TimersContext'
import { useToast } from '@/components/ui/Toaster'
import Tilt from '@/components/ui/Tilt'

const enter = {
    initial: { opacity: 0, y: 18, rotateX: -18 },
    animate: { opacity: 1, y: 0, rotateX: 0 },
    transition: { type: 'spring', stiffness: 260, damping: 24 },
}

export const AIAvatar = () => (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/25">
        <Sparkles className="h-4 w-4" />
    </div>
)

function RecipeCard({ recipe }) {
    const router = useRouter()
    const toast = useToast()
    const { startCooking, planRecipe, saveRecipe, isFavourite, toggleFavourite, addShoppingItems } = useKitchenData()
    const { addTimer } = useTimers()
    const [open, setOpen] = useState(false)
    const saved = isFavourite(recipe)

    const stats = [
        recipe.calories && { Icon: Flame, text: `${recipe.calories} kcal`, cls: 'text-rose-400 bg-rose-400/10' },
        recipe.protein && { Icon: Zap, text: `${recipe.protein} protein`, cls: 'text-emerald-500 bg-emerald-500/10' },
        recipe.time && { Icon: Clock, text: recipe.time, cls: 'text-orange-400 bg-orange-400/10' },
    ].filter(Boolean)

    const cook = () => {
        startCooking(recipe)
        router.push('/kitchen/cook')
    }

    const plan = () => {
        const { slot } = planRecipe(recipe)
        toast(`Added to today's ${slot.toLowerCase()}`, { action: { label: 'View', onClick: () => router.push('/kitchen/meal-plan') } })
    }

    const save = () => {
        saveRecipe(recipe)
        const added = toggleFavourite(recipe)
        toast(added ? `Saved ${recipe.name}` : `Removed ${recipe.name} from favourites`, { type: added ? 'success' : 'info' })
    }

    const shop = () => {
        const n = addShoppingItems(recipe.ingredients, recipe.name)
        toast(n ? `${n} item${n === 1 ? '' : 's'} added to your list` : 'Already on your list', {
            type: n ? 'success' : 'info',
            action: { label: 'Open', onClick: () => router.push('/kitchen/shopping') },
        })
    }

    return (
        <Tilt max={4} scale={1.005}>
            <div className="group relative overflow-hidden rounded-[4px_20px_20px_20px] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-card)]">
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-emerald-500/15 via-teal-400/5 to-transparent" aria-hidden="true" />

                <div className="relative p-5">
                    <div className="flex items-start gap-3">
                        <motion.span
                            initial={{ rotateY: -180, scale: 0.4 }}
                            animate={{ rotateY: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
                            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--bg-hover)] text-2xl shadow-inner"
                            style={{ transformPerspective: 400 }}
                        >
                            {recipe.emoji}
                        </motion.span>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-base font-extrabold leading-snug text-[var(--text-main)]">{recipe.name}</h3>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {stats.map(({ Icon, text, cls }) => (
                                    <span key={text} className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold ${cls}`}>
                                        <Icon className="h-3 w-3" /> {text}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={save}
                            aria-label={saved ? 'Remove from favourites' : 'Save to favourites'}
                            aria-pressed={saved}
                            className="rounded-xl p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--brand)]"
                        >
                            {saved ? <BookmarkCheck className="h-4 w-4 text-[var(--brand)]" /> : <Bookmark className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Ingredients as chips — scannable instead of a list */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {recipe.ingredients.map((ing, i) => (
                            <motion.span
                                key={ing}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 + i * 0.03 }}
                                className="rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--text-main)]"
                            >
                                {ing}
                            </motion.span>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        aria-expanded={open}
                        className="mt-4 flex w-full items-center justify-between rounded-xl bg-[var(--bg-hover)]/60 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
                    >
                        {recipe.steps.length} steps
                        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence initial={false}>
                        {open && (
                            <motion.ol
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                            >
                                {recipe.steps.map((step, i) => {
                                    const timers = parseDurations(step)
                                    return (
                                        <li key={i} className="flex gap-2.5 pt-2.5 text-[13px] leading-relaxed text-[var(--text-main)]">
                                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-[10px] font-bold text-black">{i + 1}</span>
                                            <span className="flex-1">
                                                {step}
                                                {timers.map((d) => (
                                                    <button
                                                        key={d.label}
                                                        type="button"
                                                        onClick={() => {
                                                            addTimer({ label: `${recipe.name} · step ${i + 1}`, emoji: recipe.emoji, minutes: d.minutes, source: 'chat' })
                                                            toast(`Timer started: ${d.label}`, { type: 'info' })
                                                        }}
                                                        className="ml-1.5 inline-flex items-center gap-1 rounded-md bg-[var(--brand-light)] px-1.5 py-0.5 align-middle text-[10.5px] font-bold text-[var(--brand)] hover:bg-[var(--brand)] hover:text-black"
                                                    >
                                                        <TimerIcon className="h-3 w-3" /> {d.label}
                                                    </button>
                                                ))}
                                            </span>
                                        </li>
                                    )
                                })}
                            </motion.ol>
                        )}
                    </AnimatePresence>

                    <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
                        <button type="button" onClick={cook} className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] py-2.5 text-xs font-bold text-black shadow-md shadow-emerald-500/20 transition-all hover:bg-[var(--brand-hover)] active:scale-[0.98]">
                            <Play className="h-3.5 w-3.5 fill-current" /> Cook it
                        </button>
                        <button type="button" onClick={plan} aria-label="Add to today's plan" className="rounded-xl border border-[var(--border-light)] px-3 text-[var(--text-muted)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]">
                            <CalendarPlus className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={shop} aria-label="Add ingredients to shopping list" className="rounded-xl border border-[var(--border-light)] px-3 text-[var(--text-muted)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]">
                            <ShoppingCart className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </Tilt>
    )
}

function ChatMessage({ message, userInitial = 'C' }) {
    const isAI = message.role === 'ai' || message.role === 'assistant'
    const recipe = useMemo(() => (isAI ? parseRecipeText(message.content) : null), [isAI, message.content])

    if (!isAI) {
        return (
            <motion.div {...enter} style={{ transformPerspective: 800, transformOrigin: '100% 100%' }} className="mb-6 flex justify-end gap-3">
                <div className="max-w-[min(520px,85%)] whitespace-pre-wrap break-words rounded-[20px_4px_20px_20px] bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-medium leading-relaxed text-white shadow-lg shadow-emerald-500/20">
                    {message.content}
                </div>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--bg-hover)] text-sm font-bold text-[var(--brand)]">{userInitial}</div>
            </motion.div>
        )
    }

    return (
        <motion.div {...enter} style={{ transformPerspective: 800, transformOrigin: '0% 100%' }} className="mb-6 flex gap-3">
            <AIAvatar />
            <div className="min-w-0 max-w-[680px] flex-1">
                {recipe ? (
                    <RecipeCard recipe={recipe} />
                ) : (
                    <div className={`space-y-2 rounded-[4px_20px_20px_20px] border px-4 py-3 shadow-[var(--shadow-card)] ${message.error ? 'border-rose-400/30 bg-rose-500/5' : 'border-[var(--border)] bg-[var(--bg-card)]'} text-[var(--text-main)]`}>
                        {renderMarkdown(message.content)}
                    </div>
                )}
            </div>
        </motion.div>
    )
}

export default memo(ChatMessage)
