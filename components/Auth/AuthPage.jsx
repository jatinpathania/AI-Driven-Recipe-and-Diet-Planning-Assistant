"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, X, Mail, Lock, User, IdCard, Sparkles, ArrowLeft, ArrowRight, MailCheck, Loader2 } from "lucide-react"
import { motion, AnimatePresence, MotionConfig, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion"
import { Fraunces } from "next/font/google"
import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { loginUser, signupUser, verifySignupOtp, resendSignupOtp, saveUserData, scheduleAutoLogout, getTokenExpiryMs, clearAuthStorage } from "@/utils/api"

// Display face for headings: a soft serif in the spirit of the landing hero.
// Body text uses Plus Jakarta Sans, already loaded in the root layout.
const display = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], display: "swap" })
const BODY_FONT = "var(--font-jakarta), ui-sans-serif, system-ui, sans-serif"

const INPUT_BASE =
    "w-full h-14 rounded-xl text-base sm:text-[15px] text-white placeholder:text-white/30 bg-white/[0.03] outline-none transition-all duration-300 border border-white/10 focus:border-white/30 focus:bg-white/[0.08] focus:ring-4 focus:ring-white/5 hover:bg-white/[0.05]"

const AUTH_COINS = [
    { e: "🥦", top: "12%", left: "8%", size: 44, depth: 36 },
    { e: "🍋", top: "70%", left: "6%", size: 36, depth: 22 },
    { e: "🥕", top: "18%", left: "86%", size: 40, depth: 28 },
    { e: "🍅", top: "76%", left: "84%", size: 46, depth: 40 },
    { e: "🥑", top: "44%", left: "92%", size: 30, depth: 16 },
]

const EASE_OUT = [0.22, 1, 0.36, 1]

// Panels (sign up / sign in / code) slide and blur between each other;
// their children rise in one after another.
const panel = {
    hidden: (dir) => ({ opacity: 0, x: dir * 24, filter: "blur(6px)" }),
    show: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.45, ease: EASE_OUT, staggerChildren: 0.055, delayChildren: 0.05 } },
    exit: (dir) => ({ opacity: 0, x: dir * -24, filter: "blur(6px)", transition: { duration: 0.22, ease: "easeIn" } }),
}
const rise = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
}

