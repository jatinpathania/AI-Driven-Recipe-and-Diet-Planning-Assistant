"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { UserCircle2, Menu, X, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ProfileMenuButton from "../ui/ProfileMenuButton"

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentLogoWord, setCurrentLogoWord] = useState(0)
  
  const logoWords = ['AI', 'Chef', 'Guide', 'Expert']
  
  // Logo word rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogoWord(prev => (prev + 1) % logoWords.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])
  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100/50"
    >
      {/* Animated Logo */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="relative"
          >
            <img
              src="/icon.png"
              alt="Flavour AI"
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
            />
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#1b5e20]" />
            </motion.div>
          </motion.div>
          
          <div className="flex items-center">
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-[#1b5e20]">
              Flavour
            </span>
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">.</span>
            
            {/* Animated rotating word */}
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentLogoWord}
                  initial={{ opacity: 0, y: 20, filter: "blur(8px)", scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                  exit={{ opacity: 0, y: -20, filter: "blur(8px)", scale: 0.8 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 inline-block"
                >
                  {logoWords[currentLogoWord]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </Link>
      </motion.div>

    <ProfileMenuButton/>
      

    </motion.header>
  )
}
