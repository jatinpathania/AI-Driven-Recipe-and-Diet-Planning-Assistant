"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const KitchenThemeContext = createContext();

export const useKitchenTheme = () => {
    const context = useContext(KitchenThemeContext);
    if (!context) {
        throw new Error('useKitchenTheme must be used within KitchenThemeProvider');
    }
    return context;
};

export const KitchenThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState('dark');
    const pathname = usePathname();

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const defaultApplied = localStorage.getItem('kitchen-theme-default-dark-v1');
                if (!defaultApplied) {
                    localStorage.setItem('kitchen-theme', 'dark');
                    localStorage.setItem('kitchen-theme-default-dark-v1', '1');
                    setThemeState('dark');
                    return;
                }

                const savedTheme = localStorage.getItem('kitchen-theme');
                if (savedTheme === 'light') {
                    setThemeState('light');
                } else {
                    setThemeState('dark');
                }
            }
        } catch (e) {}
    }, []);
    useEffect(() => {
        try {
            const isHomePage = pathname === '/';
            if (theme === 'dark' && !isHomePage) {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
            } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
            }
        } catch (e) {}

        return () => {
            try {
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
            } catch (e) {}
        };
    }, [theme, pathname]);

    const setTheme = (value) => {
        setThemeState(value);
        try {
            localStorage.setItem('kitchen-theme', value);
            localStorage.setItem('kitchen-theme-selected', '1');
        } catch (e) {}
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <KitchenThemeContext.Provider value={{ theme, setTheme, toggleTheme, mounted: true }}>
            <div className={theme === 'dark' ? 'dark' : ''}>{children}</div>
        </KitchenThemeContext.Provider>
    );
};