export default function AuthPage({ initialTab = "signin" }) {
    const router = useRouter()
    const pathname = usePathname()
    const { data: session, status } = useSession()

    const [tab, setTab] = useState(initialTab)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const [signInForm, setSignInForm] = useState({ email: "", password: "" })
    const [signUpForm, setSignUpForm] = useState({
        username: "",
        fullName: "",
        email: "",
        password: "",
    })
    // Set once the sign-up code has been emailed: { email, resendAt, notice }.
    const [otp, setOtp] = useState(null)

    // Redirect if already logged in
    useEffect(() => {
        if (status === "loading") return

        if (status === "authenticated") {
            router.replace("/kitchen")
            return
        }

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) return

        const msLeft = getTokenExpiryMs(token)
        if (msLeft !== null && msLeft <= 0) {
            // Expired: drop it quietly so the user can just log in again.
            clearAuthStorage()
            return
        }

        router.replace("/kitchen")
    }, [status, router])

    useEffect(() => {
        if (pathname === "/login") setTab("signin")
        if (pathname === "/signup") setTab("signup")
    }, [pathname])

    const switchTab = (newTab) => {
        setTab(newTab)
        setOtp(null)
        setError("")
        setShowPassword(false)
        const path = newTab === "signin" ? "/login" : "/signup"
        window.history.replaceState(null, "", path)
    }

    const handleSignIn = async (e) => {
        e.preventDefault()
        setError("")

        if (!signInForm.email) return setError("Email or username is required")
        if (!signInForm.password || signInForm.password.length < 6) {
            return setError("Password must be at least 6 characters")
        }

        setLoading(true)
        try {
            const res = await loginUser(signInForm)
            if (res?.success) {
                saveUserData(res.data)
                scheduleAutoLogout()
                router.push("/kitchen")
            } else {
                setError(res?.message || "Invalid credentials")
            }
        } catch (err) {
            setError(err.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const handleSignUp = async (e) => {
        e.preventDefault()
        setError("")

        if (!signUpForm.username) return setError("Username is required")
        if (!signUpForm.fullName) return setError("Full name is required")
        if (!signUpForm.email) return setError("Email is required")
        if (!signUpForm.password || signUpForm.password.length < 6) {
            return setError("Password must be at least 6 characters")
        }

        setLoading(true)
        try {
            const res = await signupUser(signUpForm)
            if (res?.success && res.otpRequired) {
                // Step 2: the account is created once the emailed code is entered.
                // The heading already says a code was sent; only repeat the server's note when it adds something.
                setOtp({ email: res.email, resendAt: Date.now() + (res.resendInSec || 0) * 1000, notice: /already/i.test(res.message || "") ? res.message : "" })
            } else if (res?.success && res.data?.token) {
                finishSignIn(res.data)
            } else {
                setError(res?.message || "Signup failed")
            }
        } catch (err) {
            setError(err.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const finishSignIn = (data) => {
        saveUserData(data)
        scheduleAutoLogout()
        router.push("/kitchen")
    }

    // Sign up sits left of sign in, so panels slide the way the tabs read.
    const dir = tab === "signup" ? -1 : 1

    const passwordToggle = (
        <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 text-white/30 hover:text-white/70 transition-colors"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={showPassword ? "hide" : "show"}
                    initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                    transition={{ duration: 0.18 }}
                    className="block"
                >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.span>
            </AnimatePresence>
        </button>
    )

    return (
        <MotionConfig reducedMotion="user">
            <div
                className="min-h-screen min-h-[100svh] flex items-center justify-center p-4 md:p-8 relative overflow-hidden"
                style={{
                    background: "radial-gradient(ellipse at 50% 0%, #1a4d2e 0%, #0d2715 45%, #051108 100%)",
                    fontFamily: BODY_FONT,
                }}
            >
                <AuthBackground />

                <motion.div
                    initial={{ opacity: 0, y: 36, rotateX: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 180, damping: 22 }}
                    style={{ transformPerspective: 1200 }}
                    className="relative z-10 w-full max-w-[560px]"
                >
                    <SpotlightCard>
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.5, ease: EASE_OUT }}
                            className="px-5 md:px-8 pt-5 md:pt-6 pb-1"
                        >
                            <Link href="/" className="group inline-flex items-center gap-2 sm:gap-3">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                    className="relative"
                                >
                                    <Image src="/icon.png" alt="Flavour AI" width={36} height={36} priority className="w-8 h-8 sm:w-9 sm:h-9 transition-transform duration-300 group-hover:scale-110" />
                                    <motion.div
                                        className="absolute -top-1 -right-1"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Sparkles className="w-3 h-3 text-green-700" />
                                    </motion.div>
                                </motion.div>

                                <div className={`${display.className} flex items-center text-xl sm:text-[22px] font-semibold tracking-tight`}>
                                    <span className="text-green-100">Flavour</span>
                                    <span className="text-green-400">.</span>
                                    <span className="text-green-400">AI</span>
                                </div>
                            </Link>
                        </motion.div>

                        <div className="px-5 md:px-8 pt-5 md:pt-7 pb-4 flex items-center justify-between gap-3">
                            <div className="relative flex bg-black/40 p-1 rounded-2xl border border-white/10">
                                {[
                                    { id: "signup", label: "Sign up" },
                                    { id: "signin", label: "Sign in" },
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => tab !== t.id && switchTab(t.id)}
                                        aria-pressed={tab === t.id}
                                        className={`relative px-4 md:px-6 h-9 rounded-xl text-sm font-semibold transition-colors duration-300 ${tab === t.id ? "text-white" : "text-white/45 hover:text-white/75"}`}
                                    >
                                        {tab === t.id && (
                                            <motion.span
                                                layoutId="auth-tab-pill"
                                                className="absolute inset-0 rounded-xl bg-white/10 border border-white/[0.06]"
                                                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                                            />
                                        )}
                                        <span className="relative">{t.label}</span>
                                    </button>
                                ))}
                            </div>

                            <Link
                                href="/"
                                aria-label="Close"
                                className="group w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-white/40 transition-transform duration-300 group-hover:rotate-90 group-hover:text-white/70" />
                            </Link>
                        </div>

                        <div className="px-5 md:px-8 pb-8 md:pb-10">
                            <AnimatePresence mode="wait" custom={dir}>
                                {tab === "signup" && otp ? (
                                    <OtpStep
                                        key="otp"
                                        otp={otp}
                                        setOtp={setOtp}
                                        onVerified={finishSignIn}
                                        onBack={() => {
                                            setOtp(null)
                                            setError("")
                                        }}
                                    />
                                ) : tab === "signup" ? (
                                    <motion.div key="signup" custom={dir} variants={panel} initial="hidden" animate="show" exit="exit">
                                        <AuthHeading lead="Create an" accent="account" />
                                        <motion.p variants={rise} className="text-white/45 text-[15px] mt-2 mb-6 sm:mb-7">
                                            Your AI sous-chef is ready. It takes less than a minute.
                                        </motion.p>

                                        <form onSubmit={handleSignUp} className="space-y-4">
                                            <motion.div variants={rise} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Field icon={User}>
                                                    <input
                                                        type="text"
                                                        placeholder="Username"
                                                        autoComplete="username"
                                                        value={signUpForm.username}
                                                        onChange={(e) => setSignUpForm({ ...signUpForm, username: e.target.value })}
                                                        className={`${INPUT_BASE} pl-12 pr-5`}
                                                        style={{ minHeight: 56 }}
                                                        required
                                                    />
                                                </Field>
                                                <Field icon={IdCard}>
                                                    <input
                                                        type="text"
                                                        placeholder="Full name"
                                                        autoComplete="name"
                                                        value={signUpForm.fullName}
                                                        onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value })}
                                                        className={`${INPUT_BASE} pl-12 pr-5`}
                                                        style={{ minHeight: 56 }}
                                                        required
                                                    />
                                                </Field>
                                            </motion.div>

                                            <motion.div variants={rise}>
                                                <Field icon={Mail}>
                                                    <input
                                                        type="email"
                                                        placeholder="Enter your email"
                                                        autoComplete="email"
                                                        value={signUpForm.email}
                                                        onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                                                        className={`${INPUT_BASE} pl-12 pr-5`}
                                                        style={{ minHeight: 56 }}
                                                        required
                                                    />
                                                </Field>
                                            </motion.div>

                                            <motion.div variants={rise}>
                                                <Field icon={Lock}>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Password (6+ characters)"
                                                        autoComplete="new-password"
                                                        value={signUpForm.password}
                                                        onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                                                        className={`${INPUT_BASE} pl-12 pr-12`}
                                                        style={{ minHeight: 56 }}
                                                        required
                                                        minLength={6}
                                                    />
                                                    {passwordToggle}
                                                </Field>
                                            </motion.div>

                                            <AnimatePresence>{error && <ErrorDisplay key={error} error={error} />}</AnimatePresence>

                                            <motion.div variants={rise} className="pt-4">
                                                <PrimaryButton loading={loading} loadingText="Creating account">
                                                    Create an account
                                                </PrimaryButton>
                                            </motion.div>
                                        </form>

                                        <motion.div variants={rise} className="my-8"><Divider /></motion.div>
                                        <motion.div variants={rise}><SocialButtons /></motion.div>

                                        <motion.p variants={rise} className="text-center text-white/25 text-[12px] mt-8">
                                            By creating an account, you agree to our Terms & Service
                                        </motion.p>
                                    </motion.div>
                                ) : (
                                    <motion.div key="signin" custom={dir} variants={panel} initial="hidden" animate="show" exit="exit">
                                        <AuthHeading lead="Welcome" accent="back" />
                                        <motion.p variants={rise} className="text-white/45 text-[15px] mt-2 mb-6 sm:mb-7">
                                            Sign in to pick up where you left off in the kitchen.
                                        </motion.p>

                                        <form onSubmit={handleSignIn} className="space-y-4">
                                            <motion.div variants={rise}>
                                                <Field icon={Mail}>
                                                    <input
                                                        type="text"
                                                        placeholder="Email or username"
                                                        autoComplete="username"
                                                        value={signInForm.email}
                                                        onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                                                        className={`${INPUT_BASE} pl-12 pr-5`}
                                                        style={{ minHeight: 56 }}
                                                        required
                                                    />
                                                </Field>
                                            </motion.div>

                                            <motion.div variants={rise}>
                                                <Field icon={Lock}>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Password"
                                                        autoComplete="current-password"
                                                        value={signInForm.password}
                                                        onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                                                        className={`${INPUT_BASE} pl-12 pr-12`}
                                                        style={{ minHeight: 56 }}
                                                        required
                                                        minLength={6}
                                                    />
                                                    {passwordToggle}
                                                </Field>
                                            </motion.div>

                                            <AnimatePresence>{error && <ErrorDisplay key={error} error={error} />}</AnimatePresence>

                                            <motion.div variants={rise} className="pt-4">
                                                <PrimaryButton loading={loading} loadingText="Signing in">
                                                    Sign in
                                                </PrimaryButton>
                                            </motion.div>
                                        </form>

                                        <motion.div variants={rise} className="my-8"><Divider /></motion.div>
                                        <motion.div variants={rise}><SocialButtons /></motion.div>

                                        <motion.p variants={rise} className="text-center text-white/25 text-[12px] mt-8">
                                            By signing in, you agree to our Terms & Service
                                        </motion.p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </SpotlightCard>
                </motion.div>
            </div>
        </MotionConfig>
    )
}

