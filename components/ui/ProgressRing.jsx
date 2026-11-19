"use client"

import React from 'react'
import { motion } from 'framer-motion'

/**
 * Animated circular progress. `value` is 0–1; values above 1 render full in
 * the `over` colour (e.g. calories past the daily goal).
 */
export default function ProgressRing({
    value = 0,
    size = 120,
    stroke = 10,
    color = 'var(--brand)',
    over = '#f43f5e',
    track = 'var(--border)',
    children,
    className = '',
    label,
}) {
    const r = (size - stroke) / 2
    const c = 2 * Math.PI * r
    const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
    const isOver = value > 1

    return (
        <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }} role="img" aria-label={label}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={isOver ? over : color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    initial={{ strokeDashoffset: c }}
                    animate={{ strokeDashoffset: c * (1 - clamped) }}
                    transition={{ type: 'spring', stiffness: 70, damping: 18 }}
                    style={{ filter: `drop-shadow(0 0 6px ${isOver ? 'rgba(244,63,94,.35)' : 'var(--brand-glow)'})` }}
                />
            </svg>
            {children && <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>}
        </div>
    )
}
