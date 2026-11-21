import { KEYS, readJSON } from '@/lib/store/local'

const API_BASE_URL = typeof window !== 'undefined'
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api');

const AUTH_KEYS = ['token', 'userId', 'username', 'userEmail'];

const triggerAuthChanged = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('flavour:auth-changed'));
};

export const clearAuthStorage = () => {
    if (typeof window === 'undefined') return;
    try {
        AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
        // ignore storage errors
    }
    triggerAuthChanged();
};

const isUserAuth = () => typeof window !== 'undefined' && localStorage.getItem('authType') === 'user';

const triggerSessionExpired = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('flavour:session-expired'));
};

// Google sign-in lives in the NextAuth cookie, not in localStorage
const hasActiveNextAuthSession = async () => {
    try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!res.ok) return false;
        const data = await res.json();
        return !!data?.user;
    } catch {
        return false;
    }
};

let pendingExpiryCheck = null;

// Called when the server rejects us or the local token runs out. Only shows the
// "session expired" popup if the user really has no valid session left.
const handleAuthFailure = (rejectedToken) => {
    if (typeof window === 'undefined' || !isUserAuth()) return;
    if (pendingExpiryCheck) return pendingExpiryCheck;

    pendingExpiryCheck = (async () => {
        if (await hasActiveNextAuthSession()) {
            // Still signed in with Google; just drop the stale email token so it isn't reused
            if (rejectedToken && localStorage.getItem('token') === rejectedToken) {
                localStorage.removeItem('token');
            }
            return;
        }
        // A new login may have happened while we were checking
        if (rejectedToken && localStorage.getItem('token') !== rejectedToken) return;
        triggerSessionExpired();
    })().finally(() => {
        pendingExpiryCheck = null;
    });

    return pendingExpiryCheck;
};

/**
 * fetch wrapper. Errors carry `status` and the parsed body as `data`, so
 * callers can branch on structured codes (e.g. GUEST_LIMIT) instead of
 * matching message strings.
 */
const apiCall = async (endpoint, options = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    } catch (error) {
        console.error(`API call error [${endpoint}]:`, error);
        throw new Error('Can’t reach the server. Check your connection and try again.');
    }

    const isJson = (response.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await response.json().catch(() => null) : null;
    const isAuthLoginOrSignup = endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/signup');

    if (response.status === 401 && !isAuthLoginOrSignup) handleAuthFailure(token);

    if (!response.ok) {
        const error = new Error(data?.message || (response.status === 401 ? 'Unauthorized' : `Request failed (${response.status})`));
        error.status = response.status;
        error.data = data;
        if (response.status >= 500) console.error(`API call error [${endpoint}]:`, error.message);
        throw error;
    }

    return data ?? { success: true };
};

/* ── Auth ─────────────────────────────────────────────────── */

export const signupUser = (userData) =>
    apiCall('/auth/signup', { method: 'POST', body: JSON.stringify(userData) });

export const loginUser = (credentials) =>
    apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrUsername: credentials.email, password: credentials.password }),
    });

export const getCurrentUser = () => apiCall('/auth/me', { method: 'GET' });

export const updateUserProfile = (profileData) =>
    apiCall('/users/profile', { method: 'PUT', body: JSON.stringify(profileData) });

export const saveUserData = (data) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data._id);
    localStorage.setItem('username', data.username);
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('authType', 'user');
    triggerAuthChanged();
};

export const getUserData = () => {
    if (typeof window === 'undefined') return null;
    return {
        token: localStorage.getItem('token'),
        userId: localStorage.getItem('userId'),
        username: localStorage.getItem('username'),
        email: localStorage.getItem('userEmail'),
    };
};

export const clearUserData = () => {
    if (typeof window === 'undefined') return;
    AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('authType', 'guest');
    triggerAuthChanged();
};

export const isAuthenticated = () => typeof window !== 'undefined' && !!localStorage.getItem('token');

export const getAuthType = () => (typeof window === 'undefined' ? null : localStorage.getItem('authType'));

/* ── Recipes (server copy, signed-in users) ───────────────── */

export const createRecipe = (recipeData) =>
    apiCall('/recipes', { method: 'POST', body: JSON.stringify(recipeData) });

export const getUserRecipes = () => apiCall('/recipes', { method: 'GET' });

export const getRecipeById = (recipeId) => apiCall(`/recipes/${recipeId}`, { method: 'GET' });

export const deleteRecipe = (recipeId) => apiCall(`/recipes/${recipeId}`, { method: 'DELETE' });

/* ── AI ───────────────────────────────────────────────────── */

// Diet, allergies, skill and units from Settings ride along with every AI
// call, so a vegan never gets offered carbonara whichever feature they use.
const preferences = () => {
    const s = readJSON(KEYS.settings, null);
    if (!s) return undefined;
    return { diet: s.diet, avoid: s.avoid, skill: s.skill, units: s.units, maxCookTime: s.maxCookTime };
};

/**
 * @param {string} message
 * @param {Array}  history  [{ role, content }]
 * @param {{ mode?: 'chat'|'estimate'|'plan', portion?: string }} options
 */
export const sendChatMessage = (message, history = [], options = {}) =>
    apiCall('/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history, mode: options.mode || 'chat', portion: options.portion, preferences: preferences() }),
    });

export const generateRecipe = (ingredients) =>
    apiCall('/chat/generate-recipe', {
        method: 'POST',
        body: JSON.stringify({ ingredients, preferences: preferences() }),
    });

/* ── Token expiry ─────────────────────────────────────────── */

// Decode JWT payload and return milliseconds until expiry (or null)
export const getTokenExpiryMs = (token) => {
    try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length < 2) return null;
        let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4 !== 0) b64 += '=';
        const obj = JSON.parse(atob(b64));
        return obj.exp ? obj.exp * 1000 - Date.now() : null;
    } catch {
        return null;
    }
};

// Schedule automatic logout when token expires. Stores timer id on window to allow clearing.
export const scheduleAutoLogout = (opts = { redirectTo: '/login' }) => {
    if (typeof window === 'undefined') return;
    try {
        if (window.__flavour_logout_timer) {
            clearTimeout(window.__flavour_logout_timer);
            window.__flavour_logout_timer = null;
        }

        const token = localStorage.getItem('token');
        if (!token) return;
        const ms = getTokenExpiryMs(token);
        if (ms === null) return;

        if (ms <= 0) {
            handleAuthFailure(token);
            return;
        }

        // Re-check on fire since the token may have been replaced, and cap it
        // because setTimeout overflows past ~24.8 days.
        const timeout = Math.min(Math.max(1000, ms + 500), 2147483647);
        window.__flavour_logout_timer = setTimeout(() => {
            window.__flavour_logout_timer = null;
            scheduleAutoLogout(opts);
        }, timeout);
    } catch {
        // ignore
    }
};
