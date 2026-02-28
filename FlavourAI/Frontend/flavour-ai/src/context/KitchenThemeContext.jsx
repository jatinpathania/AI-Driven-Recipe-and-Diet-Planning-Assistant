"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

const KitchenThemeContext = createContext();

export const useKitchenTheme = () => {
    const context = useContext(KitchenThemeContext);
    if (!context) {
        throw new Error('useKitchenTheme must be used within KitchenThemeProvider');
    }
    return context;
};

export const KitchenThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('kitchen-theme') || 'light';
        setTheme(stored);
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('kitchen-theme', next);
    };

    const setThemeValue = (value) => {
        setTheme(value);
        localStorage.setItem('kitchen-theme', value);
    };

    return (
        <KitchenThemeContext.Provider value={{ theme, setTheme: setThemeValue, toggleTheme, mounted }}>
            <div className={theme === 'dark' ? 'dark' : ''}>
                {children}
            </div>
        </KitchenThemeContext.Provider>
    );
};
