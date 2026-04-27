"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

const AnimatedLogo = () => {
    const [logoWordIndex, setLogoWordIndex] = useState(0)
    const logoWords = ['AI', 'Cook', 'Plan', 'Track']

    useEffect(() => {
        const interval = setInterval(() => {
            setLogoWordIndex(prev => (prev + 1) % logoWords.length)
        }, 2500)
        return () => clearInterval(interval)
    }, [])

    return (
        <Link href="/" className="flex items-center gap-2.5 group w-fit">
            {/* Icon with smooth rotation */}
            <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-8 h-8 flex items-center justify-center"
            >
                {/* Animated glow */}
                <motion.div
                    animate={{
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-teal-500/30 rounded-full blur-lg"
                />
                {/* Icon */}
                <Image 
                    src="/icon.png" 
                    alt="Flavour" 
                    width={24} 
                    height={24} 
                    className="relative z-10"
                />
            </motion.div>

            {/* Text section */}
            <div className="leading-none">
                {/* Main title */}
                <motion.div
                    className="flex items-baseline gap-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Flavour</span>
                    <motion.span 
                        className="text-[15px] font-bold text-emerald-500"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        .
                    </motion.span>
                </motion.div>

                {/* Rotating words */}
                <div className="h-4 overflow-hidden relative">
                    <motion.div
                        className="flex flex-col"
                        animate={{ y: -logoWordIndex * 16 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                    >
                        {logoWords.map((w, i) => (
                            <motion.p
                                key={i}
                                className="text-[10px] font-medium text-emerald-500/70 h-4 leading-4"
                                initial={{ opacity: 0.5 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0.5 }}
                            >
                                {w}
                            </motion.p>
                        ))}
                    </motion.div>
                </div>
            </div>
        </Link>
    )
}

export default AnimatedLogo
