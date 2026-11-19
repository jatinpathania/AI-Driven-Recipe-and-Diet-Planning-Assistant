"use client"

import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react'
import {
    KEYS, LEGACY_KEYS, readJSON, readSnapshot, writeJSON, updateJSON, removeKey, recipeKey, uid,
} from '@/lib/store/local'
import { useStored, useHydrated, useToday } from '@/lib/store/hooks'
import { normalizeRecipe, SAMPLE_RECIPES } from '@/lib/recipe/normalize'
import { dateKey, addDays, weekKeys, DAY_NAMES, mealSlotNow, parseDateKey } from '@/lib/date'

/**
 * Single source of truth for everything the kitchen keeps on the device.
 *
 * Every page used to read and write localStorage on its own, so the dashboard
 * showed server numbers the calorie page never wrote, the meal plan wiped
 * itself when a recipe was handed over from the dashboard, and two quick
 * updates in a row could overwrite each other through stale closures.
 *
 * Now: state is read with useSyncExternalStore (lib/store/hooks) and every
 * mutation is a read-modify-write against the freshest stored value
 * (updateJSON), so order is always respected and every subscriber — sidebar,
 * dashboard, palette, the page itself — re-renders together.
 */

const KitchenDataContext = createContext(null)

export const useKitchenData = () => {
    const ctx = useContext(KitchenDataContext)
    if (!ctx) throw new Error('useKitchenData must be used within KitchenDataProvider')
    return ctx
}

const EMPTY_ARR = []
const EMPTY_OBJ = {}

export const DEFAULT_SETTINGS = {
    dailyCalorieGoal: 2000,
    diet: 'none',
    skill: 'intermediate',
    units: 'metric',
    maxCookTime: 60,
    avoid: [],
}

/** Chronological, which is how the dashboard and planner list them. */
export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Snack', 'Dinner']
export const SLOT_EMOJI = { Breakfast: '🌅', Lunch: '☀️', Snack: '🍿', Dinner: '🌙' }

/** Rough aisle grouping so the shopping list isn't one undifferentiated column. */
const AISLES = [
    { id: 'produce', match: /lettuce|tomato|onion|garlic|pepper(?!corn)|spinach|avocado|lemon|lime|herb|basil|parsley|dill|cucumber|carrot|potato|mushroom|ginger|chilli|chili|broccoli|peas|asparagus|berry|berries|banana|apple|scallion|celery|corn|kale|zucchini|olive(?! oil)/i },
    { id: 'protein', match: /chicken|beef|pork|lamb|salmon|fish|shrimp|prawn|tofu|egg|turkey|bacon|pancetta|sausage|mince|paneer/i },
    { id: 'dairy', match: /milk|cheese|butter|yogurt|yoghurt|cream|feta|parmesan|pecorino|mozzarella/i },
    { id: 'pantry', match: /rice|pasta|spaghetti|noodle|ramen|flour|sugar|oil|vinegar|sauce|soy|stock|broth|bean|lentil|chickpea|quinoa|oat|bread|sourdough|spice|salt|pepper|honey|tahini|miso|seed|nut|shell|flakes/i },
]

export const aisleFor = (name = '') => AISLES.find((a) => a.match.test(name))?.id || 'other'

export const AISLE_LABELS = {
    produce: 'Produce',
    protein: 'Meat & Protein',
    dairy: 'Dairy',
    pantry: 'Pantry',
    other: 'Other',
}

const asArray = (v) => (Array.isArray(v) ? v : EMPTY_ARR)
const asObject = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : EMPTY_OBJ)

/** "🍝 Pasta Carbonara (520 kcal)" → { emoji, name, calories } */
const parseMealLabel = (label) => {
    let name = String(label || '').trim()
    let emoji = ''
    const em = name.match(/^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s*/u)
    if (em) {
        emoji = em[1]
        name = name.slice(em[0].length)
    }
    let calories = null
    const kc = name.match(/\s*\((\d+)\s*kcal\)\s*$/i)
    if (kc) {
        calories = parseInt(kc[1], 10)
        name = name.slice(0, kc.index)
    }
    return { name: name.trim(), emoji, calories }
}

