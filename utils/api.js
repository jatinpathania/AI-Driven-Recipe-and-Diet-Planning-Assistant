const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiCall = async (endpoint, options = {}) =>{
    try{
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if(token){
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        if (!response.ok) {
            let errMsg = `Request failed (${response.status})`;
            if (isJson) {
                try {
                    const errData = await response.json();
                    errMsg = errData.message || errMsg;
                } catch {}
            }
            throw new Error(errMsg);
        }

        if (isJson) {
            return await response.json();
        }

        return { success: true };
    } catch (error) {
        console.error('API call error:', error);
        if (error instanceof TypeError && /fetch/i.test(error.message || '')) {
            throw new Error(`Unable to reach API at ${API_BASE_URL}. Make sure backend is running.`);
        }
        throw error;
    }
};

export const signupUser = async (userData) => {
    return await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
};

export const loginUser = async (credentials) => {
    return await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            emailOrUsername: credentials.email,
            password: credentials.password
        })
    });
};

export const getCurrentUser = async () => {
    return await apiCall('/auth/me', {
        method: 'GET'
    });
};

export const getUserProfile = async (userId) => {
    return await apiCall(`/users/profile/${userId}`, {
        method: 'GET'
    });
};

export const updateUserProfile = async (profileData) =>{
    return await apiCall('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
    });
};

export const uploadProfilePicture = async (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/users/pfp`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    return await response.json();
};

export const createRecipe = async (recipeData) => {
    return await apiCall('/recipes', {
        method: 'POST',
        body: JSON.stringify(recipeData)
    });
};

export const getUserRecipes = async () => {
    return await apiCall('/recipes', {
        method: 'GET'
    });
};

export const getRecipeById = async (recipeId) => {
    return await apiCall(`/recipes/${recipeId}`, {
        method: 'GET'
    });
};

export const deleteRecipe = async (recipeId) => {
    return await apiCall(`/recipes/${recipeId}`, {
        method: 'DELETE'
    });
};

export const uploadRecipeImage = async (file) => {
    const formData = new FormData();
    formData.append('recipeImage', file);

    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/recipes/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    return await response.json();
};

export const saveUserData = (data) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data._id);
        localStorage.setItem('username', data.username);
        localStorage.setItem('userEmail', data.email);
    }
};

export const getUserData = () => {
    if (typeof window !== 'undefined') {
        return {
            token: localStorage.getItem('token'),
            userId: localStorage.getItem('userId'),
            username: localStorage.getItem('username'),
            email: localStorage.getItem('userEmail')
        };
    }
    return null;
};

export const clearUserData = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('userEmail');
    }
};

export const isAuthenticated = () => {
    if (typeof window !== 'undefined') {
        return !!localStorage.getItem('token');
    }
    return false;
};

export const createCookingSession = async (recipeId, userId, guestId) => {
    return await apiCall('/sessions', {
        method: 'POST',
        body: JSON.stringify({ recipeId, userId, guestId })
    });
};

export const getCookingSession = async (sessionId) => {
    return await apiCall(`/sessions/${sessionId}`, {
        method: 'GET'
    });
};

export const getSessions = async (userId, guestId) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (guestId) params.append('guestId', guestId);
    
    return await apiCall(`/sessions?${params.toString()}`, {
        method: 'GET'
    });
};

export const updateCookingSession = async (sessionId, data) => {
    return await apiCall(`/sessions/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

export const markStepComplete = async (sessionId, stepNumber) => {
    return await apiCall(`/sessions/${sessionId}/steps/${stepNumber}`, {
        method: 'PUT'
    });
};


export const createMealPlan = async (userId, guestId, weekOf) => {
    return await apiCall('/meal-plans', {
        method: 'POST',
        body: JSON.stringify({ userId, guestId, weekOf })
    });
};

export const getMealPlan = async (userId, guestId, weekOf) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (guestId) params.append('guestId', guestId);
    if (weekOf) params.append('weekOf', weekOf);
    
    return await apiCall(`/meal-plans?${params.toString()}`, {
        method: 'GET'
    });
};

export const updateMealPlan = async (planId, meals) => {
    return await apiCall(`/meal-plans/${planId}`, {
        method: 'PUT',
        body: JSON.stringify({ meals })
    });
};

export const addMealToPlan = async (planId, mealData) => {
    return await apiCall(`/meal-plans/${planId}/meals`, {
        method: 'POST',
        body: JSON.stringify(mealData)
    });
};

export const deleteMealFromPlan = async (planId, mealId) => {
    return await apiCall(`/meal-plans/${planId}/meals/${mealId}`, {
        method: 'DELETE'
    });
};

export const markMealComplete = async (planId, mealId, completed) => {
    return await apiCall(`/meal-plans/${planId}/meals/${mealId}/complete`, {
        method: 'PUT',
        body: JSON.stringify({ completed })
    });
};

export const logFood = async (userId, guestId, date, food) => {
    return await apiCall('/calories/log', {
        method: 'POST',
        body: JSON.stringify({ userId, guestId, date, food })
    });
};

export const getFoodLog = async (userId, guestId, date) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (guestId) params.append('guestId', guestId);
    if (date) params.append('date', date);
    
    return await apiCall(`/calories/log?${params.toString()}`, {
        method: 'GET'
    });
};

export const deleteFood = async (logId, foodId) => {
    return await apiCall(`/calories/log/${logId}/food/${foodId}`, {
        method: 'DELETE'
    });
};

export const updateCalorieGoal = async (userId, guestId, date, dailyGoal) => {
    return await apiCall('/calories/goal', {
        method: 'PUT',
        body: JSON.stringify({ userId, guestId, date, dailyGoal })
    });
};

export const getWeeklyCalories = async (userId, guestId, startDate) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (guestId) params.append('guestId', guestId);
    if (startDate) params.append('startDate', startDate);
    
    return await apiCall(`/calories/weekly?${params.toString()}`, {
        method: 'GET'
    });
};

export const sendChatMessage = async (message, history) => {
    return await apiCall('/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history })
    });
};

export const generateRecipe = async (ingredients, userId, guestId) => {
    return await apiCall('/chat/generate-recipe', {
        method: 'POST',
        body: JSON.stringify({ ingredients, userId, guestId })
    });
};
