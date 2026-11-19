"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Info, AlertTriangle, X } from 'lucide-react'
import { uid } from '@/lib/store/local'

const ToastContext = createContext(null)

/** Safe to call from anywhere under the provider; no-ops if it's missing. */
export const useToast = () => useContext(ToastContext)?.toast ?? (() => {})

const ICONS = {
    success: Check,
    info: Info,
    error: AlertTriangle,
}

const ACCENTS = {
    success: '#10B981',
    info: '#60A5FA',
    error: '#F87171',
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const timers = useRef(new Map())

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
        const timer = timers.current.get(id)
        if (timer) {
            clearTimeout(timer)
            timers.current.delete(id)
        }
    }, [])

    const toast = useCallback(
        (message, options = {}) => {
            const { type = 'success', duration = 3200, action } = options
            const id = uid()

            setToasts((prev) => {
                // More than a few stacked toasts is noise, not feedback.
                const next = [...prev, { id, message, type, action }]
                return next.slice(-3)
            })

            timers.current.set(
                id,
                setTimeout(() => dismiss(id), duration)
            )
            return id
        },
        [dismiss]
    )

    // Clear every pending timer if the provider unmounts mid-flight.
    useEffect(() => {
        const pending = timers.current
        return () => {
            pending.forEach(clearTimeout)
            pending.clear()
        }
    }, [])

    return (
        <ToastContext.Provider value={{ toast, dismiss }}>
            {children}

            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
                <AnimatePresence initial={false}>
                    {toasts.map((t) => {
                        const Icon = ICONS[t.type] || Info
                        const accent = ACCENTS[t.type] || ACCENTS.info

                        return (
                            <motion.div
                                key={t.id}
                                layout
                                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                className="pointer-events-auto flex w-full max-w-[380px] items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl"
                                style={{
                                    background: 'color-mix(in srgb, var(--bg-card) 88%, transparent)',
                                    borderColor: 'var(--border-light)',
                                }}
                                role="status"
                            >
                                <span
                                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                                    style={{ background: `${accent}1f`, color: accent }}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </span>

                                <p className="flex-1 text-[13px] font-semibold leading-snug text-[var(--text-main)]">
                                    {t.message}
                                </p>

                                {t.action && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            t.action.onClick()
                                            dismiss(t.id)
                                        }}
                                        className="shrink-0 text-[12px] font-bold text-[#10B981] hover:underline"
                                    >
                                        {t.action.label}
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => dismiss(t.id)}
                                    aria-label="Dismiss notification"
                                    className="shrink-0 rounded-md p-0.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}

export default ToastProvider
