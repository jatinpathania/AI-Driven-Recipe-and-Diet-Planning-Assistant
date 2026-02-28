const axios = require('axios');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'arcee-ai/trinity-large-preview:free';

const callOpenRouter = async (messages) => {
    try {
        const response = await axios.post(
            OPENROUTER_API_URL,
            {
                model: MODEL,
                messages,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'FlavourAI',
                },
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('OpenRouter callOpenRouter error:', error.response?.status, error.response?.data || error.message);
        throw error;
    }
};

const generateRecipeSuggestions = async (userMessage, conversationHistory = []) => {
    try {
        const messages = [
            {
                role: 'system',
                content: `You are a helpful AI cooking assistant for FlavourAI. Help users with recipes, cooking tips, and meal planning.
- Be friendly and encouraging
- If user mentions ingredients, suggest 2-3 specific recipes
- Include cooking time and difficulty for each recipe
- Keep responses concise and actionable
- Use emojis to make it more engaging
- Respond in a conversational tone.`
            },
            ...conversationHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            { role: 'user', content: userMessage }
        ];

        const text = await callOpenRouter(messages);

        return {
            success: true,
            message: text
        };
    } catch (error) {
        console.error('OpenRouter API Error:', error.response?.data || error.message);
        return {
            success: false,
            message: "I'm having trouble connecting right now. Let me suggest some popular recipes instead! 🍳",
            error: error.message
        };
    }
};

const answerCookingQuestion = async (question) => {
    try {
        const messages = [
            {
                role: 'system',
                content: 'You are a knowledgeable cooking assistant. Provide clear, practical answers with tips if relevant. Keep it under 150 words.'
            },
            { role: 'user', content: question }
        ];

        const text = await callOpenRouter(messages);

        return {
            success: true,
            answer: text
        };
    } catch (error) {
        console.error('OpenRouter API Error:', error.response?.data || error.message);
        return {
            success: false,
            answer: "I'm having trouble right now, but here's a quick tip: Always taste as you cook and adjust seasonings to your preference! 👨‍🍳",
            error: error.message
        };
    }
};

const parseIngredientsToRecipe = async (ingredients) => {
    try {
        const messages = [
            {
                role: 'system',
                content: 'You are a recipe generator. You MUST return ONLY a valid JSON object with no markdown, no explanation, no extra text.'
            },
            {
                role: 'user',
                content: `Create a recipe using these ingredients: ${ingredients}

Return ONLY a JSON object with this structure:
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
}`
            }
        ];

        const text = await callOpenRouter(messages);

        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const recipe = JSON.parse(jsonMatch[0]);
                return { success: true, recipe };
            }
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
        }

        return {
            success: false,
            message: "Couldn't generate a recipe. Try being more specific with ingredients!"
        };
    } catch (error) {
        console.error('OpenRouter API Error:', error.response?.data || error.message);
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
