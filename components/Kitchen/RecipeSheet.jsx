"use client"

import React, { useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Flame, Zap, Play, CalendarPlus, Heart, ShoppingCart, Timer as TimerIcon } from 'lucide-react'
import { useKitchenData } from '@/context/KitchenDataContext'
import { useToast } from '@/components/ui/Toaster'
import { parseDurations } from '@/lib/recipe/parse'

/**
 * Recipe detail as a modal "card" that flips up in 3D. One component for the
 * dashboard suggestions, the recipe library and favourites, so every entry
 * point offers the same four actions: cook, plan, favourite, shop.
 */
export default function RecipeSheet({ recipe, onClose }) {
    const router = useRouter()
    const toast = useToast()
    const { startCooking, planRecipe, isFavourite, toggleFavourite, addShoppingItems } = useKitchenData()

    useEffect(() => {
        if (!recipe) return undefined
        const onKey = (e) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [recipe, onClose])

    const fav = recipe ? isFavourite(recipe) : false

    const act = {
        cook: () => {
            startCooking(recipe)
            onClose()
            router.push('/kitchen/cook')
        },
        plan: () => {
            const { slot } = planRecipe(recipe)
            toast(`On today's plan for ${slot.toLowerCase()}`, { action: { label: 'View', onClick: () => router.push('/kitchen/meal-plan') } })
        },
        fav: () => {
            const added = toggleFavourite(recipe)
            toast(added ? 'Saved to favourites' : 'Removed from favourites', { type: added ? 'success' : 'info' })
        },
        shop: () => {
            const n = addShoppingItems(recipe.ingredients, recipe.name)
            toast(n ? `${n} item${n === 1 ? '' : 's'} added to your list` : 'Already on your list', { type: n ? 'success' : 'info' })
        },
    }

    return (
        <AnimatePresence>
            {recipe && (
                <motion.div
                    className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
                    style={{ perspective: 1400 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.article
                        role="dialog"
                        aria-modal="true"
                        aria-label={recipe.name}
                        onClick={(e) => e.stopPropagation()}
                        initial={{ rotateX: 35, y: 80, opacity: 0, scale: 0.94 }}
                        animate={{ rotateX: 0, y: 0, opacity: 1, scale: 1 }}
                        exit={{ rotateX: 20, y: 60, opacity: 0, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                        style={{ transformOrigin: '50% 100%' }}
                        className="flex max-h-[90dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-3xl border border-[var(--border-light)] bg-[var(--bg-panel)] shadow-2xl sm:rounded-3xl"
                    >
                        <div className="relative h-44 shrink-0 overflow-hidden bg-[var(--bg-hover)] sm:h-52">
                            {recipe.image ? (
                                <motion.div className="absolute inset-0" initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}>
                                    <Image src={recipe.image} alt="" fill sizes="560px" className="object-cover" unoptimized />
                                </motion.div>
                            ) : (
                                <div className="absolute inset-0 grid place-items-center text-7xl">{recipe.emoji}</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-panel)] via-[var(--bg-panel)]/30 to-transparent" />
                            <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/60">
                                <X className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-3 left-5 right-5">
                                <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">{recipe.name}</h2>
                                {recipe.description && <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">{recipe.description}</p>}
                            </div>
                        </div>

                        <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-5 pt-3 hide-scrollbar">
                            <div className="flex flex-wrap gap-2">
                                {recipe.time && <Stat Icon={Clock} cls="text-orange-400 bg-orange-400/10">{recipe.time}</Stat>}
                                {recipe.calories ? <Stat Icon={Flame} cls="text-rose-400 bg-rose-400/10">{recipe.calories} kcal</Stat> : null}
                                {recipe.protein && <Stat Icon={Zap} cls="text-emerald-500 bg-emerald-500/10">{recipe.protein} protein</Stat>}
                            </div>

                            <section>
                                <h3 className="k-label mb-2">You&apos;ll need</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {recipe.ingredients.map((ing, i) => (
                                        <motion.span
                                            key={`${i}-${ing}`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.12 + i * 0.03 }}
                                            className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)]"
                                        >
                                            {ing}
                                        </motion.span>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="k-label mb-2">Method</h3>
                                <ol className="relative space-y-3 border-l-2 border-[var(--border)] pl-5">
                                    {recipe.steps.map((step, i) => {
                                        const d = parseDurations(step)
                                        return (
                                            <li key={i} className="relative text-[13px] leading-relaxed text-[var(--text-main)]">
                                                <span className="absolute -left-[29px] top-0 grid h-5 w-5 place-items-center rounded-full bg-[var(--brand)] text-[10px] font-bold text-black ring-4 ring-[var(--bg-panel)]">{i + 1}</span>
                                                {step}
                                                {d.length > 0 && (
                                                    <span className="ml-1.5 inline-flex items-center gap-1 rounded-md bg-[var(--brand-light)] px-1.5 py-0.5 align-middle text-[10px] font-bold text-[var(--brand)]">
                                                        <TimerIcon className="h-3 w-3" /> {d.map((x) => x.label).join(' + ')}
                                                    </span>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ol>
                            </section>
                        </div>

                        <div className="grid shrink-0 grid-cols-[1fr_auto_auto_auto] gap-2 border-t border-[var(--border)] bg-[var(--bg-card)] p-3">
                            <button type="button" onClick={act.cook} className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition-all hover:bg-[var(--brand-hover)] active:scale-[0.98]">
                                <Play className="h-4 w-4 fill-current" /> Cook now
                            </button>
                            <IconBtn label="Add to today's plan" onClick={act.plan}><CalendarPlus className="h-4 w-4" /></IconBtn>
                            <IconBtn label={fav ? 'Remove from favourites' : 'Save to favourites'} onClick={act.fav} active={fav}>
                                <Heart className="h-4 w-4" fill={fav ? 'currentColor' : 'none'} />
                            </IconBtn>
                            <IconBtn label="Add ingredients to shopping list" onClick={act.shop}><ShoppingCart className="h-4 w-4" /></IconBtn>
                        </div>
                    </motion.article>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function Stat({ Icon, cls, children }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${cls}`}>
            <Icon className="h-3.5 w-3.5" /> {children}
        </span>
    )
}

function IconBtn({ label, onClick, active, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            aria-pressed={active}
            className={`grid w-12 place-items-center rounded-xl border transition-all active:scale-95 ${active ? 'border-rose-400/50 bg-rose-500/10 text-rose-400' : 'border-[var(--border-light)] text-[var(--text-muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]'}`}
        >
            {children}
        </button>
    )
}
