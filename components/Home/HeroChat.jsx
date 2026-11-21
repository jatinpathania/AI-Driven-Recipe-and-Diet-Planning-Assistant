'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Clock, Flame, Dumbbell, ChefHat, Lock } from 'lucide-react'
import { sendChatMessage } from '@/utils/api'
import { useGuestQuota, isGuestLimitError, openGuestGate, LAST_PROMPT_NOTICE } from '@/lib/guestQuota'
import { renderMarkdown } from '@/lib/chat/format'
import { parseRecipeText } from '@/lib/recipe/normalize'
import { setActiveRecipe } from '@/lib/store/local'

/* Offline demo answers — used only when the AI can't be reached, and never
   counted against the guest allowance. */
const FALLBACKS = [
    {
        match: ['chicken', 'lemon', 'garlic'],
        reply: 'Great combo! Three quick ideas:',
        chips: [
            { e: '🍋', t: 'Lemon Garlic Chicken', m: '22 min · 380 kcal' },
            { e: '🥗', t: 'Chicken Florentine', m: '28 min · 420 kcal' },
            { e: '🫕', t: 'Chicken Piccata', m: '20 min · 350 kcal' },
        ],
    },
    {
        match: ['vegan', 'plant'],
        reply: 'Plant-powered picks:',
        chips: [
            { e: '🍲', t: 'Lentil Spinach Curry', m: '30 min · 290 kcal' },
            { e: '🌮', t: 'Black Bean Tacos', m: '15 min · 310 kcal' },
            { e: '🥗', t: 'Chickpea Power Bowl', m: '10 min · 340 kcal' },
        ],
    },
    {
        match: ['protein', 'muscle', '500'],
        reply: 'High-protein options:',
        chips: [
            { e: '🍤', t: 'Garlic Butter Shrimp', m: '15 min · 340 kcal' },
            { e: '🍗', t: 'Herb Roast Chicken', m: '45 min · 480 kcal' },
            { e: '🐟', t: 'Salmon & Quinoa', m: '25 min · 520 kcal' },
        ],
    },
    {
        match: ['15', 'quick', 'fast'],
        reply: 'Under 15 minutes:',
        chips: [
            { e: '🍳', t: 'Shakshuka', m: '12 min · 280 kcal' },
            { e: '🥚', t: 'Egg Fried Rice', m: '10 min · 350 kcal' },
            { e: '🫔', t: 'Turkey Wraps', m: '8 min · 320 kcal' },
        ],
    },
    {
        match: ['italian', 'pasta'],
        reply: 'Italian tonight 🇮🇹',
        chips: [
            { e: '🍝', t: 'Pasta Carbonara', m: '25 min · 520 kcal' },
            { e: '🍕', t: 'Margherita Pizza', m: '35 min · 480 kcal' },
            { e: '🥗', t: 'Panzanella', m: '15 min · 280 kcal' },
        ],
    },
]

const fallbackFor = (msg) => {
    const lower = msg.toLowerCase()
    return (
        FALLBACKS.find((r) => r.match.some((m) => lower.includes(m))) || {
            reply: 'A few ideas:',
            chips: [
                { e: '🥘', t: 'One-pot Stew', m: '35 min · 410 kcal' },
                { e: '🥗', t: 'Garden Salad', m: '10 min · 180 kcal' },
                { e: '🍜', t: 'Noodle Bowl', m: '20 min · 380 kcal' },
            ],
        }
    )
}

const SUGGESTIONS = [
    { text: '🍗 Chicken + lemon', query: 'I have chicken, garlic and lemon' },
    { text: '🌱 Vegan dinner', query: 'Quick vegan dinner idea' },
    { text: '💪 High protein', query: 'High protein meal under 500 calories' },
    { text: '⚡ 15-min meal', query: 'What can I make in 15 minutes?' },
    { text: '🍝 Italian', query: 'Something Italian tonight' },
]

