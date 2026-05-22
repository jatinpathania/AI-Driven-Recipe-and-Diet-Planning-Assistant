"use client"

import React, { createContext, useContext, useState } from 'react';

const PremiumLayoutContext = createContext();

export const usePremiumLayout = () => {
    const context = useContext(PremiumLayoutContext);
    if (!context) {
        throw new Error('usePremiumLayout must be used within PremiumLayoutProvider');
    }
    return context;
};

export const PremiumLayoutProvider = ({ children }) => {
    const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
    const [mobileRightOpen, setMobileRightOpen] = useState(false);

    return (
        <PremiumLayoutContext.Provider value={{ mobileLeftOpen, setMobileLeftOpen, mobileRightOpen, setMobileRightOpen }}>
            {children}
        </PremiumLayoutContext.Provider>
    );
};
