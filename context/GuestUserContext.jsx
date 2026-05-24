"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from 'next-auth/react';

const GuestUserContext = createContext();

export const useGuestUser = () => {
    const context = useContext(GuestUserContext);
    if (!context) {
        throw new Error('useGuestUser must be used within GuestUserProvider');
    }
    return context;
};

export const GuestUserProvider = ({ children }) => {
    const { data: session, status } = useSession();
    const [guestId, setGuestId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isGuest, setIsGuest] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (status === "loading") return;

        const storedUserId = localStorage.getItem('userId');
        const storedToken = localStorage.getItem('token');
        const storedAuthType = localStorage.getItem('authType');
        
        const nextAuthAuthenticated = status === "authenticated";
        const emailAuthenticated = !!(storedUserId && storedToken);

        if (nextAuthAuthenticated || emailAuthenticated) {
            const currentUserId = session?.user?.id || session?.user?.email || storedUserId;
            setUserId(currentUserId);
            setIsGuest(false);
            setGuestId(null);
            localStorage.setItem('authType', 'user');
            if (currentUserId && !storedUserId) {
                localStorage.setItem('userId', currentUserId);
            }
        } else {
            if (storedAuthType === 'user') {
                // The user was logged in previously, so their session has expired!
                localStorage.removeItem('userId');
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                localStorage.removeItem('userEmail');
                localStorage.setItem('authType', 'guest');
                
                // Let's redirect to login if they are in the kitchen area
                const isKitchen = typeof window !== 'undefined' && window.location.pathname.startsWith('/kitchen');
                if (isKitchen) {
                    window.location.href = '/login';
                    return;
                }
            }

            // Normal guest user
            let storedGuestId = localStorage.getItem('guestId');
            if (!storedGuestId) {
                storedGuestId = uuidv4();
                localStorage.setItem('guestId', storedGuestId);
            }
            setGuestId(storedGuestId);
            setUserId(null);
            setIsGuest(true);
            localStorage.setItem('authType', 'guest');
        }

        setMounted(true);
    }, [session, status]);

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
