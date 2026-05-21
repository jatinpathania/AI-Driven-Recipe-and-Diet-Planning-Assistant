"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const GuestUserContext = createContext();

export const useGuestUser = () => {
    const context = useContext(GuestUserContext);
    if (!context) {
        throw new Error('useGuestUser must be used within GuestUserProvider');
    }
    return context;
};

export const GuestUserProvider = ({ children }) => {
    const [guestId, setGuestId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isGuest, setIsGuest] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        const storedToken = localStorage.getItem('token');
        
        if (storedUserId && storedToken) {
            setUserId(storedUserId);
            setIsGuest(false);
            setGuestId(null);
        } else {
            let storedGuestId = localStorage.getItem('guestId');
            if (!storedGuestId) {
                storedGuestId = uuidv4();
                localStorage.setItem('guestId', storedGuestId);
            }
            setGuestId(storedGuestId);
            setUserId(null);
            setIsGuest(true);
        }

        localStorage.setItem('authType', storedUserId && storedToken ? 'user' : 'guest');
        setMounted(true);
    }, []);

    const login = (newUserId) => {
        setUserId(newUserId);
        setIsGuest(false);
        setGuestId(null);
        localStorage.setItem('userId', newUserId);
        localStorage.setItem('authType', 'user');
    };

    const logout = () => {
        const newGuestId = uuidv4();
        setUserId(null);
        setIsGuest(true);
        setGuestId(newGuestId);
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userEmail');
        localStorage.setItem('authType', 'guest');
        localStorage.setItem('guestId', newGuestId);
    };

    const getUserIdentifier = () => {
        return isGuest ? guestId : userId;
    };

    const value = {
        guestId,
        userId,
        isGuest,
        login,
        logout,
        getUserIdentifier,
        mounted
    };

    return (
        <GuestUserContext.Provider value={value}>
            {children}
        </GuestUserContext.Provider>
    );
};
