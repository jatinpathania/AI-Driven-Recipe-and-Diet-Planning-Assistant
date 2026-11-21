"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

const KitchenThemeContext = createContext();
const THEME_EVENT = 'flavour:theme';

export const useKitchenTheme = () => {
    const context = useContext(KitchenThemeContext);
    if (!context) {
        throw new Error('useKitchenTheme must be used within KitchenThemeProvider');
    }
    return context;
};

// The root layout's inline script applies the dark-by-default migration before
// first paint; this only has to mirror what's stored.
const subscribe = (callback) => {
    window.addEventListener(THEME_EVENT, callback);
    window.addEventListener('storage', callback);
    return () => {
        window.removeEventListener(THEME_EVENT, callback);
        window.removeEventListener('storage', callback);
    };
};

const readTheme = () => {
    try {
        return localStorage.getItem('kitchen-theme') === 'light' ? 'light' : 'dark';
    } catch {
        return 'dark';
    }
};

export const KitchenThemeProvider = ({ children }) => {
    const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark');
    const pathname = usePathname();

    // <html> carries the class too, so portals and the global gate modal match.
    useEffect(() => {
        const root = document.documentElement;
        const dark = theme === 'dark' && pathname !== '/';
        root.classList.toggle('dark', dark);
        root.style.colorScheme = dark ? 'dark' : 'light';

        return () => {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
        };
    }, [theme, pathname]);

    const setTheme = useCallback((value) => {
        try {
            localStorage.setItem('kitchen-theme', value);
            localStorage.setItem('kitchen-theme-selected', '1');
        } catch {
            // storage blocked — the toggle just won't persist
        }
        window.dispatchEvent(new CustomEvent(THEME_EVENT));
    }, []);

    const toggleTheme = useCallback(() => setTheme(readTheme() === 'dark' ? 'light' : 'dark'), [setTheme]);

    const value = useMemo(() => ({ theme, setTheme, toggleTheme, mounted: true }), [theme, setTheme, toggleTheme]);

    return (
        <KitchenThemeContext.Provider value={value}>
            <div className={`kitchen-root${theme === 'dark' ? ' dark' : ''}`}>{children}</div>
        </KitchenThemeContext.Provider>
    );
};
