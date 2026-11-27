'use client'

/**
 * Give every saved recipe without a picture a real photo of the dish
 * (GET /api/recipes/photo) and save it on the recipe so it shows everywhere
 * (cards, recipe sheet, dashboard) from then on.
 *
 * Runs from KitchenDataProvider, so a recipe saved anywhere in the kitchen
 * (chat, planner, ...) starts getting its photo right away, not when the
 * Recipes page is opened. A few dishes are looked up at once: a first-time
 * lookup takes a few seconds on the server, one at a time made the last card
 * wait for all the others.
 *
 * A recipe with no usable photo is marked `photoCheckedAt` and skipped for a
 * week. If the server says the day's searches are used up, nothing more is
 * asked this session.
 *
 * @returns {Set<string>} keys of recipes whose photo is being looked up now
 */

import { useEffect, useState } from 'react'
import { getRecipePhoto } from '@/utils/api'
import { recipeKey } from '@/lib/store/local'

const RETRY_AFTER_MS = 7 * 24 * 60 * 60 * 1000
const PARALLEL = 4

// Module-level so a re-render (every saved photo updates `recipes`) never
// asks for the same dish twice, and a "daily limit" answer sticks.
const inFlight = new Set()
let pausedForSession = false

const keyOf = (r) => r.key || recipeKey(r)

const needsPhoto = (r) =>
    r && !r.image && !r.imageUrl && keyOf(r) && !(r.photoCheckedAt && Date.now() - r.photoCheckedAt < RETRY_AFTER_MS)

/**
 * @param {object[]} recipes    raw saved recipes
 * @param {(key: string, patch: object) => void} updateRecipe  from KitchenDataContext
 * @param {boolean} ready       true once saved data has loaded
 */
export function useRecipePhotos(recipes, updateRecipe, ready) {
    const [pending, setPending] = useState(() => new Set())

    useEffect(() => {
        if (!ready || pausedForSession) return

        const seen = new Set()
        const todo = recipes.filter((r) => {
            const key = keyOf(r)
            if (!needsPhoto(r) || inFlight.has(key) || seen.has(key)) return false
            seen.add(key)
            return true
        })
        if (!todo.length) return

        const mark = (key, on) =>
            setPending((prev) => {
                const next = new Set(prev)
                if (on) next.add(key)
                else next.delete(key)
                return next
            })

        const lookUp = async (r) => {
            const key = keyOf(r)
            try {
                const res = await getRecipePhoto(r.name || r.recipeName)
                if (res?.url) updateRecipe(key, { image: res.url })
                else if (res?.reason === 'NOT_FOUND') updateRecipe(key, { photoCheckedAt: Date.now() })
                else if (res?.reason) pausedForSession = true
            } catch {
                // Server hiccup: leave it for the next visit.
            } finally {
                inFlight.delete(key)
                mark(key, false)
            }
        }

        // Each worker takes the next dish until none are left. Claimed up front,
        // so the effect re-running while they work (photos land in `recipes`)
        // can't start the same dishes again. Not cancelled on re-run either:
        // a photo found after leaving the page is still worth saving.
        const queue = [...todo]
        queue.forEach((r) => {
            inFlight.add(keyOf(r))
            mark(keyOf(r), true)
        })
        const worker = async () => {
            while (queue.length && !pausedForSession) await lookUp(queue.shift())
            // Paused mid-way: release whatever is left for a later visit.
            while (queue.length) {
                const key = keyOf(queue.shift())
                inFlight.delete(key)
                mark(key, false)
            }
        }
        for (let i = 0; i < Math.min(PARALLEL, queue.length); i++) worker()
    }, [recipes, updateRecipe, ready])

    return pending
}
