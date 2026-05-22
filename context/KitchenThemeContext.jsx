"use client"

import React, { createContext, useContext, useSyncExternalStore } from 'react';

const KitchenThemeContext = createContext();

let themeValue = 'light';

const getSnapshot = () => {
    return themeValue;
};

const getServerSnapshot = () => {
    return 'light';
};

const subscribe = (callback) => {
    // Initialize theme from localStorage when first subscribed (on mount)
    themeValue = localStorage.getItem('kitchen-theme') || 'light';
    
    const handleStorageChange = () => {
        themeValue = localStorage.getItem('kitchen-theme') || 'light';
        callback();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
};

export const useKitchenTheme = () => {
    const context = useContext(KitchenThemeContext);
    if (!context) {
        throw new Error('useKitchenTheme must be used within KitchenThemeProvider');
    }
    return context;
};

export const KitchenThemeProvider = ({ children }) => {
    const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const setTheme = (value) => {
        themeValue = value;
        localStorage.setItem('kitchen-theme', value);
        window.dispatchEvent(new Event('storage'));
    };

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
    };

    return (
        <KitchenThemeContext.Provider value={{ theme, setTheme, toggleTheme, mounted: true }}>
            <div className={theme === 'dark' ? 'dark' : ''}>
                {children}
            </div>
        </KitchenThemeContext.Provider>
    );
};
