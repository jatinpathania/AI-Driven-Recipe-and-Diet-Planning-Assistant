"use client"

import React from 'react'
import { PremiumLayoutProvider, usePremiumLayout } from '@/context/PremiumLayoutContext'
import SidebarContent from '@/components/Sidebar/SidebarContent'
import { GuestUserProvider } from '@/context/GuestUserContext'

const PremiumLayoutContent = ({ children }) => {
    const { mobileLeftOpen, setMobileLeftOpen } = usePremiumLayout()

    return (
        <div className="flex h-screen overflow-hidden relative select-none" style={{ backgroundColor: 'var(--white)', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                :root {
                    --bg-base: #ffffff; --bg-panel: #f8faf9; --bg-card: #ffffff;
                    --bg-hover: #ecf7f1; --text-main: #0f172a; --text-muted: #64748b;
                    --brand: #10B981; --brand-hover: #34D399;
                    --brand-light: rgba(16, 185, 129, 0.1);
                    --border: #e2e8f0; --border-light: #cbd5e1;
                }
                .dark {
                    --bg-base: #070B09; --bg-panel: #0B120E; --bg-card: #111A14;
                    --bg-hover: #1A271E; --text-main: #F3F4F6; --text-muted: #829A8B;
                    --brand: #10B981; --brand-hover: #34D399;
                    --brand-light: rgba(16, 185, 129, 0.1);
                    --border: #1A271E; --border-light: #24362A;
                }
                
                /* Map Tailwind's hardcoded text color classes to dynamic theme variables */
                [class*="text-gray-50"] { color: var(--text-main) !important; }
                [class*="text-gray-100"] { color: var(--text-main) !important; }
                [class*="text-gray-200"] { color: var(--text-main) !important; }
                [class*="text-gray-300"] { color: var(--text-muted) !important; }
                [class*="text-gray-400"] { color: var(--text-muted) !important; }

                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .section-label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
                .flex-between { display: flex; justify-content: space-between; align-items: center; }
                .tag { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 4px; }
                .tag-brand { background: var(--brand-light); color: var(--brand); }
                .tag-warning { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
                .tag-danger { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
                
                /* Premium Card System */
                .premium-card {
                    background-color: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 1rem;
                    box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .premium-card-interactive:hover {
                    border-color: var(--brand);
                    background-color: var(--bg-hover);
                    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 0 15px rgba(16, 185, 129, 0.08);
                    transform: translateY(-2px);
                }
                
                /* Smooth interactive transitions */
                .smooth-transition {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                /* Custom elegant scrollbar */
                .elegant-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .elegant-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .elegant-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--border-light);
                    border-radius: 9999px;
                }
                .elegant-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--brand);
                }
            ` }} />
            
            <SidebarContent variant="premium" />
            
            {/* Mobile backdrop */}
            {mobileLeftOpen && (
                <div onClick={() => setMobileLeftOpen(false)} className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30" />
            )}

            <main className="flex-1 flex relative h-full min-w-0" style={{ backgroundColor: 'var(--bg-base)' }}>
                {children}
            </main>
        </div>
    )
}

const PremiumLayout = ({ children }) => {
    return (
        <GuestUserProvider>
            <PremiumLayoutProvider>
                <PremiumLayoutContent>
                    {children}
                </PremiumLayoutContent>
            </PremiumLayoutProvider>
        </GuestUserProvider>
    )
}

export default PremiumLayout