const toMeal = (meal) => {
    const base = typeof meal === 'string' ? parseMealLabel(meal) : { ...parseMealLabel(meal?.name), ...meal }
    const name = String(base.name || '').trim() || 'Meal'
    return {
        id: base.id || uid(),
        name,
        emoji: base.emoji || '',
        calories: Number.isFinite(Number(base.calories)) && Number(base.calories) > 0 ? Math.round(Number(base.calories)) : null,
        recipeKey: base.recipeKey || recipeKey(name),
        completed: !!base.completed,
    }
}

const slotForCategory = (category) => {
    const c = String(category || '').toLowerCase()
    if (c === 'breakfast') return 'Breakfast'
    if (c === 'lunch') return 'Lunch'
    if (c === 'snack') return 'Snack'
    if (c === 'dinner') return 'Dinner'
    return null
}

/* ── One-time migrations from earlier storage shapes ───────── */

let migrated = false

const runMigrations = () => {
    if (migrated || typeof window === 'undefined') return
    migrated = true

    if (readJSON(KEYS.recipes, null) === null) {
        writeJSON(KEYS.recipes, SAMPLE_RECIPES.map(({ diet, ...r }) => r))
    }

    // The calorie page owned the goal before settings existed.
    const storedSettings = readJSON(KEYS.settings, null)
    const legacyGoal = parseInt(window.localStorage.getItem(KEYS.calorieGoal) || '', 10)
    if (Number.isFinite(legacyGoal) && legacyGoal > 0 && !storedSettings?.dailyCalorieGoal) {
        writeJSON(KEYS.settings, { ...DEFAULT_SETTINGS, ...(storedSettings || {}), dailyCalorieGoal: legacyGoal })
    }

    // v1 meal plan: { "Monday_Dinner": [...] } with no week — place it on this week.
    const v1 = readJSON(LEGACY_KEYS.mealPlanV1, null)
    if (v1 && typeof v1 === 'object') {
        const week = weekKeys(0)
        updateJSON(KEYS.mealPlan, EMPTY_OBJ, (plan) => {
            const next = { ...asObject(plan) }
            for (const [k, meals] of Object.entries(v1)) {
                const [day, slot] = k.split('_')
                const idx = DAY_NAMES.indexOf(day)
                if (idx < 0 || !MEAL_SLOTS.includes(slot) || !Array.isArray(meals)) continue
                const date = week[idx]
                const daySlots = { ...asObject(next[date]) }
                daySlots[slot] = [...asArray(daySlots[slot]), ...meals.map(toMeal)]
                next[date] = daySlots
            }
            return next
        })
        removeKey(LEGACY_KEYS.mealPlanV1)
    }

    // The dashboard used to keep its own quick-log list when the server was down.
    const extra = readJSON(LEGACY_KEYS.dashboardCalorieLogs, null)
    if (Array.isArray(extra) && extra.length) {
        updateJSON(KEYS.calories, EMPTY_OBJ, (log) => {
            const next = { ...asObject(log) }
            for (const e of extra) {
                const day = dateKey(new Date(e.date || Date.now()))
                next[day] = [...asArray(next[day]), { id: uid(), name: e.food || 'Food', calories: Number(e.calories) || 0, portion: '1 serving', time: '' }]
            }
            return next
        })
        removeKey(LEGACY_KEYS.dashboardCalorieLogs)
    }

    // A recipe handed to the planner by an older page.
    const pending = readJSON(LEGACY_KEYS.addToMeal, null)
    if (pending?.name) {
        const today = dateKey()
        const slot = slotForCategory(pending.category) || 'Dinner'
        updateJSON(KEYS.mealPlan, EMPTY_OBJ, (plan) => {
            const day = { ...asObject(asObject(plan)[today]) }
            day[slot] = [...asArray(day[slot]), toMeal(pending)]
            return { ...asObject(plan), [today]: day }
        })
    }
    if (pending !== null) removeKey(LEGACY_KEYS.addToMeal)
}

