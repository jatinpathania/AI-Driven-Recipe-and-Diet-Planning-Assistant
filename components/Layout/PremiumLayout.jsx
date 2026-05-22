"use client"

import React from 'react'
import { PremiumLayoutProvider, usePremiumLayout } from '@/context/PremiumLayoutContext'
import PremiumSidebar from '@/components/Sidebar/PremiumSidebar'
import { GuestUserProvider } from '@/context/GuestUserContext'

const PremiumLayoutContent = ({ children }) => {
    const { mobileLeftOpen, setMobileLeftOpen } = usePremiumLayout()

    return (
        <div className="flex h-screen overflow-hidden relative select-none" style={{ backgroundColor: '#070B09', color: '#F3F4F6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                :root {
                    --bg-base: #070B09; --bg-panel: #0B120E; --bg-card: #111A14;
                    --bg-hover: #1A271E; --text-main: #F3F4F6; --text-muted: #829A8B;
                    --brand: #10B981; --brand-hover: #34D399;
                    --brand-light: rgba(16, 185, 129, 0.1);
                    --border: #1A271E; --border-light: #24362A;
                }
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
                    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.4);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .premium-card-interactive:hover {
                    border-color: var(--brand);
                    background-color: #152019;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(16, 185, 129, 0.08);
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
            
            <PremiumSidebar />
            
            {/* Mobile backdrop */}
            {mobileLeftOpen && (
                <div onClick={() => setMobileLeftOpen(false)} className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30" />
            )}

            <main className="flex-1 flex relative h-full min-w-0" style={{ backgroundColor: '#070B09' }}>
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
