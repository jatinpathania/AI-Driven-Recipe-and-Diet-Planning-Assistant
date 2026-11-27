'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import { isLowPower } from '@/lib/motion/lite'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header/Header'
import Footer from '@/components/Footer/Footer'
import { isAuthenticated, signupUser, saveUserData, scheduleAutoLogout } from '@/utils/api'
import { HeroScene, FeatureCube, ParallaxDepth, Reveal3D, useReducedMotionAfterMount } from '@/components/Home/Scene3D'
import { CountUp, IngredientMarquee, HowItWorks, Features, Testimonials, Pricing, Faq } from '@/components/Home/LandingSections'
import HeroChat from '@/components/Home/HeroChat'
import './landing.css'

/* Headline words flip up out of the page one after another. */
const HEADLINE = [
    [{ t: 'Your' }, { t: 'personal', em: true }, { t: 'chef,', em: true }],
    [{ t: 'always' }, { t: 'in' }, { t: 'your' }, { t: 'pocket' }],
]

const LINE_OFFSETS = HEADLINE.map((_, li) => HEADLINE.slice(0, li).reduce((sum, l) => sum + l.length, 0))

function FlipHeadline() {
    return (
        <h1 className="hero-title">
            {HEADLINE.map((line, li) => (
                <span key={li} className="hero-line">
                    {line.map((w, wi) => {
                        const i = LINE_OFFSETS[li] + wi
                        const Word = (
                            <motion.span
                                key={w.t}
                                className="hero-word"
                                initial={{ opacity: 0, rotateX: -95, y: 24 }}
                                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                                transition={{ duration: 0.75, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {w.t}
                            </motion.span>
                        )
                        return w.em ? <em key={w.t}>{Word}</em> : Word
                    })}
                </span>
            ))}
        </h1>
    )
}

const usernameFromEmail = (email, attempt = 0) => {
    const base = (email.split('@')[0] || 'chef').replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 20) || 'chef'
    return attempt === 0 ? base : `${base}${Math.floor(1000 + Math.random() * 9000)}`
}

const Home = () => {
    const { data: session } = useSession()
    const router = useRouter()
    const reduceMotion = useReducedMotionAfterMount()
    // Low-end devices: entrances only fade, no flips or slides. Read once from
    // <html>; it changes no markup, so the server's "false" is harmless.
    const [lowPower] = useState(isLowPower)

    const [clientLoggedIn, setClientLoggedIn] = useState(null)
    const [isSignupOpen, setIsSignupOpen] = useState(false)
    const [signupSuccess, setSignupSuccess] = useState(false)
    const [signupForm, setSignupForm] = useState({ fullName: '', email: '', password: '' })
    const [signupError, setSignupError] = useState('')
    const [signupBusy, setSignupBusy] = useState(false)
    const [ctaEmail, setCtaEmail] = useState('')

    useEffect(() => {
        queueMicrotask(() => setClientLoggedIn(!!(session?.user || isAuthenticated())))
    }, [session])

    useEffect(() => {
        if (!isSignupOpen) return undefined
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = ''
        }
    }, [isSignupOpen])

    const openSignup = (prefillEmail = '') => {
        setSignupError('')
        if (prefillEmail) setSignupForm((f) => ({ ...f, email: prefillEmail }))
        setIsSignupOpen(true)
    }

    const handleModalSignup = async (e) => {
        e.preventDefault()
        setSignupError('')

        const fullName = signupForm.fullName.trim()
        const email = signupForm.email.trim()
        const { password } = signupForm

        if (!fullName) return setSignupError('Please enter your name')
        if (!email) return setSignupError('Please enter your email')
        if (password.length < 6) return setSignupError('Password must be at least 6 characters')

        setSignupBusy(true)
        try {
            let res = null
            // The API rejects duplicate usernames, so retry once with a suffix.
            for (let attempt = 0; attempt < 2; attempt++) {
                res = await signupUser({ username: usernameFromEmail(email, attempt), fullName, email, password })
                    .catch((err) => ({ success: false, message: err.message }))
                if (res?.success || !/username already exists/i.test(res?.message || '')) break
            }

            if (res?.success) {
                saveUserData(res.data)
                scheduleAutoLogout()
                setSignupSuccess(true)
            } else {
                setSignupError(res?.message || 'Could not create your account. Please try again.')
            }
        } catch (err) {
            setSignupError(err.message || 'Something went wrong')
        } finally {
            setSignupBusy(false)
        }
    }

    return (
        <MotionConfig reducedMotion={lowPower ? 'always' : 'user'}>
        <div className="landing-page">
            <Header overlay />

            <section className="hero">
                <div className="hero-glow" aria-hidden="true" />
                <div className="hero-grid-floor" aria-hidden="true" />
                <HeroScene />

                {/* small screens, where the 3D room is switched off */}
                <div className="hero-bg-emoji" style={{ top: '12%', left: '5%' }} aria-hidden="true">🍋</div>
                <div className="hero-bg-emoji" style={{ top: '20%', right: '7%' }} aria-hidden="true">🥕</div>
                <div className="hero-bg-emoji" style={{ top: '70%', left: '8%' }} aria-hidden="true">🥑</div>
                <div className="hero-bg-emoji" style={{ top: '75%', right: '5%' }} aria-hidden="true">🍅</div>

                <motion.div
                    className="hero-badge"
                    initial={{ opacity: 0, y: -16, rotateX: 60 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="hero-badge-dot" />
                    AI kitchen companion
                </motion.div>

                <FlipHeadline />

                <motion.p
                    className="hero-subtitle"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.55 }}
                >
                    Say what&apos;s in your fridge. Get dinner in seconds.
                </motion.p>

                <motion.div
                    className="hero-cta"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.65 }}
                >
                    <Link href={clientLoggedIn ? '/kitchen' : '/signup'} className="hero-cta-primary">
                        {clientLoggedIn ? 'Open your kitchen' : 'Start cooking free'}
                        <span aria-hidden="true">→</span>
                    </Link>
                    <a href="#how" className="hero-cta-ghost">How it works</a>
                </motion.div>

                <motion.div
                    className="hero-chat-stage"
                    initial={{ opacity: 0, y: 60, rotateX: reduceMotion ? 0 : 28, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                    transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* No pointer tilt here: a card that rotates under the cursor makes
                        Chrome mis-hit-test its chips and send button, so clicks fell
                        through to the strip behind them. */}
                    <HeroChat />
                </motion.div>

                <motion.div
                    className="hero-proof"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                >
                    {[
                        { v: <CountUp to={30} suffix="s" />, l: 'to a recipe' },
                        { v: <CountUp to={6} />, l: 'tools' },
                        { v: <>&#8377;<CountUp to={0} /></>, l: 'to start' },
                    ].map((s, i) => (
                        <React.Fragment key={s.l}>
                            {i > 0 && <span className="proof-sep" aria-hidden="true" />}
                            <div className="proof-stat">
                                <div className="proof-stat-val">{s.v}</div>
                                <div className="proof-stat-lbl">{s.l}</div>
                            </div>
                        </React.Fragment>
                    ))}
                </motion.div>
            </section>

            <IngredientMarquee />

            <section className="cube-section">
                <Reveal3D className="cube-copy">
                    <div className="section-label">One app</div>
                    <h2 className="section-title cube-title">Six tools.<br />One <em>kitchen</em>.</h2>
                </Reveal3D>
                <ParallaxDepth speed={36} className="cube-holder">
                    <FeatureCube />
                </ParallaxDepth>
            </section>

            <HowItWorks />
            <Features />
            <Testimonials />
            <Pricing />
            <Faq />

            {clientLoggedIn === false && (
                <section id="cta" className="cta-section">
                    <div className="cta-orbit" aria-hidden="true">
                        {['🥦', '🍋', '🥕', '🍅', '🥑', '🫑'].map((e, i) => (
                            <span key={e} style={{ '--i': i }}>{e}</span>
                        ))}
                    </div>
                    <Reveal3D>
                        <h2>Dinner&apos;s sorted. <em>Start free.</em></h2>
                    </Reveal3D>
                    <form
                        className="cta-form"
                        onSubmit={(e) => {
                            e.preventDefault()
                            openSignup(ctaEmail.trim())
                        }}
                    >
                        <label className="sr-only" htmlFor="cta-email">Email address</label>
                        <input
                            id="cta-email"
                            className="cta-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@email.com"
                            value={ctaEmail}
                            onChange={(e) => setCtaEmail(e.target.value)}
                        />
                        <button className="cta-btn" type="submit">Get started →</button>
                    </form>
                    <p className="cta-note">No card. No spam.</p>
                </section>
            )}

            <Footer />

            <AnimatePresence>
                {isSignupOpen && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !signupSuccess && setIsSignupOpen(false)}
                        style={{ perspective: 1200 }}
                    >
                        <motion.div
                            className="modal-box"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="signup-title"
                            initial={{ opacity: 0, rotateX: 24, y: 40, scale: 0.94 }}
                            animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
                            exit={{ opacity: 0, rotateX: -14, y: 20, scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!signupSuccess ? (
                                <>
                                    <div className="modal-top">
                                        <h2 id="signup-title">Start cooking smarter 🥦</h2>
                                        <button className="modal-close-btn" onClick={() => setIsSignupOpen(false)} aria-label="Close">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        className="modal-google"
                                        onClick={() => signIn('google', { callbackUrl: '/kitchen' })}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                        </svg>
                                        Continue with Google
                                    </button>
                                    <div className="modal-divider"><span>or</span></div>

                                    <form onSubmit={handleModalSignup} noValidate>
                                        <input
                                            className="modal-input"
                                            type="text"
                                            autoComplete="name"
                                            placeholder="Your name"
                                            aria-label="Your name"
                                            value={signupForm.fullName}
                                            onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                                        />
                                        <input
                                            className="modal-input"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="Email address"
                                            aria-label="Email address"
                                            value={signupForm.email}
                                            onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                                        />
                                        <input
                                            className="modal-input"
                                            type="password"
                                            autoComplete="new-password"
                                            placeholder="Password (6+ characters)"
                                            aria-label="Password"
                                            value={signupForm.password}
                                            onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                                        />

                                        {signupError && <p className="modal-error" role="alert">{signupError}</p>}

                                        <button className="modal-submit" type="submit" disabled={signupBusy}>
                                            {signupBusy ? 'Creating your account…' : 'Create free account →'}
                                        </button>
                                    </form>

                                    <p className="modal-fine">
                                        Have an account?{' '}
                                        <Link href="/login" className="modal-link" onClick={() => setIsSignupOpen(false)}>Sign in</Link>
                                    </p>
                                </>
                            ) : (
                                <div className="success-state">
                                    <motion.div
                                        className="success-emoji"
                                        initial={{ rotateY: -180, scale: 0.4 }}
                                        animate={{ rotateY: 0, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                                    >
                                        🎉
                                    </motion.div>
                                    <h3>You&apos;re in!</h3>
                                    <p>Unlimited AI is unlocked. Let&apos;s cook.</p>
                                    <button onClick={() => router.push('/kitchen')} className="modal-submit" style={{ marginTop: '20px' }}>
                                        Open my kitchen →
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        </MotionConfig>
    )
}

export default Home