/** Glows, receding grid floor and ingredient coins that drift with the pointer. */
function AuthBackground() {
    const px = useMotionValue(0)
    const py = useMotionValue(0)
    const sx = useSpring(px, { stiffness: 40, damping: 18 })
    const sy = useSpring(py, { stiffness: 40, damping: 18 })

    useEffect(() => {
        const onMove = (e) => {
            px.set(e.clientX / window.innerWidth - 0.5)
            py.set(e.clientY / window.innerHeight - 0.5)
        }
        window.addEventListener("pointermove", onMove, { passive: true })
        return () => window.removeEventListener("pointermove", onMove)
    }, [px, py])

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <motion.div
                className="absolute top-[-10%] left-[20%] w-[420px] h-[420px] rounded-full blur-[120px] opacity-25 bg-green-500/20"
                animate={{ x: [0, 60, -20, 0], y: [0, 30, 50, 0], scale: [1, 1.15, 0.95, 1] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-[-10%] right-[20%] w-[420px] h-[420px] rounded-full blur-[120px] opacity-20 bg-emerald-500/20"
                animate={{ x: [0, -50, 30, 0], y: [0, -40, -10, 0], scale: [1, 0.9, 1.12, 1] }}
                transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* receding grid floor, scrolling slowly toward the viewer like the landing hero */}
            <motion.div
                className="absolute inset-x-[-20%] bottom-[-8%] h-[45%] opacity-40"
                style={{
                    backgroundImage: "linear-gradient(rgba(52,211,153,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.18) 1px, transparent 1px)",
                    backgroundSize: "56px 56px",
                    transform: "perspective(600px) rotateX(62deg)",
                    transformOrigin: "center top",
                    maskImage: "linear-gradient(to bottom, transparent, black 35%, transparent)",
                    WebkitMaskImage: "linear-gradient(to bottom, transparent, black 35%, transparent)",
                }}
                animate={{ backgroundPositionY: ["0px", "56px"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            {AUTH_COINS.map((c, i) => (
                <Coin key={c.e} coin={c} index={i} sx={sx} sy={sy} />
            ))}
        </div>
    )
}

function Coin({ coin, index, sx, sy }) {
    const x = useTransform(sx, (v) => v * -coin.depth)
    const y = useTransform(sy, (v) => v * -coin.depth)
    return (
        <motion.span
            className="absolute select-none"
            style={{ top: coin.top, left: coin.left, x, y }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 0.16, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.12, duration: 0.8, ease: EASE_OUT }}
        >
            <motion.span
                className="block"
                style={{ fontSize: coin.size }}
                animate={{ rotateY: [0, 360], y: [0, -14, 0] }}
                transition={{ duration: 7 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.6 }}
            >
                {coin.e}
            </motion.span>
        </motion.span>
    )
}

/** The glass card, with a soft light that follows the pointer and a sheen along the top edge. */
function SpotlightCard({ children }) {
    const mx = useMotionValue(-400)
    const my = useMotionValue(-400)
    const glow = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, rgba(255,255,255,0.06), transparent 70%)`
    const edge = useMotionTemplate`radial-gradient(260px circle at ${mx}px ${my}px, rgba(74,222,128,0.35), transparent 70%)`

    return (
        <div
            onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                mx.set(e.clientX - r.left)
                my.set(e.clientY - r.top)
            }}
            onPointerLeave={() => {
                mx.set(-400)
                my.set(-400)
            }}
            className="group/card relative rounded-[32px] border border-white/[0.08] bg-black/50 backdrop-blur-3xl overflow-hidden"
            style={{ boxShadow: "0 40px 80px -20px rgba(0, 0, 0, 0.55)" }}
        >
            {/* pointer light on the surface */}
            <motion.div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" style={{ background: glow }} aria-hidden="true" />
            {/* the same light picking out the border */}
            <motion.div
                className="pointer-events-none absolute inset-0 rounded-[32px] opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
                style={{
                    background: edge,
                    padding: 1,
                    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                }}
                aria-hidden="true"
            />
            {/* sheen travelling along the top edge */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden" aria-hidden="true">
                <motion.div
                    className="h-full w-1/3 bg-gradient-to-r from-transparent via-green-300/60 to-transparent"
                    animate={{ x: ["-100%", "400%"] }}
                    transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
                />
            </div>
            <div className="relative">{children}</div>
        </div>
    )
}

/** Serif heading whose words rise in one by one; the last word is italic in the brand green. */
function AuthHeading({ lead, accent }) {
    const words = lead.split(" ")
    return (
        <motion.h2
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            className={`${display.className} text-[32px] sm:text-[42px] leading-[1.1] font-semibold tracking-[-0.02em] text-white mt-3`}
        >
            {words.map((w, i) => (
                <span key={i} className="inline-block overflow-hidden pb-1 -mb-1 align-bottom">
                    <motion.span
                        className="inline-block"
                        variants={{ hidden: { y: "105%" }, show: { y: 0, transition: { duration: 0.6, ease: EASE_OUT } } }}
                    >
                        {w}&nbsp;
                    </motion.span>
                </span>
            ))}
            <span className="inline-block overflow-hidden pb-1 -mb-1 pr-1 align-bottom">
                <motion.span
                    className="inline-block italic font-medium text-green-400"
                    variants={{ hidden: { y: "105%", rotate: 6 }, show: { y: 0, rotate: 0, transition: { duration: 0.7, ease: EASE_OUT } } }}
                >
                    {accent}
                </motion.span>
            </span>
        </motion.h2>
    )
}

/** Input with a leading icon that lights up while the field has focus. */
function Field({ icon: Icon, children }) {
    return (
        <div className="group relative flex items-center">
            <Icon className="pointer-events-none absolute left-4 w-4 h-4 text-white/25 transition-all duration-300 group-focus-within:text-green-300 group-focus-within:scale-110" />
            {children}
        </div>
    )
}

/** White call-to-action with a light sweep on hover and a spinner while busy. */
function PrimaryButton({ loading, loadingText, disabled, children }) {
    return (
        <motion.button
            type="submit"
            disabled={loading || disabled}
            whileHover={loading || disabled ? undefined : { y: -1 }}
            whileTap={loading || disabled ? undefined : { scale: 0.98 }}
            className="group relative w-full h-14 overflow-hidden bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_-12px_rgba(255,255,255,0.35)]"
        >
            <span
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-black/[0.07] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[300%] group-disabled:hidden"
                aria-hidden="true"
            />
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={loading ? "busy" : "idle"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="relative inline-flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {loadingText}…
                        </>
                    ) : (
                        <>
                            {children}
                            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                    )}
                </motion.span>
            </AnimatePresence>
        </motion.button>
    )
}

const CODE_LENGTH = 6
const EMPTY_CODE = Array(CODE_LENGTH).fill("")

/** Sign-up step 2: enter the 6-digit code that was emailed. */
function OtpStep({ otp, setOtp, onVerified, onBack }) {
    const [digits, setDigits] = useState(EMPTY_CODE)
    const [verifying, setVerifying] = useState(false)
    const [resending, setResending] = useState(false)
    const [error, setError] = useState("")
    const [notice, setNotice] = useState(otp.notice || "")
    const [now, setNow] = useState(() => Date.now())
    const refs = useRef([])

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [])

    useEffect(() => {
        refs.current[0]?.focus()
    }, [])

    const wait = Math.max(0, Math.ceil((otp.resendAt - now) / 1000))
    const code = digits.join("")
    const complete = code.length === CODE_LENGTH

    const clearCode = () => {
        setDigits(EMPTY_CODE)
        requestAnimationFrame(() => refs.current[0]?.focus())
    }

    const verify = async (value = code) => {
        if (value.length !== CODE_LENGTH || verifying) return
        setVerifying(true)
        setError("")
        try {
            const res = await verifySignupOtp({ email: otp.email, code: value })
            if (res?.success && res.data?.token) onVerified(res.data)
            else setError(res?.message || "Could not verify the code")
        } catch (err) {
            setError(err.message || "Something went wrong")
            setNotice("")
            clearCode()
        } finally {
            setVerifying(false)
        }
    }

    // Typing, pasting and SMS/email autofill all land here: spread the digits
    // across the boxes from `index` on, and submit once all six are in.
    const fill = (index, raw) => {
        const chars = String(raw).replace(/\D/g, "").split("")
        const next = [...digits]
        if (!chars.length) {
            next[index] = ""
            setDigits(next)
            return
        }
        let i = index
        for (const ch of chars) {
            if (i >= CODE_LENGTH) break
            next[i++] = ch
        }
        setDigits(next)
        refs.current[Math.min(i, CODE_LENGTH - 1)]?.focus()
        if (next.every(Boolean)) verify(next.join(""))
    }

    const onKeyDown = (i, e) => {
        if (e.key === "Backspace" && !digits[i] && i > 0) {
            e.preventDefault()
            const next = [...digits]
            next[i - 1] = ""
            setDigits(next)
            refs.current[i - 1]?.focus()
        } else if (e.key === "ArrowLeft" && i > 0) {
            refs.current[i - 1]?.focus()
        } else if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) {
            refs.current[i + 1]?.focus()
        }
    }

    const resend = async () => {
        if (wait > 0 || resending) return
        setResending(true)
        setError("")
        try {
            const res = await resendSignupOtp(otp.email)
            setOtp({ ...otp, resendAt: Date.now() + (res.resendInSec || 60) * 1000 })
            setNotice(res.message || "New code sent.")
            clearCode()
        } catch (err) {
            if (err.data?.resendInSec) setOtp({ ...otp, resendAt: Date.now() + err.data.resendInSec * 1000 })
            setError(err.message || "Could not send a new code")
        } finally {
            setResending(false)
        }
    }

    return (
        <motion.div custom={1} variants={panel} initial="hidden" animate="show" exit="exit">
            <motion.button
                variants={rise}
                type="button"
                onClick={onBack}
                className="group mt-1 inline-flex items-center gap-1.5 text-sm text-white/45 hover:text-white/80 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" /> Edit details
            </motion.button>

            <div className="relative mt-6 w-14 h-14">
                {/* soft ping behind the envelope while waiting for the code */}
                <motion.span
                    className="absolute inset-0 rounded-2xl border border-emerald-400/30"
                    animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
                    aria-hidden="true"
                />
                <motion.div
                    initial={{ rotateY: -180, scale: 0.6, opacity: 0 }}
                    animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.05 }}
                    style={{ transformPerspective: 500 }}
                    className="relative w-14 h-14 rounded-2xl grid place-items-center border border-emerald-400/20 bg-emerald-500/10"
                >
                    <MailCheck className="w-7 h-7 text-emerald-300" />
                </motion.div>
            </div>

            <div className="mt-2">
                <AuthHeading lead="Check your" accent="email" />
            </div>
            <motion.p variants={rise} className="text-white/50 text-[15px] leading-relaxed mt-2 mb-7">
                We sent a 6-digit code to <span className="text-white font-semibold break-all">{otp.email}</span>. Enter it below to finish creating your account.
            </motion.p>

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    verify()
                }}
                className="space-y-4"
            >
                <motion.div
                    variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                    className="flex justify-between gap-2 sm:gap-3"
                    role="group"
                    aria-label="Verification code"
                >
                    {digits.map((d, i) => (
                        // Entry animation on the wrapper (driven by the panel's variants);
                        // the input's own animate prop would cut it off from them.
                        <motion.div
                            key={i}
                            className="flex-1 min-w-0"
                            variants={{
                                hidden: { opacity: 0, y: 16, scale: 0.9 },
                                show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 22 } },
                            }}
                        >
                        <motion.input
                            initial={false}
                            animate={{ scale: d ? [1, 1.08, 1] : 1 }}
                            transition={{ duration: 0.25 }}
                            ref={(el) => {
                                refs.current[i] = el
                            }}
                            value={d}
                            onChange={(e) => fill(i, e.target.value.slice(d ? 1 : 0) || e.target.value)}
                            onKeyDown={(e) => onKeyDown(i, e)}
                            onPaste={(e) => {
                                e.preventDefault()
                                fill(i, e.clipboardData.getData("text"))
                            }}
                            onFocus={(e) => e.target.select()}
                            inputMode="numeric"
                            autoComplete={i === 0 ? "one-time-code" : "off"}
                            maxLength={CODE_LENGTH}
                            aria-label={`Digit ${i + 1}`}
                            disabled={verifying}
                            className={`w-full min-w-0 h-14 sm:h-16 rounded-xl text-center text-2xl sm:text-[28px] font-bold tabular-nums text-white outline-none transition-[background-color,border-color,box-shadow] duration-200 border bg-white/[0.03] focus:bg-white/[0.08] focus:ring-4 focus:ring-emerald-400/10 disabled:opacity-60 ${display.className} ${d ? "border-emerald-400/50" : "border-white/10 focus:border-white/30"}`}
                        />
                        </motion.div>
                    ))}
                </motion.div>

                <AnimatePresence mode="wait">
                    {error ? (
                        <ErrorDisplay key={`e-${error}`} error={error} />
                    ) : notice ? (
                        <motion.p
                            key={`n-${notice}`}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-emerald-300/90 text-sm text-center py-3 px-4 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.06]"
                            aria-live="polite"
                        >
                            {notice}
                        </motion.p>
                    ) : null}
                </AnimatePresence>

                <motion.div variants={rise} className="pt-2">
                    <PrimaryButton loading={verifying} loadingText="Verifying" disabled={!complete}>
                        Verify & create account
                    </PrimaryButton>
                </motion.div>
            </form>

            <motion.p variants={rise} className="text-center text-white/40 text-sm mt-6">
                Didn&apos;t get it? Check your spam folder, or{" "}
                {wait > 0 ? (
                    <span className="text-white/60 tabular-nums">resend in {Math.floor(wait / 60)}:{String(wait % 60).padStart(2, "0")}</span>
                ) : (
                    <button type="button" onClick={resend} disabled={resending} className="font-semibold text-emerald-300 hover:text-emerald-200 disabled:opacity-50">
                        {resending ? "sending..." : "resend code"}
                    </button>
                )}
            </motion.p>
            <motion.p variants={rise} className="text-center text-white/25 text-[12px] mt-3">The code expires in 10 minutes.</motion.p>
        </motion.div>
    )
}

/** Error line that drops in with a short shake, so a failed attempt is noticed. */
function ErrorDisplay({ error }) {
    return (
        <motion.p
            role="alert"
            initial={{ opacity: 0, y: -6, x: 0 }}
            animate={{ opacity: 1, y: 0, x: [0, -7, 7, -4, 4, 0] }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
            transition={{ duration: 0.45, x: { duration: 0.4, delay: 0.05 } }}
            className="text-red-400/90 text-sm text-center py-3 px-4 rounded-xl border border-red-500/15"
            style={{ background: "rgba(239,68,68,0.06)" }}
        >
            {error}
        </motion.p>
    )
}

function Divider() {
    return (
        <div className="relative flex items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="mx-4 text-[10px] uppercase tracking-[2px] font-bold text-white/25 whitespace-nowrap">
                Or sign in with
            </span>
            <div className="flex-grow border-t border-white/10" />
        </div>
    )
}

function SocialButtons() {
    const { data: session, status } = useSession()

    const btnClass =
        "h-14 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center hover:bg-white/[0.05] hover:border-white/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"

    const isLoading = status === "loading"
    const isSignedIn = Boolean(session)

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/kitchen" })}
                disabled={isLoading || isSignedIn}
                className={`${btnClass} w-full disabled:opacity-60 disabled:cursor-not-allowed`}
            >
                <svg className="w-5 h-5" viewBox="0 0 533.5 544.3">
                    <path fill="#4285F4" d="M533.5 278.4c0-18.5-1.5-36.3-4.3-53.6H272v101.5h147.1c-6.4 34.7-25.7 64.1-54.8 83.7v69.6h88.4c51.7-47.6 81.8-117.8 81.8-201.2z" />
                    <path fill="#34A853" d="M272 544.3c73.7 0 135.6-24.4 180.8-66.3l-88.4-69.6c-24.6 16.5-56 26.3-92.4 26.3-71 0-131.2-47.9-152.6-112.2H28.6v70.6C73.6 483.8 166 544.3 272 544.3z" />
                    <path fill="#FBBC05" d="M119.4 323.1c-5.6-16.5-8.8-34.1-8.8-52s3.2-35.5 8.8-52V148.3H28.6C10.1 185.8 0 225.2 0 265.1s10.1 79.3 28.6 116.8l90.8-58.8z" />
                    <path fill="#EA4335" d="M272 107.4c39.9 0 75.7 13.7 104 40.5l78-78C407.7 24.4 345.8 0 272 0 166 0 73.6 60.5 28.6 148.3l90.8 70.6C140.8 155.3 201 107.4 272 107.4z" />
                </svg>
                <span className="ml-3 text-sm text-white/80 font-medium">
                    {isLoading ? "Checking session..." : isSignedIn ? "Signed in with Google" : "Continue with Google"}
                </span>
            </button>

            {isSignedIn ? (
                <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className={`${btnClass} w-full text-red-300`}
                >
                    Sign out
                </button>
            ) : null}
        </div>
    )
}
