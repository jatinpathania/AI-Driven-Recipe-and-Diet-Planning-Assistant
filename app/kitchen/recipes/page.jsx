"use client"

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Clock, Flame, Trash2, Loader2, Sparkles, BookOpen, Heart, ChefHat, Plus } from 'lucide-react'
import MobileMenuButton from '@/components/Layout/MobileMenuButton'
import Tilt from '@/components/ui/Tilt'
import Modal from '@/components/ui/Modal'
import RecipeSheet from '@/components/Kitchen/RecipeSheet'
import { useKitchenData } from '@/context/KitchenDataContext'
import { useToast } from '@/components/ui/Toaster'
import { generateRecipe } from '@/utils/api'
import { normalizeRecipe } from '@/lib/recipe/normalize'
import { useGuestQuota, isGuestLimitError } from '@/lib/guestQuota'

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'breakfast', label: '🌅' },
    { key: 'lunch', label: '☀️' },
    { key: 'snack', label: '🍿' },
    { key: 'dinner', label: '🌙' },
]

const GRADIENTS = ['from-emerald-400/30 to-teal-500/10', 'from-amber-400/30 to-orange-500/10', 'from-rose-400/30 to-pink-500/10', 'from-sky-400/30 to-indigo-500/10']

/** Card photo that shimmers until the image has downloaded, then fades in. */
function CardPhoto({ src }) {
    const [loaded, setLoaded] = useState(false)
    return (
        <>
            {!loaded && <span aria-hidden className="photo-shimmer absolute inset-0 block" />}
            <Image
                src={src}
                alt=""
                fill
                sizes="(min-width:1280px) 260px, (min-width:768px) 30vw, 45vw"
                onLoad={() => setLoaded(true)}
                className={`object-cover transition-[opacity,transform] duration-700 group-hover:scale-110 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                unoptimized={!src.includes('images.unsplash.com')}
            />
        </>
    )
}

export default function RecipesPage() {
    const toast = useToast()
    const quota = useGuestQuota()
    // photoPending: recipes whose dish photo is being looked up right now (KitchenDataProvider).
    const { recipes, saveRecipe, deleteRecipe, isFavourite, toggleFavourite, hydrated, photoPending } = useKitchenData()

    const [query, setQuery] = useState('')
    const [filter, setFilter] = useState('all')
    const [sheet, setSheet] = useState(null)
    const [creating, setCreating] = useState(false)
    const [ingredients, setIngredients] = useState('')
    const [generating, setGenerating] = useState(false)
    const [draft, setDraft] = useState(null)

    const list = useMemo(() => {
        const q = query.trim().toLowerCase()
        return recipes
            .map(normalizeRecipe)
            .filter((r) => (filter === 'all' || r.category === filter) && (!q || r.name.toLowerCase().includes(q) || r.ingredients.some((i) => i.toLowerCase().includes(q))))
    }, [recipes, query, filter])

    const generate = async () => {
        if (!ingredients.trim() || generating || !quota.guard()) return
        setGenerating(true)
        setDraft(null)
        try {
            const res = await generateRecipe(ingredients.trim())
            quota.record(res.quota)
            const r = res.recipe
            setDraft(normalizeRecipe({ ...r, name: r.recipeName || r.name, category: r.tags?.find((t) => /breakfast|lunch|dinner|snack/i.test(t)) || 'dinner' }))
        } catch (err) {
            if (isGuestLimitError(err)) quota.exhaust()
            else {
                quota.record(err?.data?.quota)
                toast(err.message || 'Could not write that recipe', { type: 'error' })
            }
        } finally {
            setGenerating(false)
        }
    }

    const keepDraft = () => {
        const { added } = saveRecipe(draft, { overwrite: true })
        toast(added ? `${draft.name} saved` : `${draft.name} updated`)
        setCreating(false)
        setDraft(null)
        setIngredients('')
    }

    const remove = (r) => {
        const original = recipes.find((x) => x.id === r.id)
        deleteRecipe(r.id)
        toast(`Deleted ${r.name}`, { type: 'info', action: original ? { label: 'Undo', onClick: () => saveRecipe(original) } : undefined })
    }

    return (
        <div className="flex h-dvh w-full flex-col overflow-hidden">
            <header className="flex min-h-[64px] shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-6 md:px-10">
                <div className="flex min-w-0 items-center gap-3">
                    <MobileMenuButton />
                    <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-lg shadow-orange-500/20 xs:grid">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold text-[var(--text-main)]">Recipes</h1>
                        <p className="text-[11px] font-semibold text-[var(--text-muted)]">{recipes.length} saved</p>
                    </div>
                </div>
                <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-bold text-black shadow-md shadow-emerald-500/20 transition-all hover:bg-[var(--brand-hover)] active:scale-[0.98]">
                    <Sparkles className="h-3.5 w-3.5" /> Create with AI
                </button>
            </header>

            <div className="flex shrink-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:px-6 md:px-10">
                <label className="relative flex-1">
                    <span className="sr-only">Search recipes</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search a dish or ingredient"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]"
                    />
                </label>
                <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1" role="tablist">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            role="tab"
                            aria-selected={filter === f.key}
                            aria-label={f.key}
                            onClick={() => setFilter(f.key)}
                            className="relative rounded-lg px-3 py-1.5 text-xs font-bold"
                        >
                            {filter === f.key && <motion.span layoutId="recipe-filter" className="absolute inset-0 rounded-lg bg-[var(--brand)]" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                            <span className={`relative ${filter === f.key ? 'text-black' : 'text-[var(--text-muted)]'}`}>{f.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 elegant-scrollbar">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-10">
                    {!hydrated ? (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                            {[0, 1, 2, 3].map((i) => <div key={i} className="k-shimmer h-56 rounded-2xl" />)}
                        </div>
                    ) : list.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="text-5xl">🍽️</div>
                            <p className="mt-3 text-sm font-semibold text-[var(--text-muted)]">{query ? `Nothing matches “${query}”` : 'No recipes here yet'}</p>
                            <button type="button" onClick={() => setCreating(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-bold text-black">
                                <Plus className="h-3.5 w-3.5" /> Create one
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                            <AnimatePresence>
                                {list.map((r, i) => {
                                    const fav = isFavourite(r)
                                    return (
                                        <motion.div
                                            key={r.id}
                                            layout
                                            initial={{ opacity: 0, y: 30, rotateX: -25 }}
                                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                            exit={{ opacity: 0, scale: 0.85, rotateY: 30 }}
                                            transition={{ delay: Math.min(i, 8) * 0.04, type: 'spring', stiffness: 220, damping: 24 }}
                                            style={{ transformPerspective: 900 }}
                                        >
                                            <Tilt max={9} onClick={() => setSheet(r)}>
                                                <div className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-card)] transition-colors hover:border-[var(--brand)]">
                                                    <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`}>
                                                        {r.image ? (
                                                            <CardPhoto src={r.image} />
                                                        ) : photoPending?.has(r.key) ? (
                                                            // Photo on its way: a soft shimmer reads as loading, the emoji would read as final.
                                                            <span aria-label="Loading photo" className="photo-shimmer absolute inset-0 block" />
                                                        ) : (
                                                            <span className="grid h-full place-items-center text-6xl drop-shadow-lg transition-transform duration-500 group-hover:scale-110">{r.emoji}</span>
                                                        )}
                                                        <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                                                        <span className="absolute right-2 top-2 flex gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    const added = toggleFavourite(r)
                                                                    toast(added ? 'Saved to favourites' : 'Removed from favourites', { type: added ? 'success' : 'info' })
                                                                }}
                                                                aria-label={fav ? `Unfavourite ${r.name}` : `Favourite ${r.name}`}
                                                                aria-pressed={fav}
                                                                className={`rounded-full p-1.5 backdrop-blur-md transition-all active:scale-90 ${fav ? 'bg-rose-500 text-white' : 'bg-black/30 text-white hover:bg-black/50'}`}
                                                            >
                                                                <Heart className="h-3.5 w-3.5" fill={fav ? 'currentColor' : 'none'} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    remove(r)
                                                                }}
                                                                aria-label={`Delete ${r.name}`}
                                                                className="rounded-full bg-black/30 p-1.5 text-white opacity-0 backdrop-blur-md transition-all hover:bg-rose-500 focus-visible:opacity-100 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-1 flex-col p-3.5">
                                                        <h3 className="line-clamp-1 text-[13.5px] font-extrabold text-[var(--text-main)] transition-colors group-hover:text-[var(--brand)]">{r.name}</h3>
                                                        <div className="mt-2 flex gap-2 text-[10.5px] font-bold">
                                                            {r.time && <span className="flex items-center gap-1 text-orange-400"><Clock className="h-3 w-3" />{r.time}</span>}
                                                            {r.calories ? <span className="flex items-center gap-1 text-rose-400"><Flame className="h-3 w-3" />{r.calories}</span> : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Tilt>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            <RecipeSheet recipe={sheet} onClose={() => setSheet(null)} />

            <Modal open={creating} onClose={() => setCreating(false)} title="Create with AI">
                <textarea
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    rows={3}
                    placeholder="What do you have? e.g. chicken, garlic, tomatoes, pasta"
                    className="w-full resize-none rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] p-3 text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]"
                />
                <button type="button" onClick={generate} disabled={generating || !ingredients.trim()} className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-black transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-40">
                    {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Writing…</> : <><ChefHat className="h-4 w-4" /> Write me a recipe</>}
                </button>
                {quota.limited && <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">{quota.remaining} free prompt{quota.remaining === 1 ? '' : 's'} left</p>}

                <AnimatePresence>
                    {draft && (
                        <motion.div
                            initial={{ opacity: 0, rotateX: -30, y: 10 }}
                            animate={{ opacity: 1, rotateX: 0, y: 0 }}
                            style={{ transformPerspective: 700 }}
                            className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{draft.emoji}</span>
                                <div className="min-w-0">
                                    <h3 className="truncate text-sm font-extrabold text-[var(--text-main)]">{draft.name}</h3>
                                    <p className="text-[11px] font-bold text-[var(--text-muted)]">{[draft.time, draft.calories && `${draft.calories} kcal`, `${draft.steps.length} steps`].filter(Boolean).join(' · ')}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                                {draft.ingredients.slice(0, 8).map((ing, i) => (
                                    <span key={`${i}-${ing}`} className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-[10.5px] text-[var(--text-main)]">{ing}</span>
                                ))}
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => setSheet(draft)} className="rounded-xl border border-[var(--border-light)] py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]">Preview</button>
                                <button type="button" onClick={keepDraft} className="rounded-xl bg-[var(--brand)] py-2 text-xs font-bold text-black hover:bg-[var(--brand-hover)]">Save</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Modal>
        </div>
    )
}
