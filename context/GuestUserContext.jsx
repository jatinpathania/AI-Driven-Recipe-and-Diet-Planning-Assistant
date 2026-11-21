"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { uuidv4 } from '@/utils/uuid';
import { useSession } from 'next-auth/react';

const GuestUserContext = createContext();

// 24 hex characters. (An earlier `[a-fd]` dropped the backslash, matched no
// real ObjectId, and left every signed-in user with userId = null.)
const isObjectId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

const AUTH_KEYS = ['userId', 'token', 'username', 'userEmail'];

// The chat transcript is per-person; it must not survive into the next account.
export const CHAT_SESSION_KEY = 'flavour:chat';

// Set just before signOut() so the auth re-sync can tell a deliberate logout
// apart from a session that expired on its own.
export const markSigningOut = () => {
    try {
        sessionStorage.setItem('flavour:signing-out', '1');
        sessionStorage.removeItem(CHAT_SESSION_KEY);
    } catch {
        // the flag is only an optimisation; losing it is harmless
    }
};

export const useGuestUser = () => {
    const context = useContext(GuestUserContext);
    if (!context) {
        throw new Error('useGuestUser must be used within GuestUserProvider');
    }
    return context;
};

const ensureGuestId = () => {
    let id = localStorage.getItem('guestId');
    if (!id) {
        id = uuidv4();
        localStorage.setItem('guestId', id);
    }
    return id;
};

export const GuestUserProvider = ({ children }) => {
    const { data: session, status } = useSession();
    const [guestId, setGuestId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isGuest, setIsGuest] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (status === "loading") return;

        const syncAuthState = () => {
            const storedUserId = localStorage.getItem('userId');
            const storedToken = localStorage.getItem('token');
            const storedAuthType = localStorage.getItem('authType');

            const nextAuthAuthenticated = status === "authenticated";
            const emailAuthenticated = !!(storedUserId && storedToken);

            if (nextAuthAuthenticated || emailAuthenticated) {
                // Must be a Mongo ObjectId — the APIs query on it directly, so an
                // email slipping through here turns every request into a CastError.
                const currentUserId = [session?.user?.id, storedUserId].find(isObjectId) || null;
                setUserId(currentUserId);
                setIsGuest(false);
                setGuestId(null);
                localStorage.setItem('authType', 'user');
                if (currentUserId && !storedUserId) {
                    localStorage.setItem('userId', currentUserId);
                }
            } else {
                // A deliberate sign-out already cleared the flag; don't mistake it for an expiry.
                let signingOut = false;
                try {
                    signingOut = sessionStorage.getItem('flavour:signing-out') === '1';
                    if (signingOut) sessionStorage.removeItem('flavour:signing-out');
                } catch {
                    // sessionStorage is unavailable in some private-browsing modes
                }

                if (storedAuthType === 'user' && !signingOut) {
                    // The user was logged in previously, so their session has expired.
                    AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
                    localStorage.setItem('authType', 'guest');

                    if (window.location.pathname.startsWith('/kitchen')) {
                        window.location.href = '/login';
                        return;
                    }
                }

                setGuestId(ensureGuestId());
                setUserId(null);
                setIsGuest(true);
                localStorage.setItem('authType', 'guest');
            }

            setMounted(true);
        };

        syncAuthState();

        // Credentials-based login/logout doesn't touch NextAuth's session/status,
        // so re-sync when utils/api.js reports a local auth change on this tab.
        window.addEventListener('flavour:auth-changed', syncAuthState);
        return () => {
            window.removeEventListener('flavour:auth-changed', syncAuthState);
        };
    }, [session, status]);

    const login = useCallback((newUserId) => {
        if (!isObjectId(newUserId)) return;
        setUserId(newUserId);
        setIsGuest(false);
        setGuestId(null);
        localStorage.setItem('userId', newUserId);
        localStorage.setItem('authType', 'user');
    }, []);

    const logout = useCallback(() => {
        markSigningOut();
        const newGuestId = uuidv4();
        setUserId(null);
        setIsGuest(true);
        setGuestId(newGuestId);
        AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem('authType', 'guest');
        localStorage.setItem('guestId', newGuestId);
    }, []);

    const getUserIdentifier = useCallback(() => (isGuest ? guestId : userId), [isGuest, guestId, userId]);

    const value = useMemo(
        () => ({ guestId, userId, isGuest, login, logout, getUserIdentifier, mounted }),
        [guestId, userId, isGuest, login, logout, getUserIdentifier, mounted]
    );

    return (
        <GuestUserContext.Provider value={value}>
            {children}
        </GuestUserContext.Provider>
    );
};
