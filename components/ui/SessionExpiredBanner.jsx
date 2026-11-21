"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { signIn, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Sparkles, Infinity as InfinityIcon, BookmarkCheck, CalendarDays, X } from 'lucide-react'
import { clearUserData } from '@/utils/api'
import { markSigningOut } from '@/context/GuestUserContext'
import { GATE_EVENT, GUEST_PROMPT_LIMIT } from '@/lib/guestQuota'
import './gate.css'

/** Kept for older callers; opens the same gate as lib/guestQuota.openGuestGate. */
export function triggerGuestLoginPopup() {
    window.dispatchEvent(new CustomEvent(GATE_EVENT, { detail: { reason: 'limit' } }))
}

const PERKS = [
    { Icon: InfinityIcon, label: 'Unlimited AI' },
    { Icon: BookmarkCheck, label: 'Synced recipes' },
    { Icon: CalendarDays, label: 'Meal plans' },
]

const GoogleMark = () => (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
)

function GuestGate({ open, onClose }) {
    const router = useRouter()
    const pathname = usePathname()
    const primaryRef = useRef(null)

    useEffect(() => {
        if (!open) return
        const onKey = (e) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', onKey)
        const t = setTimeout(() => primaryRef.current?.focus(), 120)
        return () => {
            window.removeEventListener('keydown', onKey)
            clearTimeout(t)
        }
    }, [open, onClose])

    const go = (href) => {
        onClose()
        router.push(href)
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[130] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
                    style={{ perspective: 1200 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="gate-title"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, rotateX: 24, y: 40, scale: 0.92 }}
                        animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
                        exit={{ opacity: 0, rotateX: -12, y: 20, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                        className="relative w-full max-w-[400px] overflow-hidden rounded-[28px] border border-emerald-500/20 bg-white text-slate-900 shadow-[0_40px_120px_-30px_rgba(16,185,129,0.55)] dark:bg-zinc-950 dark:text-slate-100"
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Hero band with an orbiting 3D emblem */}
                        <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500">
                            <div className="gate-grid absolute inset-0 opacity-25" aria-hidden="true" />
                            <div className="gate-emblem" aria-hidden="true">
                                <span className="gate-ring gate-ring-a" />
                                <span className="gate-ring gate-ring-b" />
                                <span className="gate-core">
                                    <Sparkles className="h-7 w-7 text-white" />
                                </span>
                            </div>
                        </div>

                        <div className="px-6 pb-6 pt-5 text-center">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                                {GUEST_PROMPT_LIMIT} of {GUEST_PROMPT_LIMIT} free prompts used
                            </p>
                            <h2 id="gate-title" className="mt-1.5 text-2xl font-extrabold tracking-tight">
                                Keep cooking with AI
                            </h2>

                            <div className="mt-5 grid grid-cols-3 gap-2">
                                {PERKS.map(({ Icon, label }, i) => (
                                    <motion.div
                                        key={label}
                                        initial={{ opacity: 0, y: 12, rotateY: -30 }}
                                        animate={{ opacity: 1, y: 0, rotateY: 0 }}
                                        transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 220, damping: 20 }}
                                        className="flex flex-col items-center gap-1.5 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] px-2 py-3"
                                    >
                                        <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                                        <span className="text-[11px] font-semibold leading-tight text-slate-600 dark:text-slate-300">{label}</span>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-6 space-y-2.5">
                                <button
                                    ref={primaryRef}
                                    type="button"
                                    onClick={() => signIn('google', { callbackUrl: pathname?.startsWith('/kitchen') ? pathname : '/kitchen' })}
                                    className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/[0.08]"
                                >
                                    <GoogleMark /> Continue with Google
                                </button>
                                <button
                                    type="button"
                                    onClick={() => go('/signup')}
                                    className="h-12 w-full rounded-2xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 active:scale-[0.98]"
                                >
                                    Create free account
                                </button>
                            </div>

                            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                                Have an account?{' '}
                                <button type="button" onClick={() => go('/login')} className="font-bold text-emerald-600 hover:underline dark:text-emerald-400">
                                    Sign in
                                </button>
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default function SessionExpiredBanner() {
    const router = useRouter()
    const [expired, setExpired] = useState(false)
    const [gateOpen, setGateOpen] = useState(false)
    const closeGate = useCallback(() => setGateOpen(false), [])

    useEffect(() => {
        const onExpired = () => setExpired(true)
        const onGate = () => setGateOpen(true)

        window.addEventListener('flavour:session-expired', onExpired)
        window.addEventListener(GATE_EVENT, onGate)
        return () => {
            window.removeEventListener('flavour:session-expired', onExpired)
            window.removeEventListener(GATE_EVENT, onGate)
        }
    }, [])

    const handleOk = async () => {
        setExpired(false)
        markSigningOut()
        clearUserData()
        await signOut({ redirect: false })
        window.history.replaceState(null, '', '/login')
        router.push('/login')
    }

    return (
        <>
            <AnimatePresence>
                {expired && (
                    <motion.div
                        className="fixed inset-0 z-[140] flex items-start justify-center bg-black/40 pt-4 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            initial={{ y: -40, rotateX: 30, opacity: 0 }}
                            animate={{ y: 0, rotateX: 0, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                            className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-amber-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-xl"
                            role="alertdialog"
                            aria-labelledby="expired-title"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                    <AlertTriangle className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <p id="expired-title" className="text-sm font-semibold text-slate-900">Session expired</p>
                                    <p className="text-sm text-slate-600">Sign in again to continue.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleOk}
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                                >
                                    Sign in
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <GuestGate open={gateOpen} onClose={closeGate} />
        </>
    )
}
