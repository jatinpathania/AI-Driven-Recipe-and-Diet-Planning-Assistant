/**
 * Thin localStorage wrapper for the kitchen's client-side data.
 *
 * Writes broadcast a `flavour:store` event so the sidebar, the command palette
 * and any open page stay in sync without prop-drilling. The event carries the
 * key and an optional origin id, so a writer can ignore its own echo instead of
 * re-reading and re-parsing what it just wrote.
 *
 * All reads are defensive: a quota error, private-browsing mode, or a value
 * someone hand-edited into invalid JSON must never take a page down.
 */

export const KEYS = {
    recipes: 'flavourai_recipes',
    favourites: 'flavourai_favourites',
    shopping: 'flavourai_shopping',
    settings: 'flavourai_settings',
    cookHistory: 'flavourai_cook_history',
    calories: 'flavourai_calories',
    calorieGoal: 'flavourai_calorie_goal',
    // v1 keyed meals by weekday name only ("Monday_Dinner"), so every week
    // showed the same plan. v2 is keyed by real date.
    mealPlan: 'flavourai_mealplan_v2',
    activeRecipe: 'flavourai_cooking_recipe',
    cookProgress: 'flavourai_cook_progress',
    timers: 'flavourai_timers',
    // Week planner: the vegetables and staples last picked, and the last plan's dates.
    pantry: 'flavourai_pantry',
}

/** Keys from older builds, read once for migration. */
export const LEGACY_KEYS = {
    mealPlanV1: 'flavourai_mealplan',
    dashboardCalorieLogs: 'flavourai_calorie_logs',
    addToMeal: 'flavourai_add_to_meal',
}

export const STORE_EVENT = 'flavour:store'

export const readJSON = (key, fallback) => {
    if (typeof window === 'undefined') return fallback
    try {
        const raw = window.localStorage.getItem(key)
        if (raw === null) return fallback
        const parsed = JSON.parse(raw)
        return parsed ?? fallback
    } catch {
        return fallback
    }
}

/* ── Snapshot cache for useSyncExternalStore ──────────────────
   React needs getSnapshot to return the *same object* until the data really
   changes. We keep the last raw string per key and only re-parse when the
   raw string differs. Writes seed the cache with the object just written, so
   a write never costs a parse. If storage is blocked, values live in
   `memory` for the session instead of vanishing.                         */

const cache = new Map()
const memory = new Map()

export const readSnapshot = (key, fallback) => {
    if (typeof window === 'undefined') return fallback
    if (memory.has(key)) return memory.get(key)

    let raw = null
    try {
        raw = window.localStorage.getItem(key)
    } catch {
        return fallback
    }

    const hit = cache.get(key)
    if (hit && hit.raw === raw) return hit.value

    let value = fallback
    if (raw !== null) {
        try {
            value = JSON.parse(raw) ?? fallback
        } catch {
            value = fallback
        }
    }
    cache.set(key, { raw, value })
    return value
}

export const subscribeStore = (callback) => {
    window.addEventListener(STORE_EVENT, callback)
    window.addEventListener('storage', callback)
    return () => {
        window.removeEventListener(STORE_EVENT, callback)
        window.removeEventListener('storage', callback)
    }
}

export const writeJSON = (key, value, origin = null) => {
    if (typeof window === 'undefined') return

    let raw
    try {
        raw = JSON.stringify(value)
    } catch {
        return
    }

    try {
        window.localStorage.setItem(key, raw)
        memory.delete(key)
    } catch {
        // Quota exceeded or storage blocked — keep it in memory so the UI stays
        // correct for this session; it just won't survive a reload.
        memory.set(key, value)
    }
    cache.set(key, { raw, value })

    try {
        window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { key, origin } }))
    } catch {
        // CustomEvent unavailable — listeners just won't hear about this write
    }
}

/** Read-modify-write against the freshest value, never a stale closure. */
export const updateJSON = (key, fallback, updater) => {
    const next = updater(readSnapshot(key, fallback))
    writeJSON(key, next)
    return next
}

export const removeKey = (key) => {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.removeItem(key)
    } catch {
        // storage blocked
    }
    memory.delete(key)
    cache.delete(key)
    try {
        window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { key } }))
    } catch {
        // ignore
    }
}

/** Stable identity for a recipe across the library, the AI, and the meal plan. */
export const recipeKey = (recipe) => {
    const name = typeof recipe === 'string' ? recipe : recipe?.name || recipe?.recipeName || ''
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

let seq = 0
export const uid = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`

/**
 * Hand a recipe to cook mode from anywhere — including the landing page, which
 * sits outside the kitchen's data provider.
 */
export const setActiveRecipe = (recipe) => {
    writeJSON(KEYS.activeRecipe, recipe)
    writeJSON(KEYS.cookProgress, { key: recipeKey(recipe), step: 0, done: [], startedAt: null })
}
