"use client"

import React from 'react'
import { MotionConfig } from 'framer-motion'
import { PremiumLayoutProvider, usePremiumLayout } from '@/context/PremiumLayoutContext'
import SidebarContent from '@/components/Sidebar/SidebarContent'

/**
 * Kitchen shell: sidebar + content. The theme tokens and card styles that used
 * to be injected here as a runtime <style> tag (with a render-blocking font
 * @import) now live in app/kitchen/kitchen.css, and the font comes from
 * next/font in the root layout.
 */
const PremiumLayoutContent = ({ children }) => {
    const { mobileLeftOpen, setMobileLeftOpen } = usePremiumLayout()

    return (
        <div className="kitchen-shell relative flex h-dvh overflow-hidden">
            <div className="kitchen-ambient" aria-hidden="true" />

            <SidebarContent variant="premium" />

            {mobileLeftOpen && (
                <div onClick={() => setMobileLeftOpen(false)} className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" />
            )}

            <main className="relative flex h-full min-w-0 flex-1">{children}</main>
        </div>
    )
}

const PremiumLayout = ({ children }) => (
    <MotionConfig reducedMotion="user">
        <PremiumLayoutProvider>
            <PremiumLayoutContent>{children}</PremiumLayoutContent>
        </PremiumLayoutProvider>
    </MotionConfig>
)

export default PremiumLayout
