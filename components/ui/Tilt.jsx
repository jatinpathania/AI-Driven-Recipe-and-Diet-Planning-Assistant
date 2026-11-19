"use client"

import React, { useCallback, useRef, useSyncExternalStore } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'

const FINE_QUERY = '(hover: hover) and (pointer: fine)'

const subscribeFine = (cb) => {
    const mq = window.matchMedia(FINE_QUERY)
    mq.addEventListener('change', cb)
    return () => mq.removeEventListener('change', cb)
}

/** True on mouse/trackpad devices. False during SSR + hydration, so markup always matches. */
export const useFinePointer = () =>
    useSyncExternalStore(subscribeFine, () => window.matchMedia(FINE_QUERY).matches, () => false)

const SPRING = { stiffness: 220, damping: 20, mass: 0.5 }

/**
 * Pointer-tracked 3D tilt with a moving glare.
 *
 * Inert on touch screens (nothing to hover with) and for reduced-motion users
 * (the shell's MotionConfig drops transform animation). At rest the rotation
 * is 0, so framer-motion writes `transform: none` and nothing inside becomes
 * a containing block for fixed elements.
 */
export default function Tilt({ children, className = '', innerClassName = '', max = 8, scale = 1.02, glare = true, onClick }) {
    const ref = useRef(null)
    const fine = useFinePointer()

    const rx = useMotionValue(0)
    const ry = useMotionValue(0)
    const gx = useMotionValue(50)
    const gy = useMotionValue(50)
    const rotateX = useSpring(rx, SPRING)
    const rotateY = useSpring(ry, SPRING)
    const glareBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.45), transparent 55%)`

    const onMove = useCallback(
        (e) => {
            const r = ref.current?.getBoundingClientRect()
            if (!r) return
            const px = (e.clientX - r.left) / r.width
            const py = (e.clientY - r.top) / r.height
            ry.set((px - 0.5) * 2 * max)
            rx.set(-(py - 0.5) * 2 * max)
            gx.set(px * 100)
            gy.set(py * 100)
        },
        [max, rx, ry, gx, gy]
    )

    const onLeave = useCallback(() => {
        rx.set(0)
        ry.set(0)
    }, [rx, ry])

    return (
        <div className={`k-stage ${className}`}>
            <motion.div
                ref={ref}
                onClick={onClick}
                className={`k-tilt relative h-full ${innerClassName}`}
                style={fine ? { rotateX, rotateY } : undefined}
                whileHover={fine ? { scale } : undefined}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', ...SPRING }}
                onPointerMove={fine ? onMove : undefined}
                onPointerLeave={fine ? onLeave : undefined}
            >
                {children}
                {fine && glare && <motion.span aria-hidden="true" className="k-glare opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glareBg }} />}
            </motion.div>
        </div>
    )
}
