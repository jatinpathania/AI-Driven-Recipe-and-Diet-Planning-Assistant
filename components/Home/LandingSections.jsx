'use client'

import React, { useState, useRef, useEffect, useId } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Check, Plus, Minus, MessageSquare, Timer, Flame, CalendarDays, NotebookPen, UtensilsCrossed } from 'lucide-react'
import { TiltCard, StepCard, FlipCard, CarouselRing, Reveal3D, useReducedMotionAfterMount } from '@/components/Home/Scene3D'

/* ── Number that counts up the first time it scrolls into view ── */
export function CountUp({ to, suffix = '', duration = 1.4 }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-40px' })
    const reduce = useReducedMotionAfterMount()

    const mv = useMotionValue(0)
    const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 })
    const text = useTransform(spring, (v) => Math.round(v).toLocaleString())

    useEffect(() => {
        if (inView) mv.set(to)
    }, [inView, to, mv])

    if (reduce) {
        return <span ref={ref}>{to.toLocaleString()}{suffix}</span>
    }

    return (
        <span ref={ref}>
            <motion.span>{text}</motion.span>
            {suffix}
        </span>
    )
}

/** Shared section heading: small label, one-line title, scroll-linked 3D entrance. */
function SectionHead({ label, children }) {
    return (
        <Reveal3D className="section-head">
            <div className="section-label">{label}</div>
            <h2 className="section-title">{children}</h2>
        </Reveal3D>
    )
}

/* ── Ingredient conveyor (replaces the old "as seen in" strip) ── */
const MARQUEE_A = ['🥑 Avocado', '🍋 Lemon', '🧄 Garlic', '🍅 Tomato', '🥦 Broccoli', '🧀 Paneer', '🌶️ Chilli', '🥕 Carrot', '🍄 Mushroom', '🫑 Pepper']
const MARQUEE_B = ['🍝 Italian', '🍛 Indian', '🌮 Mexican', '🍜 Japanese', '🥙 Mediterranean', '🥗 Vegan', '💪 High protein', '⚡ 15-minute', '🥘 One-pot', '🍳 Breakfast']

