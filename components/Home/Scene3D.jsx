'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useReducedMotion,
    useScroll,
    useAnimationFrame,
    useInView,
} from 'framer-motion'
import { MessageSquare, Timer, Flame, CalendarDays, NotebookPen, UtensilsCrossed, Leaf, Wand2, ChefHat } from 'lucide-react'

/* ────────────────────────────────────────────────────────────
   Everything here is CSS 3D (perspective + preserve-3d) driven
   by framer-motion values — no WebGL, no extra dependencies.
   Pointer and frame updates write to motion values, never to
   React state, so nothing re-renders while things move. Every
   effect degrades to a static layout under reduced motion or a
   coarse pointer.
   ──────────────────────────────────────────────────────────── */

/**
 * useReducedMotion, but safe to branch the DOM on.
 *
 * The raw hook reports the real preference on the very first client render
 * while the server rendered the animated markup, so returning a different tree
 * straight away is a hydration mismatch. Report "false" until after mount.
 */
export const useReducedMotionAfterMount = () => {
    const reduce = useReducedMotion()
    const [mounted, setMounted] = useState(false)

    // Deliberate: this flip is what keeps the first client render identical to
    // the server's.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => setMounted(true), [])

    return mounted && reduce
}

const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia(query)
        const sync = () => setMatches(mq.matches)
        sync()
        mq.addEventListener('change', sync)
        return () => mq.removeEventListener('change', sync)
    }, [query])

    return matches
}

// Coarse pointers can't hover, so the tilt work is wasted there.
export const useFinePointer = () => useMediaQuery('(min-width: 768px) and (hover: hover) and (pointer: fine)')

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/* ── Pointer-tracked 3D tilt ──────────────────────────────── */
export function TiltCard({ children, className = '', max = 10, scale = 1.02, glare = true, depth = 40 }) {
    const ref = useRef(null)
    const reduce = useReducedMotionAfterMount()
    const fine = useFinePointer()
    const active = !reduce && fine

    const px = useMotionValue(0.5)
    const py = useMotionValue(0.5)
    const lift = useMotionValue(0)
    const glareAmount = useMotionValue(0)

    const spring = { stiffness: 180, damping: 20, mass: 0.4 }
    const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring)
    const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring)
    const z = useSpring(lift, spring)
    const glareOpacity = useSpring(glareAmount, spring)
    const glareBg = useTransform(
        [px, py],
        ([x, y]) => `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%)`
    )

    const handleMove = useCallback(
        (e) => {
            const el = ref.current
            if (!el) return
            const r = el.getBoundingClientRect()
            px.set((e.clientX - r.left) / r.width)
            py.set((e.clientY - r.top) / r.height)
        },
        [px, py]
    )

    const handleEnter = useCallback(() => {
        lift.set(depth)
        glareAmount.set(0.5)
    }, [lift, glareAmount, depth])

    const handleLeave = useCallback(() => {
        px.set(0.5)
        py.set(0.5)
        lift.set(0)
        glareAmount.set(0)
    }, [px, py, lift, glareAmount])

    // Identical DOM whether or not the tilt is active, so enabling it after
    // hydration never remounts (or resets) the content.
    return (
        <div
            ref={ref}
            className={`tilt-root ${className}`}
            onPointerMove={active ? handleMove : undefined}
            onPointerEnter={active ? handleEnter : undefined}
            onPointerLeave={active ? handleLeave : undefined}
        >
            <motion.div
                className="tilt-inner"
                style={active ? { rotateX, rotateY, z } : undefined}
                whileHover={active ? { scale } : undefined}
                transition={{ type: 'spring', ...spring }}
            >
                {children}
                {active && glare && (
                    <motion.span aria-hidden="true" className="tilt-glare" style={{ opacity: glareOpacity, background: glareBg }} />
                )}
            </motion.div>
        </div>
    )
}

/* ── Hero: a parallax room of floating ingredients ────────────
   The whole stage tilts toward the pointer. Tiles sit at
   different Z depths, so near ones sweep further than far ones —
   real parallax from one rotation. Tiles stay in the gutters so
   they never cross the headline; two orbit rings circle the chat.
   ──────────────────────────────────────────────────────────── */
