'use client'

/**
 * Give every saved recipe without a picture a real photo of the dish
 * (GET /api/recipes/photo), one request at a time, and save it on the recipe
 * so it shows everywhere (cards, recipe sheet, dashboard) from then on.
 *
 * A recipe with no usable photo is marked `photoCheckedAt` and skipped for a
 * week. If the server says the day's searches are used up, nothing more is
 * asked this session.
 */

import { useEffect } from 'react'
import { getRecipePhoto } from '@/utils/api'
import { recipeKey } from '@/lib/store/local'

const RETRY_AFTER_MS = 7 * 24 * 60 * 60 * 1000

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
    useEffect(() => {
        if (!ready || pausedForSession) return undefined
        const todo = recipes.filter((r) => needsPhoto(r) && !inFlight.has(keyOf(r)))
        if (!todo.length) return undefined

        let cancelled = false
        ;(async () => {
            for (const r of todo) {
                const key = keyOf(r)
                if (cancelled || pausedForSession) return
                if (inFlight.has(key)) continue
                inFlight.add(key)
                try {
                    const res = await getRecipePhoto(r.name || r.recipeName)
                    if (res?.url) updateRecipe(key, { image: res.url })
                    else if (res?.reason === 'NOT_FOUND') updateRecipe(key, { photoCheckedAt: Date.now() })
                    else if (res?.reason) {
                        pausedForSession = true
                        return
                    }
                } catch {
                    // Server hiccup: leave it for the next visit.
                    return
                } finally {
                    inFlight.delete(key)
                }
            }
        })()

        return () => {
            cancelled = true
        }
    }, [recipes, updateRecipe, ready])
}
