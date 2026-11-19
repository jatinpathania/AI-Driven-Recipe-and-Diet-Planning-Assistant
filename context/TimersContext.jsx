"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { KEYS, readSnapshot, updateJSON, uid } from '@/lib/store/local'
import { useStored } from '@/lib/store/hooks'
import { playChime, primeAudio } from '@/lib/sound'
import { useToast } from '@/components/ui/Toaster'

/**
 * Kitchen-wide timers.
 *
 * Timers used to be local state on the Timer page: leave the page and they
 * silently died. They also counted down by decrementing once a second, which
 * drifts and freezes when the browser throttles a background tab.
 *
 * Here a running timer stores its end time (`endsAt`), so the remaining time is
 * always `endsAt - now` — correct after navigation, a reload, or an hour in a
 * background tab. One ticker runs only while something is counting, and a
 * finished timer chimes and toasts wherever you are in the kitchen.
 */

const TimersContext = createContext(null)
const EMPTY = []

export const useTimers = () => {
    const ctx = useContext(TimersContext)
    if (!ctx) throw new Error('useTimers must be used within TimersProvider')
    return ctx
}

const edit = (fn) => updateJSON(KEYS.timers, EMPTY, (list) => fn(Array.isArray(list) ? list : []))

export function TimersProvider({ children }) {
    const toast = useToast()
    const stored = useStored(KEYS.timers, EMPTY)
    const timers = Array.isArray(stored) ? stored : EMPTY
    const [now, setNow] = useState(null)

    const anyRunning = timers.some((t) => t.state === 'running')

    useEffect(() => {
        if (!anyRunning) return undefined

        const tick = () => {
            const t = Date.now()
            setNow(t)

            const due = (readSnapshot(KEYS.timers, EMPTY) || []).filter((x) => x.state === 'running' && x.endsAt <= t)
            if (!due.length) return

            const ids = new Set(due.map((x) => x.id))
            edit((list) => list.map((x) => (ids.has(x.id) ? { ...x, state: 'done', endsAt: null, remainingMs: 0 } : x)))
            playChime()
            due.forEach((x) => toast(`${x.emoji || '⏰'} ${x.label} — time's up!`, { type: 'success', duration: 8000 }))
        }

        const first = setTimeout(tick, 0)
        const id = setInterval(tick, 250)
        return () => {
            clearTimeout(first)
            clearInterval(id)
        }
    }, [anyRunning, toast])

    const addTimer = useCallback(({ label, emoji = '⏱️', minutes = 0, seconds = 0, autoStart = true, source = 'manual' }) => {
        const totalMs = Math.round((Number(minutes) * 60 + Number(seconds)) * 1000)
        if (!(totalMs > 0)) return null
        if (autoStart) primeAudio()

        const timer = {
            id: uid(),
            label: String(label || `${Math.round(totalMs / 60000)} min timer`).slice(0, 60),
            emoji,
            source,
            totalMs,
            remainingMs: totalMs,
            endsAt: autoStart ? Date.now() + totalMs : null,
            state: autoStart ? 'running' : 'paused',
        }
        edit((list) => [timer, ...list].slice(0, 12))
        return timer.id
    }, [])

    const pauseTimer = useCallback((id) => {
        const t = Date.now()
        edit((list) => list.map((x) => (x.id === id && x.state === 'running'
            ? { ...x, state: 'paused', remainingMs: Math.max(0, x.endsAt - t), endsAt: null }
            : x)))
    }, [])

    const resumeTimer = useCallback((id) => {
        primeAudio()
        const t = Date.now()
        edit((list) => list.map((x) => (x.id === id && x.state === 'paused'
            ? { ...x, state: 'running', endsAt: t + x.remainingMs }
            : x)))
    }, [])

    const resetTimer = useCallback((id) => {
        edit((list) => list.map((x) => (x.id === id ? { ...x, state: 'paused', remainingMs: x.totalMs, endsAt: null } : x)))
    }, [])

    const removeTimer = useCallback((id) => edit((list) => list.filter((x) => x.id !== id)), [])
    const clearDone = useCallback(() => edit((list) => list.filter((x) => x.state !== 'done')), [])

    const view = useMemo(
        () =>
            timers.map((x) => {
                const remainingMs = x.state === 'running' ? Math.max(0, x.endsAt - (now ?? x.endsAt - x.remainingMs)) : x.remainingMs
                return {
                    ...x,
                    remaining: Math.ceil(remainingMs / 1000),
                    progress: x.totalMs ? 1 - remainingMs / x.totalMs : 0,
                }
            }),
        [timers, now]
    )

    const value = useMemo(
        () => ({
            timers: view,
            running: view.filter((x) => x.state === 'running'),
            addTimer, pauseTimer, resumeTimer, resetTimer, removeTimer, clearDone,
        }),
        [view, addTimer, pauseTimer, resumeTimer, resetTimer, removeTimer, clearDone]
    )

    return <TimersContext.Provider value={value}>{children}</TimersContext.Provider>
}

export const formatClock = (seconds) => {
    const s = Math.max(0, Math.round(seconds))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const mm = String(m).padStart(2, '0')
    const ss = String(sec).padStart(2, '0')
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
