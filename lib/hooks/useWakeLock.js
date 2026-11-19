"use client"

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Hold a screen wake lock while active.
 *
 * A phone propped against the hob locking itself mid-step is the most common
 * annoyance in any cooking app, and the Screen Wake Lock API fixes it in a few
 * lines. Support is not universal (notably older iOS Safari), so this reports
 * whether the lock actually took hold rather than assuming it did.
 *
 * The browser drops the lock whenever the tab is hidden, so it has to be
 * re-acquired on visibilitychange — otherwise it silently stops working the
 * first time the user checks a message.
 *
 * The setState calls below are flagged by react-hooks/set-state-in-effect.
 * They are the point of the hook: lock state lives in the browser, not in
 * React, and the only way to mirror it is to write it back when the platform
 * tells us it changed. Each disable is narrow and sits on the line it excuses.
 */
export default function useWakeLock(active) {
    const sentinel = useRef(null)
    const [held, setHeld] = useState(false)
    const [supported, setSupported] = useState(false)

    useEffect(() => {
        // Probed after mount: the server has no navigator, so testing during
        // render would make the first client paint disagree with its markup.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSupported(typeof navigator !== 'undefined' && 'wakeLock' in navigator)
    }, [])

    const release = useCallback(async () => {
        try {
            await sentinel.current?.release()
        } catch {
            // Already released, or the document lost focus first.
        }
        sentinel.current = null
        setHeld(false)
    }, [])

    const acquire = useCallback(async () => {
        if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return
        if (sentinel.current) return

        try {
            const lock = await navigator.wakeLock.request('screen')
            sentinel.current = lock
            setHeld(true)
            lock.addEventListener('release', () => {
                sentinel.current = null
                setHeld(false)
            })
        } catch {
            // Denied (battery saver, no user gesture, unsupported) — the page
            // still works, the screen just dims as it normally would.
            setHeld(false)
        }
    }, [])

    useEffect(() => {
        if (!active) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            release()
            return undefined
        }

        acquire()

        const onVisibility = () => {
            if (document.visibilityState === 'visible') acquire()
        }
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
            document.removeEventListener('visibilitychange', onVisibility)
            release()
        }
    }, [active, acquire, release])

    return { held, supported }
}
