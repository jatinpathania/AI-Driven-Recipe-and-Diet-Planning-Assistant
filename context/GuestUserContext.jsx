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

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        const storedToken = localStorage.getItem('token');

        if (storedUserId && storedToken) {
            setUserId(storedUserId);
            setIsGuest(false);
        } else {
            let storedGuestId = localStorage.getItem('guestId');
            
            if (!storedGuestId) {
                storedGuestId = uuidv4();
                localStorage.setItem('guestId', storedGuestId);
            }
            
            setGuestId(storedGuestId);
            setIsGuest(true);
        }
    }, []);

    const login = (newUserId) => {
        setUserId(newUserId);
        setIsGuest(false);
        localStorage.setItem('userId', newUserId);
    };

    const logout = () => {
        setUserId(null);
        setIsGuest(true);
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userEmail');
        
        const newGuestId = uuidv4();
        setGuestId(newGuestId);
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
