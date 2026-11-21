"use client"

import './kitchen.css'
import { KitchenThemeProvider } from '@/context/KitchenThemeContext'
import { KitchenDataProvider } from '@/context/KitchenDataContext'
import { TimersProvider } from '@/context/TimersContext'
import { ToastProvider } from '@/components/ui/Toaster'
import CommandPalette from '@/components/ui/CommandPalette'
import PremiumLayout from '@/components/Layout/PremiumLayout'
import TimerDock from '@/components/ui/TimerDock'

export default function KitchenLayout({ children }) {
    return (
        <KitchenThemeProvider>
            <KitchenDataProvider>
                <ToastProvider>
                    <TimersProvider>
                        <PremiumLayout>{children}</PremiumLayout>
                        {/* Overlays live outside the shell so they sit above everything. */}
                        <TimerDock />
                        <CommandPalette />
                    </TimersProvider>
                </ToastProvider>
            </KitchenDataProvider>
        </KitchenThemeProvider>
    )
}
