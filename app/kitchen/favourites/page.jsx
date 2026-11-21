"use client"

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Clock, Flame, Play, ShoppingCart, Search, Trash2, Calendar } from 'lucide-react'
import MobileMenuButton from '@/components/Layout/MobileMenuButton'
import { useKitchenData } from '@/context/KitchenDataContext'
import { useToast } from '@/components/ui/Toaster'

export default function FavouritesPage() {
    const router = useRouter()
    const toast = useToast()
    const { favourites, toggleFavourite, addShoppingItems, hydrated, startCooking, planRecipe } = useKitchenData()
    const [query, setQuery] = useState('')

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return favourites
        return favourites.filter(
            (f) =>
                f.name?.toLowerCase().includes(q) ||
                (f.ingredients || []).some((i) => String(i).toLowerCase().includes(q))
        )
    }, [favourites, query])

    const cook = (recipe) => {
        startCooking(recipe)
        router.push('/kitchen/cook')
    }

    const addIngredients = (recipe) => {
        const added = addShoppingItems(recipe.ingredients || [], recipe.name)
        toast(
            added ? `Added ${added} item${added === 1 ? '' : 's'} to your list` : 'Those ingredients are already on your list',
            {
                type: added ? 'success' : 'info',
                action: { label: 'View list', onClick: () => router.push('/kitchen/shopping') },
            }
        )
    }

    const plan = (recipe) => {
        const { slot } = planRecipe(recipe)
        toast(`On today's plan for ${slot.toLowerCase()}`, {
            action: { label: 'View', onClick: () => router.push('/kitchen/meal-plan') },
        })
    }

    const unfavourite = (recipe) => {
        toggleFavourite(recipe)
        toast(`Removed ${recipe.name} from favourites`, {
            type: 'info',
            action: { label: 'Undo', onClick: () => toggleFavourite(recipe) },
        })
    }

    return (
        <div className="flex flex-col h-dvh relative overflow-hidden w-full bg-[var(--bg-base)] text-[var(--text-main)]">
            <div className="relative z-10 flex flex-col h-full w-full">
                <header className="px-4 sm:px-6 md:px-10 py-4 sm:py-5 flex items-center justify-between flex-shrink-0 border-b border-[var(--border)] min-h-[64px] sm:min-h-[72px] gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <MobileMenuButton />
                        <div className="hidden xs:flex w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 items-center justify-center text-white shadow-lg shadow-rose-500/10 shrink-0">
                            <Heart className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold text-[var(--text-main)] truncate">Favourites</h1>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">
                                {favourites.length} saved {favourites.length === 1 ? 'recipe' : 'recipes'}
                            </p>
                        </div>
                    </div>

                    {favourites.length > 0 && (
                        <div className="relative hidden sm:flex items-center">
                            <Search className="absolute left-3 w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search favourites…"
                                aria-label="Search favourites"
                                className="h-9 w-56 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] pl-9 pr-3 text-xs text-[var(--text-main)] outline-none transition-colors focus:border-[#10B981]"
                            />
                        </div>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto overscroll-contain elegant-scrollbar py-6 sm:py-8 w-full">
                    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-10">
                        {!hydrated ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[0, 1, 2, 3].map((i) => (
                                    <div key={i} className="premium-card h-[150px] animate-pulse opacity-50" />
                                ))}
                            </div>
                        ) : favourites.length === 0 ? (
                            <EmptyState onBrowse={() => router.push('/kitchen/recipes')} />
                        ) : shown.length === 0 ? (
                            <p className="py-16 text-center text-sm text-[var(--text-muted)]">
                                No favourites match “{query}”.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {shown.map((recipe) => (
                                        <motion.article
                                            key={recipe.key}
                                            layout
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.96 }}
                                            transition={{ duration: 0.25 }}
                                            className="premium-card premium-card-interactive p-4 flex flex-col gap-3"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl leading-none shrink-0">{recipe.emoji || '🍽️'}</span>
                                                <div className="min-w-0 flex-1">
                                                    <h2 className="text-sm font-bold text-[var(--text-main)] truncate">{recipe.name}</h2>
                                                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5">
                                                        {recipe.description || `${(recipe.ingredients || []).slice(0, 4).join(', ')}`}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => unfavourite(recipe)}
                                                    aria-label={`Remove ${recipe.name} from favourites`}
                                                    className="shrink-0 p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="flex gap-2 text-[10px] font-semibold">
                                                {recipe.time && (
                                                    <span className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">
                                                        <Clock className="w-2.5 h-2.5" /> {recipe.time}
                                                    </span>
                                                )}
                                                {recipe.calories ? (
                                                    <span className="flex items-center gap-1 text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded">
                                                        <Flame className="w-2.5 h-2.5" /> {recipe.calories} kcal
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="mt-auto flex gap-2 pt-1">
                                                <button
                                                    onClick={() => cook(recipe)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#10B981] text-black font-bold text-[11px] py-2 rounded-lg hover:bg-[#34D399] active:scale-[0.98] transition-all"
                                                >
                                                    <Play className="w-3 h-3" fill="currentColor" /> Cook
                                                </button>
                                                <button
                                                    onClick={() => plan(recipe)}
                                                    aria-label={`Add ${recipe.name} to meal plan`}
                                                    className="px-2.5 py-2 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                                                >
                                                    <Calendar className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => addIngredients(recipe)}
                                                    aria-label={`Add ${recipe.name} ingredients to shopping list`}
                                                    className="px-2.5 py-2 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                                                >
                                                    <ShoppingCart className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </motion.article>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function EmptyState({ onBrowse }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-5">
                <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                    <Heart className="w-9 h-9 text-rose-400" />
                </div>
                <span className="absolute inset-0 rounded-2xl border border-rose-400/30 animate-ping opacity-20" />
            </div>
            <h2 className="text-base font-bold text-[var(--text-main)]">No favourites yet</h2>
            <p className="mt-2 max-w-sm text-xs text-[var(--text-muted)] leading-relaxed">
                Tap the heart on any recipe to keep it here. Favourites show up in the command
                palette too, so you can jump straight into cooking with <kbd className="px-1 py-0.5 rounded border border-[var(--border-light)] text-[10px]">⌘K</kbd>.
            </p>
            <button
                onClick={onBrowse}
                className="mt-6 bg-[#10B981] text-black font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#34D399] active:scale-[0.98] transition-all"
            >
                Browse recipes
            </button>
        </div>
    )
}
