"use client"

import React from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import { GuestUserProvider } from '@/context/GuestUserContext';
import { usePathname } from 'next/navigation';
import PremiumLayout from '@/components/Layout/PremiumLayout';

const MainLayout = ({ children }) => {
    const pathname = usePathname();
    const isKitchen = pathname && pathname.startsWith('/kitchen');

    if (isKitchen) {
        return <PremiumLayout>{children}</PremiumLayout>;
    }

    return (
        <GuestUserProvider>
            <div className="flex min-h-screen bg-[var(--cream)]">
                <Sidebar />
                <main className="flex-1 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </GuestUserProvider>
    );
};

export default MainLayout;
