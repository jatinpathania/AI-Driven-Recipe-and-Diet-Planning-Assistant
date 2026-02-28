"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { clearUserData, getUserData, isAuthenticated } from "@/utils/api"

export default function Header({ overlay = false }) {
  const router = useRouter()
  const dropdownRef = useRef(null)

  const [logoWordIndex, setLogoWordIndex] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState("User")
  const [menuOpen, setMenuOpen] = useState(false)

  const logoWords = ["AI", "Chef", "Guide", "Expert"]

  useEffect(() => {
    const interval = setInterval(() => {
      setLogoWordIndex((prev) => (prev + 1) % logoWords.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [logoWords.length])

  useEffect(() => {
    const syncAuth = () => {
      const authenticated = isAuthenticated()
      setLoggedIn(authenticated)
      const user = getUserData()
      setUsername(user?.username || "User")
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    syncAuth()
    handleScroll()

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("storage", syncAuth)
    window.addEventListener("focus", syncAuth)
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("storage", syncAuth)
      window.removeEventListener("focus", syncAuth)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    clearUserData()
    setMenuOpen(false)
    setLoggedIn(false)
    router.push("/")
  }

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`${overlay ? "sticky top-0 z-50 -mb-[72px]" : "sticky top-0 z-50"} transition-all duration-300 ${
        isScrolled
          ? "bg-white/12 backdrop-blur-xl border-b border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="relative"
          >
            <img src="/icon.png" alt="Flavour AI" className="w-8 h-8 sm:w-10 sm:h-10" />
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-700" />
            </motion.div>
          </motion.div>

          <div className="flex items-center">
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">Flavour</span>
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">.</span>
            <div className="relative min-w-[56px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={logoWordIndex}
                  initial={{ opacity: 0, y: 14, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -14, scale: 0.9 }}
                  transition={{ duration: 0.35 }}
                  className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 inline-block"
                >
                  {logoWords[logoWordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </Link>

        {!loggedIn ? (
          <Link
            href="/signup"
            className="h-10 px-5 rounded-full bg-green-800 text-white text-sm font-semibold flex items-center hover:bg-green-900 transition-colors"
          >
            Get Started
          </Link>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="h-10 px-4 rounded-full border border-white/20 bg-white/10 text-green-900 text-sm font-semibold flex items-center gap-2 hover:bg-white/20 transition-colors"
            >
              <span>{username}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/20 bg-white/85 backdrop-blur-xl shadow-xl p-2">
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-green-900 hover:bg-green-50">
                  Profile
                </Link>
                <Link href="/favourites" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-green-900 hover:bg-green-50">
                  Favourites
                </Link>
                <Link href="/settings" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-green-900 hover:bg-green-50">
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.header>
  )
}
