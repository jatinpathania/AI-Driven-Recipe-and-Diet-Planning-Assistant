"use client"

import { KitchenThemeProvider } from '@/context/KitchenThemeContext';
import MainLayout from '@/components/Layout/MainLayout';

export default function KitchenLayout({ children }) {
    return (
        <KitchenThemeProvider>
            <MainLayout>{children}</MainLayout>
        </KitchenThemeProvider>
    );
}
