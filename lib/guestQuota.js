"use client"

import { useCallback, useEffect, useState } from 'react'
import { useGuestUser } from '@/context/GuestUserContext'

/**
 * Client side of the guest prompt allowance.
 *
 * Guests get GUEST_PROMPT_LIMIT AI prompts — chat on the landing page and in
 * the kitchen, recipe generation, calorie estimates and meal-plan fills all
 * draw from the same pool. The 4th attempt opens the sign-in / sign-up gate
 * instead of sending.
 *
 * The server keeps the authoritative count (lib/server/guestQuota.js) and
 * returns it with every AI response; this mirror exists so the UI can show
 * "2 free prompts left" and block before a round-trip. If the two disagree,
 * the server wins: a 403 GUEST_LIMIT response pins the mirror to the limit.
 */

export const GUEST_PROMPT_LIMIT = 3
const KEY = 'flavour:guest-prompts'
export const QUOTA_EVENT = 'flavour:guest-quota'
export const GATE_EVENT = 'flavour:guest-login-required'

const readUsed = () => {
    try {
        const n = parseInt(window.localStorage.getItem(KEY) || '0', 10)
        return Number.isFinite(n) && n > 0 ? Math.min(n, GUEST_PROMPT_LIMIT) : 0
    } catch {
        return 0
    }
}

const writeUsed = (n) => {
    try {
        window.localStorage.setItem(KEY, String(Math.max(0, Math.min(n, GUEST_PROMPT_LIMIT))))
    } catch {
        // storage blocked — the server count still enforces the limit
    }
    window.dispatchEvent(new CustomEvent(QUOTA_EVENT))
}

/** Opens the global sign-in / sign-up gate (rendered by components/ui/GuestGate). */
export const openGuestGate = (reason = 'limit') => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent(GATE_EVENT, { detail: { reason } }))
}

/** Shown in a chat right after a guest's last free prompt. */
export const LAST_PROMPT_NOTICE = 'That was your last free prompt. **Sign in** or create a free account to keep cooking with AI.'

/** True when an API error is the server saying the guest allowance is spent. */
export const isGuestLimitError = (err) => err?.status === 403 && err?.data?.code === 'GUEST_LIMIT'

export function useGuestQuota() {
    const { isGuest, mounted } = useGuestUser()
    const [used, setUsed] = useState(0)

    useEffect(() => {
        const sync = () => setUsed(readUsed())
        sync()
        window.addEventListener(QUOTA_EVENT, sync)
        window.addEventListener('storage', sync)
        return () => {
            window.removeEventListener(QUOTA_EVENT, sync)
            window.removeEventListener('storage', sync)
        }
    }, [])

    // Until auth has resolved we don't know who this is; treat them as
    // unlimited rather than flash a "0 left" chip at a signed-in user.
    const limited = mounted && isGuest
    const remaining = limited ? Math.max(0, GUEST_PROMPT_LIMIT - used) : Infinity

    /** Call before an AI request. Returns false (and opens the gate) when spent. */
    const guard = useCallback(() => {
        if (!limited) return true
        if (readUsed() >= GUEST_PROMPT_LIMIT) {
            openGuestGate('limit')
            return false
        }
        return true
    }, [limited])

    /**
     * Call after every guest AI request that wasn't refused, whether it was
     * answered or failed: each send counts. Pass the `quota` the server
     * returned; without one (request never reached us) one is counted locally.
     * Never lowers the count. Returns the prompts left (Infinity if signed in).
     */
    const record = useCallback(
        (serverQuota) => {
            if (!limited) return Infinity
            const local = readUsed() + 1
            const next = serverQuota && Number.isFinite(serverQuota.used) ? Math.max(serverQuota.used, readUsed()) : local
            writeUsed(next)
            return Math.max(0, GUEST_PROMPT_LIMIT - next)
        },
        [limited]
    )

    /** Call when a request failed with GUEST_LIMIT. */
    const exhaust = useCallback(() => {
        writeUsed(GUEST_PROMPT_LIMIT)
        openGuestGate('limit')
    }, [])

    return { limited, limit: GUEST_PROMPT_LIMIT, used, remaining, guard, record, exhaust }
}
