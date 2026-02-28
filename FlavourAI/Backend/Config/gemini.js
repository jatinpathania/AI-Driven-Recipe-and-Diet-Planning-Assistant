const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate recipe suggestions based on user input
 * @param {string} userMessage - User's message describing ingredients or preferences
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Object} AI response with message and optional recipe suggestions
 */
const generateRecipeSuggestions = async (userMessage, conversationHistory = []) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // Build context from conversation history
        let context = conversationHistory.map(msg => 
            `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n');

        const prompt = `You are a helpful AI cooking assistant for FlavourAI. Help users with recipes, cooking tips, and meal planning.

Previous conversation:
${context}

User: ${userMessage}

Instructions:
- Be friendly and encouraging
- If user mentions ingredients, suggest 2-3 specific recipes
- Include cooking time and difficulty for each recipe
- Keep responses concise and actionable
- Use emojis to make it more engaging

Respond in a conversational tone.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            success: true,
            message: text
        };
    } catch (error) {
        console.error('Gemini API Error:', error);
        return {
            success: false,
            message: "I'm having trouble connecting right now. Let me suggest some popular recipes instead! 🍳",
            error: error.message
        };
    }
};

/**
 * Answer cooking-related questions
 * @param {string} question - User's cooking question
 * @returns {Object} AI response
 */
const answerCookingQuestion = async (question) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `You are a knowledgeable cooking assistant. Answer this cooking question concisely and helpfully:

Question: ${question}

Provide a clear, practical answer with tips if relevant. Keep it under 150 words.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            success: true,
            answer: text
        };
    } catch (error) {
        console.error('Gemini API Error:', error);
        return {
            success: false,
            answer: "I'm having trouble right now, but here's a quick tip: Always taste as you cook and adjust seasonings to your preference! 👨‍🍳",
            error: error.message
        };
    }
};

/**
 * Parse user input with ingredients and generate a recipe
 * @param {string} ingredients - Comma-separated list of ingredients
 * @returns {Object} Generated recipe object
 */
const parseIngredientsToRecipe = async (ingredients) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `Create a recipe using these ingredients: ${ingredients}

Return ONLY a JSON object with this structure (no markdown, no explanation):
{
  "recipeName": "Recipe Name",
  "description": "Brief description",
  "time": 30,
  "servings": 4,
  "difficulty": "Easy",
  "calories": 350,
  "protein": 20,
  "carbs": 40,
  "fat": 10,
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "tags": ["Quick", "Healthy"],
  "emoji": "🍳"
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Try to parse JSON from response
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const recipe = JSON.parse(jsonMatch[0]);
                return {
                    success: true,
                    recipe
                };
            }
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
        }

        return {
            success: false,
            message: "Couldn't generate a recipe. Try being more specific with ingredients!"
        };
    } catch (error) {
        console.error('Gemini API Error:', error);
        return {
            success: false,
            message: "Error generating recipe",
            error: error.message
        };
    }
};

module.exports = {
    generateRecipeSuggestions,
    answerCookingQuestion,
    parseIngredientsToRecipe
};