const FLOATERS = [
    { e: '🥦', side: 'left', top: '14%', offset: 5, size: 78, depth: 80, dur: 7, delay: 0 },
    { e: '🍋', side: 'left', top: '42%', offset: 12, size: 58, depth: -160, dur: 9, delay: 1.1 },
    { e: '🥑', side: 'left', top: '70%', offset: 4, size: 70, depth: -40, dur: 8, delay: 0.5 },
    { e: '🧄', side: 'left', top: '88%', offset: 15, size: 50, depth: -220, dur: 10, delay: 0.3 },
    { e: '🍅', side: 'right', top: '17%', offset: 6, size: 72, depth: 40, dur: 8.5, delay: 0.7 },
    { e: '🫑', side: 'right', top: '46%', offset: 13, size: 56, depth: -180, dur: 10, delay: 0.2 },
    { e: '🥕', side: 'right', top: '72%', offset: 5, size: 76, depth: 110, dur: 7.5, delay: 1.4 },
    { e: '🌶️', side: 'right', top: '90%', offset: 16, size: 48, depth: -120, dur: 9.5, delay: 0.9 },
]

export function HeroScene() {
    const reduce = useReducedMotionAfterMount()
    // Below ~1024px the gutters can't hold a tile without crowding the text,
    // so the flat background emoji carry the hero there.
    const roomy = useMediaQuery('(min-width: 1024px) and (hover: hover) and (pointer: fine)')
    const active = roomy && !reduce

    const mx = useMotionValue(0)
    const my = useMotionValue(0)
    const spring = { stiffness: 60, damping: 18, mass: 0.6 }
    const rotateY = useSpring(useTransform(mx, [-1, 1], [-11, 11]), spring)
    const rotateX = useSpring(useTransform(my, [-1, 1], [7, -7]), spring)

    useEffect(() => {
        if (!active) return undefined
        const onMove = (e) => {
            mx.set((e.clientX / window.innerWidth) * 2 - 1)
            my.set((e.clientY / window.innerHeight) * 2 - 1)
        }
        window.addEventListener('pointermove', onMove, { passive: true })
        return () => window.removeEventListener('pointermove', onMove)
    }, [active, mx, my])

    if (!active) return null

    return (
        <div className="hero-scene" aria-hidden="true">
            <motion.div className="hero-scene-stage" style={{ rotateX, rotateY }}>
                <div className="hero-orbit hero-orbit-a" />
                <div className="hero-orbit hero-orbit-b" />

                {FLOATERS.map((f) => (
                    <motion.span
                        key={f.e}
                        className="hero-tile"
                        style={{
                            top: f.top,
                            [f.side]: `${f.offset}%`,
                            width: f.size,
                            height: f.size,
                            fontSize: Math.round(f.size * 0.46),
                            z: f.depth,
                        }}
                        animate={{ y: [0, -20, 0], rotateZ: [-5, 5, -5], rotateY: [-14, 14, -14] }}
                        transition={{ duration: f.dur, delay: f.delay, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        {f.e}
                    </motion.span>
                ))}
            </motion.div>
        </div>
    )
}

/* ── Feature cube you can grab and spin ───────────────────── */
const FACES = [
    { Icon: MessageSquare, label: 'Chat', t: 'rotateY(0deg)' },
    { Icon: Timer, label: 'Timers', t: 'rotateY(90deg)' },
    { Icon: Flame, label: 'Calories', t: 'rotateY(180deg)' },
    { Icon: CalendarDays, label: 'Planner', t: 'rotateY(-90deg)' },
    { Icon: NotebookPen, label: 'Scaling', t: 'rotateX(90deg)' },
    { Icon: UtensilsCrossed, label: 'Recipes', t: 'rotateX(-90deg)' },
]

const REST_TILT = -18
const AUTO_SPEED = 0.014 // degrees per ms

export function FeatureCube() {
    const reduce = useReducedMotionAfterMount()
    const sceneRef = useRef(null)
    const inView = useInView(sceneRef)
    const rotY = useMotionValue(0)
    const rotX = useMotionValue(REST_TILT)
    const dragging = useRef(false)
    const boost = useRef(0)
    const [grabbing, setGrabbing] = useState(false)

    useAnimationFrame((_, delta) => {
        if (reduce || !inView || dragging.current) return
        const dt = Math.min(delta, 50)
        rotY.set(rotY.get() + (AUTO_SPEED + boost.current) * dt)
        boost.current *= 0.95
        // Ease the tilt back to its resting angle after a vertical drag.
        rotX.set(rotX.get() + (REST_TILT - rotX.get()) * 0.05)
    })

    if (reduce) {
        return (
            <div className="cube-fallback" ref={sceneRef}>
                {FACES.map(({ Icon, label }) => (
                    <div key={label} className="cube-fallback-item">
                        <Icon className="cube-fallback-icon" aria-hidden="true" />
                        {label}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="cube-stage">
            <motion.div
                ref={sceneRef}
                className={`cube-scene${grabbing ? ' is-grabbing' : ''}`}
                onPanStart={() => {
                    dragging.current = true
                    setGrabbing(true)
                }}
                onPan={(_, info) => {
                    rotY.set(rotY.get() + info.delta.x * 0.55)
                    rotX.set(clamp(rotX.get() - info.delta.y * 0.45, -70, 70))
                }}
                onPanEnd={(_, info) => {
                    dragging.current = false
                    setGrabbing(false)
                    // Fling: carry the release velocity into the auto-spin, then decay.
                    boost.current = clamp(info.velocity.x * 0.0006, -1.4, 1.4)
                }}
                role="img"
                aria-label="Six kitchen tools: chat, timers, calories, planner, scaling and recipes. Drag to spin."
            >
                <motion.div className="cube" style={{ rotateX: rotX, rotateY: rotY }}>
                    {FACES.map(({ Icon, label, t }) => (
                        <div
                            key={label}
                            className="cube-face"
                            /* half-extent must track --cube-size in CSS */
                            style={{ transform: `${t} translateZ(calc(var(--cube-size) / 2))` }}
                        >
                            <Icon className="cube-face-icon" aria-hidden="true" strokeWidth={1.4} />
                            <span className="cube-face-label">{label}</span>
                        </div>
                    ))}
                </motion.div>
                <div className="cube-shadow" aria-hidden="true" />
            </motion.div>
            <p className="cube-hint" aria-hidden="true">← drag to spin →</p>
        </div>
    )
}

/* ── Scroll-linked parallax ───────────────────────────────── */
export function ParallaxDepth({ children, speed = 60, className = '' }) {
    const ref = useRef(null)
    const reduce = useReducedMotionAfterMount()
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
    const y = useSpring(useTransform(scrollYProgress, [0, 1], [speed, -speed]), { stiffness: 120, damping: 28, mass: 0.4 })

    return (
        <div ref={ref} className={className}>
            <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
        </div>
    )
}

/**
 * Scroll-linked 3D entrance: the block starts tipped back and sunk into the
 * page, and stands up as it scrolls into view. Tied to scroll position, not a
 * one-shot timer, so scrolling back up plays it in reverse.
 */
export function Reveal3D({ children, className = '', tilt = 24, depth = 180 }) {
    const ref = useRef(null)
    const reduce = useReducedMotionAfterMount()
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 58%'] })
    const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.35 })
    const rotateX = useTransform(smooth, [0, 1], [tilt, 0])
    const z = useTransform(smooth, [0, 1], [-depth, 0])
    const opacity = useTransform(smooth, [0, 0.6, 1], [0.15, 0.85, 1])

    return (
        <motion.div
            ref={ref}
            className={`reveal-3d ${className}`}
            style={reduce ? undefined : { rotateX, z, opacity, transformPerspective: 1200 }}
        >
            {children}
        </motion.div>
    )
}

/* ── Layered 3D card for the "how it works" steps ─────────── */
const STEP_ICONS = { pantry: Leaf, generate: Wand2, cook: ChefHat }

export function StepCard({ icon, step, title, body, index }) {
    const Icon = STEP_ICONS[icon] || Leaf

    return (
        <motion.div
            className="how-step"
            initial={{ opacity: 0, y: 40, rotateX: -35 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: index * 0.14, ease: [0.22, 1, 0.36, 1] }}
        >
            <TiltCard max={16} scale={1} depth={30} glare={false} className="step-tilt">
                <div className="step-num-wrap">
                    <div className="step-ring" aria-hidden="true" />
                    <Icon className="step-icon" aria-hidden="true" strokeWidth={1.5} />
                    <div className="step-badge">{step}</div>
                </div>
            </TiltCard>
            <h3>{title}</h3>
            <p>{body}</p>
        </motion.div>
    )
}

/* ── Flip card: title on the front, one line on the back ──── */
export function FlipCard({ Icon, title, tag, back, index = 0 }) {
    const [flipped, setFlipped] = useState(false)

    return (
        <motion.div
            className="flip-wrap"
            initial={{ opacity: 0, y: 34, rotateX: -24 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: Math.min(index, 5) * 0.07, ease: [0.22, 1, 0.36, 1] }}
        >
            <button
                type="button"
                className={`flip-card${flipped ? ' is-flipped' : ''}`}
                onClick={() => setFlipped((v) => !v)}
                aria-pressed={flipped}
                aria-label={`${title}. ${back}`}
            >
                <span className="flip-inner">
                    <span className="flip-face flip-front">
                        <span className="flip-icon"><Icon aria-hidden="true" strokeWidth={1.6} /></span>
                        <span className="flip-title">{title}</span>
                        <span className="flip-tag">{tag}</span>
                        <span className="flip-turn" aria-hidden="true">↻</span>
                    </span>
                    <span className="flip-face flip-back">
                        <Icon className="flip-back-icon" aria-hidden="true" strokeWidth={1.6} />
                        <span className="flip-back-text">{back}</span>
                    </span>
                </span>
            </button>
        </motion.div>
    )
}

/* ── Rotating cylinder carousel ────────────────────────────── */
function RingItem({ index, count, radius, rotation, children }) {
    const step = 360 / count
    // Front cards are bright; cards are gone before they turn edge-on. Near ±90°
    // only a card's light border is visible, drawn as long perspective lines
    // that read as a stray wireframe through the middle of the ring.
    const opacity = useTransform(rotation, (r) => {
        const angle = ((index * step + r) % 360 + 360) % 360
        const c = Math.cos((angle * Math.PI) / 180)
        return Math.max(0, Math.min(1, (c - 0.15) / 0.6))
    })

    return (
        <motion.div
            className="ring-card"
            style={{ transform: `rotateY(${index * step}deg) translateZ(${radius}px)`, opacity }}
        >
            {children}
        </motion.div>
    )
}

export function CarouselRing({ items, renderItem, radius = 330, label }) {
    const wrapRef = useRef(null)
    const inView = useInView(wrapRef)
    const fine = useFinePointer()
    const reduce = useReducedMotionAfterMount()
    const active = fine && !reduce

    const rotation = useMotionValue(0)
    const paused = useRef(false)

    useAnimationFrame((_, delta) => {
        if (!active || !inView || paused.current) return
        rotation.set(rotation.get() - Math.min(delta, 50) * 0.011)
    })

    return (
        <div ref={wrapRef} className="ring-wrap" aria-label={label} role="region">
            {active ? (
                <motion.div
                    className="ring-scene"
                    onPointerEnter={() => { paused.current = true }}
                    onPointerLeave={() => { paused.current = false }}
                    onPan={(_, info) => rotation.set(rotation.get() + info.delta.x * 0.35)}
                >
                    <motion.div className="testi-ring" style={{ rotateY: rotation }}>
                        {items.map((item, i) => (
                            <RingItem key={i} index={i} count={items.length} radius={radius} rotation={rotation}>
                                {renderItem(item)}
                            </RingItem>
                        ))}
                    </motion.div>
                    <div className="ring-floor" aria-hidden="true" />
                </motion.div>
            ) : (
                <div className="ring-fallback">
                    {items.map((item, i) => (
                        <div key={i} className="ring-fallback-item">{renderItem(item)}</div>
                    ))}
                </div>
            )}
        </div>
    )
}
