"use client"

import React from 'react'
import { Menu } from 'lucide-react'
import { usePremiumLayout } from '@/context/PremiumLayoutContext'

/**
 * Opens the kitchen sidebar on small screens.
 *
 * The sidebar is translated off-canvas below md, so without this every
 * /kitchen/* sub-page was a dead end on a phone — there was no control to
 * bring it back and the only way out was the browser's back button.
 */
export default function MobileMenuButton({ className = '' }) {
    const { setMobileLeftOpen } = usePremiumLayout()

    return (
        <button
            type="button"
            onClick={() => setMobileLeftOpen(true)}
            aria-label="Open navigation menu"
            className={`md:hidden shrink-0 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-95 transition-all ${className}`}
        >
            <Menu className="w-5 h-5 pointer-events-none" />
        </button>
    )
}