let seq = 0
const nextId = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`

const GREETING = { id: 'hello', role: 'ai', content: '👋 Tell me what’s in your fridge — I’ll tell you what to cook.' }

function QuotaChip({ quota }) {
    if (!quota.limited) {
        return (
            <span className="hc-status">
                <span className="hc-status-dot" /> Live
            </span>
        )
    }

    if (quota.remaining <= 0) {
        return (
            <button type="button" className="hc-quota hc-quota-out" onClick={() => openGuestGate('limit')}>
                <Lock size={11} /> Sign in for more
            </button>
        )
    }

    return (
        <motion.span
            key={quota.remaining}
            className="hc-quota"
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            title="Free prompts left before signing in"
        >
            <span className="hc-quota-pips" aria-hidden="true">
                {Array.from({ length: quota.limit }, (_, i) => (
                    <span key={i} className={i < quota.remaining ? 'on' : ''} />
                ))}
            </span>
            {quota.remaining === quota.limit ? `${quota.limit} free prompts` : `${quota.remaining} left`}
        </motion.span>
    )
}

function RecipeCard({ recipe, onCook }) {
    const stats = [
        recipe.calories ? { Icon: Flame, v: `${recipe.calories} kcal` } : null,
        recipe.protein ? { Icon: Dumbbell, v: `${recipe.protein} protein` } : null,
        recipe.time ? { Icon: Clock, v: recipe.time } : null,
    ].filter(Boolean)

    return (
        <div className="hc-recipe-card">
            <div className="hc-recipe-head">
                <span className="hc-recipe-emoji" aria-hidden="true">{recipe.emoji}</span>
                <div className="min-w-0">
                    <strong className="hc-recipe-name">{recipe.name}</strong>
                    <span className="hc-recipe-sub">
                        {recipe.ingredients.length} ingredients · {recipe.steps.length} steps
                    </span>
                </div>
            </div>
            {stats.length > 0 && (
                <div className="hc-recipe-stats">
                    {stats.map(({ Icon, v }) => (
                        <span key={v}><Icon size={11} aria-hidden="true" /> {v}</span>
                    ))}
                </div>
            )}
            <button type="button" className="hc-cook-btn" onClick={() => onCook(recipe)}>
                <ChefHat size={14} aria-hidden="true" /> Cook this <span aria-hidden="true">→</span>
            </button>
        </div>
    )
}

export default function HeroChat() {
    const router = useRouter()
    const quota = useGuestQuota()
    const [messages, setMessages] = useState([GREETING])
    const [input, setInput] = useState('')
    const [typing, setTyping] = useState(false)
    const listRef = useRef(null)

    useEffect(() => {
        const el = listRef.current
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }, [messages, typing])

    const cook = (recipe) => {
        setActiveRecipe(recipe)
        router.push('/kitchen/cook')
    }

    const pushFallback = (text) => {
        const f = fallbackFor(text)
        setMessages((prev) => [...prev, { id: nextId(), role: 'ai', content: f.reply, chips: f.chips, offline: true }])
    }

    const pushNotice = (content) =>
        setMessages((prev) => [...prev, { id: nextId(), role: 'ai', notice: true, content }])

    const send = async (override) => {
        const text = (override ?? input).trim()
        if (typing) return
        // Spent guests get the sign-in gate on any send, even an empty one.
        if (!quota.guard()) return
        if (!text) return

        const history = messages
            .filter((m) => m.id !== GREETING.id && !m.offline && !m.notice)
            .map((m) => ({ role: m.role, content: m.content }))

        setInput('')
        setMessages((prev) => [...prev, { id: nextId(), role: 'user', content: text }])
        setTyping(true)

        let left = Infinity
        try {
            const res = await sendChatMessage(text, history)
            left = quota.record(res?.quota)
            if (res?.success && res.message) {
                setMessages((prev) => [
                    ...prev,
                    { id: nextId(), role: 'ai', content: res.message, recipe: parseRecipeText(res.message) },
                ])
            } else {
                pushFallback(text)
            }
        } catch (err) {
            if (isGuestLimitError(err)) {
                quota.exhaust()
                pushNotice('You’ve used your free prompts — sign in to keep cooking with AI.')
                return
            }
            left = quota.record(err?.data?.quota)
            pushFallback(text)
        } finally {
            setTyping(false)
        }

        // Every send counts; tell the guest the moment the last one is gone
        // instead of waiting for a 4th attempt to bounce.
        if (left === 0) pushNotice(LAST_PROMPT_NOTICE)
    }

    const spent = quota.limited && quota.remaining <= 0

    return (
        <div className="hero-chat">
            <div className="hc-header">
                <div className="hc-dots" aria-hidden="true">
                    <div className="hc-dot" />
                    <div className="hc-dot" />
                    <div className="hc-dot" />
                </div>
                <div className="hc-title">✦ Flavour AI</div>
                <div className="hc-header-right">
                    <QuotaChip quota={quota} />
                </div>
            </div>

            <div className="hc-messages" ref={listRef} aria-live="polite">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            className={`hc-msg ${msg.role === 'user' ? 'user' : ''}`}
                            initial={{ opacity: 0, rotateX: -55, y: 14 }}
                            animate={{ opacity: 1, rotateX: 0, y: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                            style={{ transformOrigin: msg.role === 'user' ? 'right top' : 'left top' }}
                        >
                            <div className={`hc-av ${msg.role === 'ai' ? 'ai' : 'usr'}`} aria-hidden="true">
                                {msg.role === 'ai' ? '🥦' : '👤'}
                            </div>
                            <div className="hc-msg-body">
                                {msg.recipe ? (
                                    <RecipeCard recipe={msg.recipe} onCook={cook} />
                                ) : (
                                    <div className="hc-bubble">
                                        {msg.role === 'ai' ? renderMarkdown(msg.content) : msg.content}
                                    </div>
                                )}

                                {msg.chips && (
                                    <div className="hc-recipe-chips">
                                        {msg.chips.map((r) => (
                                            <button
                                                key={r.t}
                                                type="button"
                                                className="hc-recipe-chip"
                                                onClick={() => send(`Give me a recipe for ${r.t}`)}
                                            >
                                                <span style={{ fontSize: 18 }} aria-hidden="true">{r.e}</span>
                                                <span>
                                                    <strong>{r.t}</strong>
                                                    <span className="hc-chip-meta">{r.m}</span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {msg.notice && (
                                    <button type="button" className="hc-cook-btn hc-notice-btn" onClick={() => openGuestGate('limit')}>
                                        <Lock size={13} aria-hidden="true" /> Sign in or sign up free <span aria-hidden="true">→</span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {typing && (
                    <div className="hc-msg">
                        <div className="hc-av ai" aria-hidden="true">🥦</div>
                        <div className="hc-bubble">
                            <div className="typing-ind" aria-label="Flavour AI is typing">
                                <span /><span /><span />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="hc-suggestions">
                {SUGGESTIONS.map((sug) => (
                    <button key={sug.text} type="button" className="hc-sug" onClick={() => send(sug.query)} disabled={typing}>
                        {sug.text}
                    </button>
                ))}
            </div>

            <form
                className="hc-input-row"
                onSubmit={(e) => {
                    e.preventDefault()
                    send()
                }}
            >
                <label className="sr-only" htmlFor="hero-chat-input">Ask Flavour AI what to cook</label>
                <input
                    id="hero-chat-input"
                    className="hc-input"
                    type="text"
                    placeholder={spent ? 'Sign in to keep chatting…' : 'e.g. eggs, spinach and feta…'}
                    value={input}
                    maxLength={500}
                    onChange={(e) => setInput(e.target.value)}
                    autoComplete="off"
                />
                <button className="hc-send" type="submit" aria-label="Send" disabled={typing || (!input.trim() && !spent)}>
                    <ArrowUp size={16} />
                </button>
            </form>
        </div>
    )
}