/* ── Provider ─────────────────────────────────────────────── */

export const KitchenDataProvider = ({ children }) => {
    const hydrated = useHydrated()
    const today = useToday()

    const recipes = asArray(useStored(KEYS.recipes, EMPTY_ARR))
    const favourites = asArray(useStored(KEYS.favourites, EMPTY_ARR))
    const shopping = asArray(useStored(KEYS.shopping, EMPTY_ARR))
    const storedSettings = useStored(KEYS.settings, null)
    const cookHistory = asArray(useStored(KEYS.cookHistory, EMPTY_ARR))
    const calories = asObject(useStored(KEYS.calories, EMPTY_OBJ))
    const mealPlan = asObject(useStored(KEYS.mealPlan, EMPTY_OBJ))
    const activeRecipe = useStored(KEYS.activeRecipe, null)
    const cookProgress = useStored(KEYS.cookProgress, null)

    useEffect(() => {
        runMigrations()
    }, [])

    const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...asObject(storedSettings) }), [storedSettings])

    /* ── Recipe library ───────────────────────────────────── */

    /** Adds a recipe unless one with the same name is already saved. Returns { recipe, added }. */
    const saveRecipe = useCallback((raw, { overwrite = false } = {}) => {
        const recipe = normalizeRecipe(raw)
        let added = false
        let stored = recipe
        updateJSON(KEYS.recipes, EMPTY_ARR, (list) => {
            const arr = asArray(list)
            const i = arr.findIndex((r) => (r.key || recipeKey(r)) === recipe.key)
            if (i === -1) {
                added = true
                return [recipe, ...arr]
            }
            if (!overwrite) {
                stored = arr[i]
                return arr
            }
            const next = [...arr]
            next[i] = { ...arr[i], ...recipe, id: arr[i].id }
            stored = next[i]
            return next
        })
        return { recipe: stored, added }
    }, [])

    const deleteRecipe = useCallback((id) => {
        updateJSON(KEYS.recipes, EMPTY_ARR, (list) => asArray(list).filter((r) => r.id !== id))
    }, [])

    const findRecipe = useCallback(
        (nameOrKey) => {
            const k = recipeKey(nameOrKey)
            return recipes.find((r) => (r.key || recipeKey(r)) === k) || null
        },
        [recipes]
    )

    /* ── Favourites ───────────────────────────────────────── */

    const favouriteKeys = useMemo(() => new Set(favourites.map((f) => f.key)), [favourites])
    const isFavourite = useCallback((recipe) => favouriteKeys.has(recipeKey(recipe)), [favouriteKeys])

    const toggleFavourite = useCallback((raw) => {
        const recipe = normalizeRecipe(raw)
        let added = false
        updateJSON(KEYS.favourites, EMPTY_ARR, (list) => {
            const arr = asArray(list)
            if (arr.some((f) => f.key === recipe.key)) return arr.filter((f) => f.key !== recipe.key)
            added = true
            return [{ ...recipe, savedAt: new Date().toISOString() }, ...arr]
        })
        return added
    }, [])

    /* ── Shopping list ────────────────────────────────────── */

    const addShoppingItems = useCallback((names, source = '') => {
        const incoming = (Array.isArray(names) ? names : [names])
            .map((n) => (typeof n === 'string' ? n : n?.name || ''))
            .map((n) => n.trim())
            .filter(Boolean)
        if (!incoming.length) return 0

        let added = 0
        updateJSON(KEYS.shopping, EMPTY_ARR, (list) => {
            const arr = asArray(list)
            const seen = new Set(arr.map((i) => i.name.toLowerCase()))
            const fresh = []
            for (const name of incoming) {
                if (seen.has(name.toLowerCase())) continue
                seen.add(name.toLowerCase())
                fresh.push({ id: uid(), name, checked: false, aisle: aisleFor(name), source, addedAt: new Date().toISOString() })
            }
            added = fresh.length
            return fresh.length ? [...fresh, ...arr] : arr
        })
        return added
    }, [])

    const updateShopping = useCallback((fn) => updateJSON(KEYS.shopping, EMPTY_ARR, (list) => fn(asArray(list))), [])
    const toggleShoppingItem = useCallback((id) => updateShopping((l) => l.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))), [updateShopping])
    const removeShoppingItem = useCallback((id) => updateShopping((l) => l.filter((i) => i.id !== id)), [updateShopping])
    const clearCheckedShopping = useCallback(() => updateShopping((l) => l.filter((i) => !i.checked)), [updateShopping])
    const clearShopping = useCallback(() => updateShopping(() => []), [updateShopping])

    /* ── Settings ─────────────────────────────────────────── */

    const updateSettings = useCallback((patch) => {
        updateJSON(KEYS.settings, null, (s) => ({ ...DEFAULT_SETTINGS, ...asObject(s), ...patch }))
    }, [])

    /* ── Calorie log ({ [dateKey]: entry[] }) ─────────────── */

    const caloriesFor = useCallback((key) => asArray(calories[key]), [calories])
    const totalFor = useCallback((key) => asArray(calories[key]).reduce((s, e) => s + (Number(e.calories) || 0), 0), [calories])

    const addCalorieEntry = useCallback((entry, key) => {
        const day = key || dateKey()
        const item = {
            id: uid(),
            name: String(entry.name || 'Food').trim(),
            calories: Math.max(0, Math.round(Number(entry.calories) || 0)),
            portion: entry.portion || '1 serving',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ...(entry.mealId ? { mealId: entry.mealId } : {}),
        }
        updateJSON(KEYS.calories, EMPTY_OBJ, (log) => {
            const l = asObject(log)
            return { ...l, [day]: [...asArray(l[day]), item] }
        })
        return item
    }, [])

    const removeCalorieEntries = useCallback((key, predicate) => {
        updateJSON(KEYS.calories, EMPTY_OBJ, (log) => {
            const l = { ...asObject(log) }
            const kept = asArray(l[key]).filter((e) => !predicate(e))
            if (kept.length) l[key] = kept
            else delete l[key]
            return l
        })
    }, [])

    const removeCalorieEntry = useCallback((id, key) => removeCalorieEntries(key, (e) => e.id === id), [removeCalorieEntries])

    /* ── Meal plan ({ [dateKey]: { [slot]: meal[] } }) ────── */

    const mealsFor = useCallback((key) => asObject(mealPlan[key]), [mealPlan])

    const editDay = useCallback((key, fn) => {
        updateJSON(KEYS.mealPlan, EMPTY_OBJ, (plan) => {
            const p = asObject(plan)
            const day = fn({ ...asObject(p[key]) })
            const next = { ...p }
            if (Object.values(day).some((list) => asArray(list).length)) next[key] = day
            else delete next[key]
            return next
        })
    }, [])

    const addMeal = useCallback((key, slot, meal) => {
        const m = toMeal(meal)
        editDay(key, (day) => ({ ...day, [slot]: [...asArray(day[slot]), m] }))
        return m
    }, [editDay])

    /** Add several slots in one write (the AI "fill this day" result). */
    const addMeals = useCallback((key, bySlot) => {
        editDay(key, (day) => {
            const next = { ...day }
            for (const [slot, meal] of Object.entries(bySlot || {})) {
                if (!MEAL_SLOTS.includes(slot) || !meal) continue
                next[slot] = [...asArray(next[slot]), toMeal(meal)]
            }
            return next
        })
    }, [editDay])

    const removeMeal = useCallback((key, slot, id) => {
        editDay(key, (day) => ({ ...day, [slot]: asArray(day[slot]).filter((m) => m.id !== id) }))
        removeCalorieEntries(key, (e) => e.mealId === id)
    }, [editDay, removeCalorieEntries])

    /** Ticking a meal off logs its calories; unticking takes them back out. */
    const toggleMeal = useCallback((key, slot, id) => {
        const meal = asArray(asObject(readSnapshot(KEYS.mealPlan, EMPTY_OBJ)[key])[slot]).find((m) => m.id === id)
        if (!meal) return
        const completed = !meal.completed
        editDay(key, (day) => ({ ...day, [slot]: asArray(day[slot]).map((m) => (m.id === id ? { ...m, completed } : m)) }))

        if (completed && meal.calories) addCalorieEntry({ name: meal.name, calories: meal.calories, portion: slot, mealId: id }, key)
        if (!completed) removeCalorieEntries(key, (e) => e.mealId === id)
        return completed
    }, [editDay, addCalorieEntry, removeCalorieEntries])

    /** Put a recipe on the plan (today by default, slot from its category or the time of day). */
    const planRecipe = useCallback((raw, key, slot) => {
        const { recipe } = saveRecipe(raw)
        const day = key || dateKey()
        const target = slot || slotForCategory(recipe.category) || mealSlotNow()
        addMeal(day, target, { name: recipe.name, emoji: recipe.emoji, calories: recipe.calories, recipeKey: recipe.key })
        return { key: day, slot: target, recipe }
    }, [saveRecipe, addMeal])

    /**
     * Every ingredient of the recipes planned on `keys` (date keys), matched
     * back to the library by recipe key, falling back to a loose name match
     * for meals typed in by hand. Returns { ingredients, meals, matched }.
     */
    const ingredientsForDays = useCallback(
        (keys) => {
            const meals = keys.flatMap((k) => MEAL_SLOTS.flatMap((s) => asArray(asObject(mealPlan[k])[s])))
            const byKey = new Map(recipes.map((r) => [r.key || recipeKey(r), r]))
            const ingredients = []
            let matched = 0
            for (const meal of meals) {
                const lower = meal.name.toLowerCase()
                const recipe = byKey.get(meal.recipeKey)
                    || recipes.find((r) => {
                        const n = String(r.name || '').toLowerCase()
                        return n && (lower.includes(n) || n.includes(lower))
                    })
                if (recipe) {
                    matched++
                    ingredients.push(...asArray(recipe.ingredients))
                }
            }
            return { ingredients, meals: meals.length, matched }
        },
        [mealPlan, recipes]
    )

    /* ── Cooking ──────────────────────────────────────────── */

    const startCooking = useCallback((raw) => {
        const { recipe } = saveRecipe(raw)
        writeJSON(KEYS.activeRecipe, recipe)
        writeJSON(KEYS.cookProgress, { key: recipe.key, step: 0, done: [], total: recipe.steps.length, startedAt: null, finishedAt: null })
        return recipe
    }, [saveRecipe])

    const updateCookProgress = useCallback((patch) => {
        updateJSON(KEYS.cookProgress, null, (p) => ({ ...asObject(p), ...patch }))
    }, [])

    const recordCooked = useCallback((raw) => {
        const recipe = normalizeRecipe(raw)
        const entry = { key: recipe.key, name: recipe.name, emoji: recipe.emoji, calories: recipe.calories, cookedAt: new Date().toISOString() }
        // Every cook is kept (capped): de-duplicating by recipe used to delete
        // yesterday's entry when you cooked the same dish today, breaking the streak.
        updateJSON(KEYS.cookHistory, EMPTY_ARR, (list) => [entry, ...asArray(list)].slice(0, 90))
    }, [])

    const finishCooking = useCallback(() => {
        const recipe = readSnapshot(KEYS.activeRecipe, null)
        if (recipe) recordCooked(recipe)
        updateCookProgress({ finishedAt: new Date().toISOString() })
    }, [recordCooked, updateCookProgress])

    /** Live cook session for the dashboard / sidebar, or null. */
    const activeCook = useMemo(() => {
        if (!activeRecipe?.name || !cookProgress?.startedAt || cookProgress.finishedAt) return null
        if (cookProgress.key && cookProgress.key !== recipeKey(activeRecipe)) return null
        const total = activeRecipe.steps?.length || cookProgress.total || 0
        const done = asArray(cookProgress.done).length
        return { recipe: activeRecipe, step: Math.min((cookProgress.step || 0) + 1, total || 1), total, done, pct: total ? Math.round((done / total) * 100) : 0 }
    }, [activeRecipe, cookProgress])

    const recentlyCooked = useMemo(() => {
        const seen = new Set()
        return cookHistory.filter((h) => !seen.has(h.key) && seen.add(h.key)).slice(0, 5)
    }, [cookHistory])

    /** Consecutive cooking days ending today (or yesterday), plus a 7-day strip. */
    const streak = useMemo(() => {
        if (!today) return { count: 0, thisWeek: 0, week: [] }
        const days = new Set(cookHistory.map((h) => dateKey(new Date(h.cookedAt))))
        let count = 0
        let cursor = days.has(today) ? today : addDays(today, -1)
        while (days.has(cursor)) {
            count++
            cursor = addDays(cursor, -1)
        }
        const week = Array.from({ length: 7 }, (_, i) => {
            const key = addDays(today, i - 6)
            return { key, cooked: days.has(key), label: DAY_NAMES[(parseDateKey(key).getDay() + 6) % 7].slice(0, 1) }
        })
        return { count, thisWeek: week.filter((d) => d.cooked).length, week }
    }, [cookHistory, today])

    /** Whole days between an ISO timestamp and today ("Today", "Yesterday", "3 days ago"). */
    const relativeDay = useCallback(
        (iso) => {
            if (!today || !iso) return ''
            const diff = Math.round((parseDateKey(today) - parseDateKey(dateKey(new Date(iso)))) / 86400000)
            if (diff <= 0) return 'Today'
            if (diff === 1) return 'Yesterday'
            if (diff < 7) return `${diff} days ago`
            return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        },
        [today]
    )

    /** Wipe local kitchen data and re-seed the sample recipes. */
    const resetKitchen = useCallback(() => {
        Object.values(KEYS).forEach(removeKey)
        writeJSON(KEYS.recipes, SAMPLE_RECIPES.map(({ diet, ...r }) => r))
    }, [])

    const value = useMemo(
        () => ({
            hydrated, today,
            recipes, saveRecipe, deleteRecipe, findRecipe,
            favourites, isFavourite, toggleFavourite,
            shopping, addShoppingItems, toggleShoppingItem, removeShoppingItem, clearCheckedShopping, clearShopping,
            settings, updateSettings,
            calories, caloriesFor, totalFor, addCalorieEntry, removeCalorieEntry,
            mealPlan, mealsFor, addMeal, addMeals, removeMeal, toggleMeal, planRecipe, ingredientsForDays,
            activeRecipe, cookProgress, activeCook, startCooking, updateCookProgress, finishCooking,
            cookHistory, recentlyCooked, recordCooked, streak, relativeDay,
            resetKitchen,
        }),
        [
            hydrated, today, recipes, saveRecipe, deleteRecipe, findRecipe,
            favourites, isFavourite, toggleFavourite,
            shopping, addShoppingItems, toggleShoppingItem, removeShoppingItem, clearCheckedShopping, clearShopping,
            settings, updateSettings,
            calories, caloriesFor, totalFor, addCalorieEntry, removeCalorieEntry,
            mealPlan, mealsFor, addMeal, addMeals, removeMeal, toggleMeal, planRecipe, ingredientsForDays,
            activeRecipe, cookProgress, activeCook, startCooking, updateCookProgress, finishCooking,
            cookHistory, recentlyCooked, recordCooked, streak, relativeDay, resetKitchen,
        ]
    )

    return <KitchenDataContext.Provider value={value}>{children}</KitchenDataContext.Provider>
}
