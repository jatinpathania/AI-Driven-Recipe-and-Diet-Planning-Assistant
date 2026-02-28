"use client"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Eye, EyeOff, X, Mail, Lock, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { loginUser, signupUser, saveUserData } from "@/utils/api"

const INPUT_BASE =
  "w-full h-14 rounded-xl text-[15px] text-white placeholder:text-white/30 bg-white/[0.03] outline-none transition-all duration-300 border border-white/10 focus:border-white/30 focus:bg-white/[0.08] focus:ring-4 focus:ring-white/5 hover:bg-white/[0.05]"

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

  // Redirect if already logged in
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (status === "authenticated" || token) {
      router.push("/kitchen")
    }
  }, [status, router])

  useEffect(() => {
    if (pathname === "/login") setTab("signin")
    if (pathname === "/signup") setTab("signup")
  }, [pathname])

  const switchTab = (newTab) => {
    setTab(newTab)
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
      if (res?.success) {
        saveUserData(res.data)
        router.push("/kitchen")
      } else {
        setError(res?.message || "Signup failed")
      }
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, #1a4d2e 0%, #0d2715 45%, #051108 100%)",
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[420px] h-[420px] rounded-full blur-[120px] opacity-25 bg-green-500/20" />
        <div className="absolute bottom-[-10%] right-[20%] w-[420px] h-[420px] rounded-full blur-[120px] opacity-20 bg-emerald-500/20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[560px]"
      >
        <div
          className="rounded-[32px] border border-white/[0.08] bg-black/50 backdrop-blur-3xl overflow-hidden shadow-2xl"
          style={{ boxShadow: "0 40px 80px -20px rgba(0, 0, 0, 0.55)" }}
        >
          <div className="px-5 md:px-8 pt-5 md:pt-6 pb-1">
            <Link href="/" className="inline-flex items-center gap-2 sm:gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="relative"
              >
                <img src="/icon.png" alt="Flavour AI" className="w-8 h-8 sm:w-9 sm:h-9" />
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-3 h-3 text-green-700" />
                </motion.div>
              </motion.div>

              <div className="flex items-center">
                <span className="text-lg sm:text-xl font-bold text-green-100">Flavour</span>
                <span className="text-lg sm:text-xl font-bold text-green-400">.</span>
                <span className="text-lg sm:text-xl font-bold text-green-400">AI</span>
              </div>
            </Link>
          </div>

          <div className="px-5 md:px-8 pt-5 md:pt-7 pb-4 flex items-center justify-between gap-3">
            <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => switchTab("signup")}
                className={`px-4 md:px-6 h-9 rounded-xl text-sm font-medium transition-all ${
                  tab === "signup" ? "bg-white/10 text-white" : "text-white/45 hover:text-white/75"
                }`}
              >
                Sign up
              </button>
              <button
                type="button"
                onClick={() => switchTab("signin")}
                className={`px-4 md:px-6 h-9 rounded-xl text-sm font-medium transition-all ${
                  tab === "signin" ? "bg-white/10 text-white" : "text-white/45 hover:text-white/75"
                }`}
              >
                Sign in
              </button>
            </div>

            <Link
              href="/"
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/40" />
            </Link>
          </div>

          <div className="px-5 md:px-8 pb-8 md:pb-10">
            <AnimatePresence mode="wait">
              {tab === "signup" ? (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-[36px] leading-tight font-bold text-white mt-3 mb-7">Create an account</h2>

                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Username"
                        value={signUpForm.username}
                        onChange={(e) => setSignUpForm({ ...signUpForm, username: e.target.value })}
                        className={`${INPUT_BASE} px-5`}
                        style={{ minHeight: 56 }}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Full name"
                        value={signUpForm.fullName}
                        onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value })}
                        className={`${INPUT_BASE} px-5`}
                        style={{ minHeight: 56 }}
                        required
                      />
                    </div>

                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 w-4 h-4 text-white/25" />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={signUpForm.email}
                        onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                        className={`${INPUT_BASE} pl-12 pr-5`}
                        style={{ minHeight: 56 }}
                        required
                      />
                    </div>

                    <div className="relative flex items-center">
                      <Lock className="absolute left-4 w-4 h-4 text-white/25" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password (min 6 characters)"
                        value={signUpForm.password}
                        onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                        className={`${INPUT_BASE} pl-12 pr-12`}
                        style={{ minHeight: 56 }}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {error && <ErrorDisplay error={error} />}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 bg-white text-black font-bold rounded-xl mt-4 hover:bg-neutral-200 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? "Creating account..." : "Create an account"}
                    </button>
                  </form>

                  <div className="my-8"><Divider /></div>
                  <SocialButtons />

                  <p className="text-center text-white/25 text-[12px] mt-8">
                    By creating an account, you agree to our Terms & Service
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-[36px] leading-tight font-bold text-white mt-3 mb-7">Welcome back</h2>

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 w-4 h-4 text-white/25" />
                      <input
                        type="text"
                        placeholder="Email or username"
                        value={signInForm.email}
                        onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                        className={`${INPUT_BASE} pl-12 pr-5`}
                        style={{ minHeight: 56 }}
                        required
                      />
                    </div>

                    <div className="relative flex items-center">
                      <Lock className="absolute left-4 w-4 h-4 text-white/25" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={signInForm.password}
                        onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                        className={`${INPUT_BASE} pl-12 pr-12`}
                        style={{ minHeight: 56 }}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {error && <ErrorDisplay error={error} />}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 bg-white text-black font-bold rounded-xl mt-4 hover:bg-neutral-200 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? "Signing in..." : "Sign in"}
                    </button>
                  </form>

                  <div className="my-8"><Divider /></div>
                  <SocialButtons />

                  <p className="text-center text-white/25 text-[12px] mt-8">
                    By signing in, you agree to our Terms & Service
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function ErrorDisplay({ error }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
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
    "h-14 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center hover:bg-white/[0.05] transition-all"

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
