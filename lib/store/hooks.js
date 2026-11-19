"use client"

import { useSyncExternalStore } from 'react'
import { readSnapshot, subscribeStore } from '@/lib/store/local'
import { dateKey } from '@/lib/date'

/**
 * Subscribe a component to one localStorage key.
 *
 * useSyncExternalStore gives us the stored value on the very first client
 * render (no empty-state flash, no setState-in-effect), the fallback during
 * SSR/hydration, and a re-render whenever any writer — this tab or another —
 * touches the key. `fallback` must be a stable reference (module constant).
 */
export const useStored = (key, fallback) =>
    useSyncExternalStore(
        subscribeStore,
        () => readSnapshot(key, fallback),
        () => fallback
    )

const noopSubscribe = () => () => {}

/** false during SSR and hydration, true afterwards. */
export const useHydrated = () =>
    useSyncExternalStore(noopSubscribe, () => true, () => false)

// One shared minute ticker for everything that needs to know "today".
const subscribeMinute = (callback) => {
    const id = setInterval(callback, 60_000)
    const onVisible = () => document.visibilityState === 'visible' && callback()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
        clearInterval(id)
        document.removeEventListener('visibilitychange', onVisible)
    }
}

/**
 * Today's local date key, or null before hydration. Rolls over at midnight
 * (checked each minute and whenever the tab becomes visible again), and keeps
 * `new Date()` out of render, which the React Compiler treats as impure.
 */
export const useToday = () => useSyncExternalStore(subscribeMinute, () => dateKey(), () => null)

/** Current hour (0–23), for greetings and meal-slot defaults; null before hydration. */
export const useHour = () => useSyncExternalStore(subscribeMinute, () => new Date().getHours(), () => null)
