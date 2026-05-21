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
    const [guestId, setGuestId] = useState(() => {
        if (typeof window === 'undefined') return null;
        const storedUserId = localStorage.getItem('userId');
        const storedToken = localStorage.getItem('token');
        
        if (storedUserId && storedToken) {
            return null;
        } else {
            let storedGuestId = localStorage.getItem('guestId');
            if (!storedGuestId) {
                storedGuestId = uuidv4();
                localStorage.setItem('guestId', storedGuestId);
            }
            return storedGuestId;
        }
    });

    const [userId, setUserId] = useState(() => {
        if (typeof window === 'undefined') return null;
        const storedUserId = localStorage.getItem('userId');
        const storedToken = localStorage.getItem('token');
        return (storedUserId && storedToken) ? storedUserId : null;
    });

    const [isGuest, setIsGuest] = useState(() => {
        if (typeof window === 'undefined') return true;
        const storedUserId = localStorage.getItem('userId');
        const storedToken = localStorage.getItem('token');
        return !(storedUserId && storedToken);
    });

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        const storedToken = localStorage.getItem('token');
        
        if (storedUserId && storedToken) {
            localStorage.setItem('authType', 'user');
        } else {
            localStorage.setItem('authType', 'guest');
        }
    }, []);

    const login = (newUserId) => {
        setUserId(newUserId);
        setIsGuest(false);
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
        getUserIdentifier
    };

    return (
        <GuestUserContext.Provider value={value}>
            {children}
        </GuestUserContext.Provider>
    );
};
