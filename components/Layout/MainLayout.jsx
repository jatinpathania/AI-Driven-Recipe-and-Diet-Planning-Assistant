"use client"

import React from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import { GuestUserProvider } from '@/context/GuestUserContext';

const MainLayout = ({ children }) => {
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
