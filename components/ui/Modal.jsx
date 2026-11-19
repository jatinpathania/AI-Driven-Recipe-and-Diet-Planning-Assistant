"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

/** Small dialog that tips up in 3D. Click outside or the X to close. */
export default function Modal({ open, onClose, title, children }) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    style={{ perspective: 1000 }}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        initial={{ opacity: 0, rotateX: 25, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
                        exit={{ opacity: 0, rotateX: -15, y: 20, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md rounded-2xl border border-[var(--border-light)] bg-[var(--bg-panel)] p-6 shadow-2xl"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-extrabold text-[var(--text-main)]">{title}</h2>
                            <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
