"use client"

import React, { createContext, useContext, useState } from 'react';

const KitchenThemeContext = createContext();

export const useKitchenTheme = () => {
    const context = useContext(KitchenThemeContext);
    if (!context) {
        throw new Error('useKitchenTheme must be used within KitchenThemeProvider');
    }
    return context;
};

export const KitchenThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        if (typeof window === 'undefined') return 'light';
        return localStorage.getItem('kitchen-theme') || 'light';
    });

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setThemeState(next);
        localStorage.setItem('kitchen-theme', next);
    };

    const setTheme = (value) => {
        setThemeState(value);
        localStorage.setItem('kitchen-theme', value);
    };

    return (
        <KitchenThemeContext.Provider value={{ theme, setTheme, toggleTheme, mounted: true }}>
            <div className={theme === 'dark' ? 'dark' : ''}>
                {children}
            </div>
        </KitchenThemeContext.Provider>
    );
};