export function IngredientMarquee() {
    return (
        <div className="marquee" aria-hidden="true">
            <div className="marquee-plane">
                {[MARQUEE_A, MARQUEE_B].map((row, r) => (
                    <div key={r} className={`marquee-row${r === 1 ? ' marquee-row-reverse' : ''}`}>
                        <div className="marquee-track">
                            {[...row, ...row].map((chip, i) => (
                                <span key={i} className="marquee-chip">{chip}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ── How it works ─────────────────────────────────────────── */
const STEPS = [
    { icon: 'pantry', title: 'Say what you have', body: 'Leftovers are enough.' },
    { icon: 'generate', title: 'Get a recipe', body: 'Quantities, time, nutrition.' },
    { icon: 'cook', title: 'Cook hands-free', body: 'One step, one timer.' },
]

export function HowItWorks() {
    return (
        <section id="how" className="section how-section">
            <SectionHead label="How it works">
                Fridge to fork in <em>three</em> steps
            </SectionHead>
            <div className="how-steps">
                {STEPS.map((s, i) => (
                    <StepCard key={s.title} index={i} step={i + 1} {...s} />
                ))}
            </div>
        </section>
    )
}

/* ── Features as flip cards ───────────────────────────────── */
const FEATURES = [
    { Icon: MessageSquare, title: 'Ask the chef', tag: 'Chat', back: 'Recipes, swaps and fixes — just ask in plain words.' },
    { Icon: Timer, title: 'Smart timers', tag: 'One tap', back: 'Times are read from each step. Tap once to start.' },
    { Icon: Flame, title: 'Calorie log', tag: 'Macros', back: 'Type what you ate, set a goal, watch the week.' },
    { Icon: CalendarDays, title: 'Week planner', tag: 'Planning', back: 'Plan seven days, then build the shopping list.' },
    { Icon: NotebookPen, title: 'Smart scaling', tag: 'Servings', back: 'Change servings and every quantity follows.' },
    { Icon: UtensilsCrossed, title: 'Your cookbook', tag: 'Saved', back: 'Save, favourite and print any recipe.' },
]

export function Features() {
    return (
        <section id="features" className="section features-section">
            <SectionHead label="Everything in one place">
                Six tools, <em>zero</em> clutter
            </SectionHead>
            <p className="flip-note">Hover or tap a card</p>
            <div className="features-grid">
                {FEATURES.map((f, i) => (
                    <FlipCard key={f.title} index={i} {...f} />
                ))}
            </div>
        </section>
    )
}

/* ── Testimonials on a rotating ring ──────────────────────── */
const TESTIMONIALS = [
    { text: 'Typed what was in my fridge — got a paneer dish the whole family loved.', name: 'Anmol', role: 'Punjab', avatar: '👨' },
    { text: 'Timers plus calorie tracking make work nights so much easier.', name: 'Ansh', role: 'Delhi', avatar: '🧑' },
    { text: 'High-protein, home-style meals planned for my whole week.', name: 'Sunny', role: 'Haryana', avatar: '💪' },
    { text: 'Simple recipes with ingredients I already have. Nothing weird.', name: 'Abhishek', role: 'Himachal Pradesh', avatar: '🧑‍🍳' },
    { text: 'The shopping list from my meal plan saves me hours.', name: 'Vansh', role: 'Punjab', avatar: '🥗' },
    { text: "It gets 'quick, healthy dinner' right every single time.", name: 'Vaibhav', role: 'Delhi', avatar: '👨' },
]

const TestimonialCard = ({ t }) => (
    <figure className="testi-card">
        <div className="testi-stars" aria-label="5 out of 5 stars">★★★★★</div>
        <blockquote className="testi-text">&ldquo;{t.text}&rdquo;</blockquote>
        <figcaption className="testi-author">
            <span className="testi-av" aria-hidden="true">{t.avatar}</span>
            <span>
                <span className="testi-name">{t.name}</span>
                <span className="testi-role">{t.role}</span>
            </span>
        </figcaption>
    </figure>
)

export function Testimonials() {
    return (
        <section id="testimonials" className="section testimonials-section">
            <SectionHead label="Loved at home">
                Real kitchens, <em>real</em> meals
            </SectionHead>
            <CarouselRing
                items={TESTIMONIALS}
                label="What home cooks say"
                renderItem={(t) => <TestimonialCard t={t} />}
            />
        </section>
    )
}

/* ── Pricing ──────────────────────────────────────────────── */
const PLANS = [
    {
        id: 'free',
        name: 'Home Cook',
        price: '₹0',
        cadence: 'forever',
        blurb: 'Everything to start cooking.',
        cta: 'Start free',
        href: '/signup',
        features: ['Unlimited AI chef chat', 'Recipes from your ingredients', 'Timers & cook mode', 'Calorie tracking'],
    },
    {
        id: 'plus',
        name: 'Flavour Plus',
        price: '₹199',
        cadence: '/ month',
        blurb: 'For people who plan the week.',
        featured: true,
        cta: 'Start free trial',
        href: '/signup',
        features: ['Everything in Home Cook', 'Auto-filled meal plans', 'Macro targets', 'Unlimited saved recipes'],
    },
    {
        id: 'family',
        name: 'Family',
        price: '₹349',
        cadence: '/ month',
        blurb: 'One kitchen, five cooks.',
        cta: 'Start free trial',
        href: '/signup',
        features: ['Everything in Plus', '5 member profiles', 'Per-person diets', 'Shared shopping list'],
    },
]

export function Pricing() {
    return (
        <section id="pricing" className="section pricing-section">
            <SectionHead label="Pricing">
                Free to start. <em>Upgrade</em> if you like.
            </SectionHead>

            <div className="pricing-grid">
                {PLANS.map((plan, i) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 40, rotateY: i === 0 ? 18 : i === 2 ? -18 : 0, rotateX: -10 }}
                        whileInView={{ opacity: 1, y: 0, rotateY: 0, rotateX: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        style={{ transformPerspective: 1200 }}
                    >
                        <TiltCard max={7} scale={1.01} depth={28} className="price-tilt">
                            <div className={`price-card${plan.featured ? ' price-card-featured' : ''}`}>
                                {plan.featured && <span className="price-badge">Most popular</span>}

                                <h3 className="price-name">{plan.name}</h3>
                                <p className="price-blurb">{plan.blurb}</p>

                                <div className="price-amount">
                                    <span className="price-value">{plan.price}</span>
                                    <span className="price-cadence">{plan.cadence}</span>
                                </div>

                                <Link href={plan.href} className={`price-cta${plan.featured ? ' price-cta-featured' : ''}`}>
                                    {plan.cta}
                                </Link>

                                <ul className="price-features">
                                    {plan.features.map((f) => (
                                        <li key={f}>
                                            <Check className="price-check" aria-hidden="true" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </TiltCard>
                    </motion.div>
                ))}
            </div>

            <p className="pricing-note">Prices in INR · cancel anytime</p>
        </section>
    )
}

/* ── FAQ ──────────────────────────────────────────────────── */
const FAQS = [
    { q: 'Do I need to list every ingredient?', a: 'No — roughly is fine; it fills in the pantry staples.' },
    { q: 'How many free prompts do I get?', a: 'Three as a guest; a free account makes it unlimited.' },
    { q: 'Can it handle allergies and diets?', a: 'Yes — set them once in Settings and every suggestion respects them.' },
    { q: 'Does it work on my phone?', a: 'Yes — it’s mobile-first and keeps the screen awake while you cook.' },
    { q: 'Is my data private?', a: 'It stays in your account, and you can export or wipe it anytime.' },
    { q: 'What if I stop paying?', a: 'Nothing is deleted — you simply drop back to the free plan.' },
]

export function Faq() {
    const [open, setOpen] = useState(0)
    const baseId = useId()

    return (
        <section id="faq" className="section faq-section">
            <SectionHead label="Questions">
                Before you <em>ask</em>
            </SectionHead>

            <div className="faq-list">
                {FAQS.map((item, i) => {
                    const isOpen = open === i
                    const panelId = `${baseId}-panel-${i}`
                    const buttonId = `${baseId}-button-${i}`

                    return (
                        <motion.div
                            key={item.q}
                            className={`faq-item${isOpen ? ' faq-item-open' : ''}`}
                            initial={{ opacity: 0, rotateX: -50, y: 16 }}
                            whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                            style={{ transformPerspective: 900, transformOrigin: 'top center' }}
                        >
                            <h3 className="faq-q-wrap">
                                <button
                                    id={buttonId}
                                    type="button"
                                    className="faq-q"
                                    aria-expanded={isOpen}
                                    aria-controls={panelId}
                                    onClick={() => setOpen(isOpen ? -1 : i)}
                                >
                                    <span>{item.q}</span>
                                    <span className="faq-icon" aria-hidden="true">
                                        {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                                    </span>
                                </button>
                            </h3>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        id={panelId}
                                        role="region"
                                        aria-labelledby={buttonId}
                                        initial={{ height: 0, opacity: 0, rotateX: -30 }}
                                        animate={{ height: 'auto', opacity: 1, rotateX: 0 }}
                                        exit={{ height: 0, opacity: 0, rotateX: -30 }}
                                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                        style={{ overflow: 'hidden', transformOrigin: 'top center' }}
                                    >
                                        <p className="faq-a">{item.a}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )
                })}
            </div>
        </section>
    )
}
