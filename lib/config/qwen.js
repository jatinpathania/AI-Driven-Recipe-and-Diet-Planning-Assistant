const callQwen = async (messagesPayload, maxTokens = 200) => {
    const token = process.env.HF_KEY;
    
    // Validate environment variables
    if (!token) {
        const errorMsg = "HF_KEY is missing in environment variables.";
        console.error("Qwen API Error: HF_KEY is undefined");
        return {
            error: errorMsg,
            text: null
        };
    }

    const url = "https://router.huggingface.co/v1/chat/completions";
    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    let retries = 3;
    let delay = 3000;

    while (retries > 0) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

        try {
            console.log("FINAL MESSAGES PAYLOAD:", JSON.stringify(messagesPayload, null, 2));
            console.log("Sending request to Hugging Face Qwen API via router...");

            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    model: "Qwen/Qwen2.5-7B-Instruct",
                    messages: messagesPayload,
                    max_tokens: maxTokens,
                    temperature: 0.7
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log("Hugging Face API Status:", response.status);

            const responseText = await response.text();
            console.log("RAW HF RESPONSE:", responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonErr) {
                console.error("Qwen API Error: Failed to parse JSON response:", responseText);
                throw new Error("Invalid JSON response from server");
            }

            // Check if model is loading (503 Service Unavailable or loading message)
            if (response.status === 503 || (data && data.error && typeof data.error === 'string' && data.error.includes("loading"))) {
                const estTime = data.estimated_time || 20;
                console.warn(`Model is loading. Retrying in ${estTime} seconds. Retries left: ${retries - 1}`);
                retries--;
                await new Promise(resolve => setTimeout(resolve, estTime * 1000));
                continue;
            }

            if (!response.ok) {
                console.error("Qwen API Error: Response not OK:", data);
                const errorDetail = data?.error?.message || data?.error || `HTTP error! status: ${response.status}`;
                throw new Error(errorDetail);
            }

            // Correctly parse generated text from OpenAI format
            const reply = data?.choices?.[0]?.message?.content || "No response generated.";
            console.log("FINAL PARSED RESPONSE:", reply);

            return {
                text: reply,
                raw: data
            };

        } catch (error) {
            clearTimeout(timeoutId);
            console.error("Qwen API Error:", error);

            if (error.name === 'AbortError') {
                console.error("Qwen API Error: Request timed out after 25 seconds.");
            }

            retries--;
            if (retries === 0) {
                return {
                    error: error.message,
                    text: null
                };
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }

    return {
        error: "All retries exhausted",
        text: null
    };
};

const generateRecipeSuggestions = async (userMessage, conversationHistory = []) => {
    console.log("USER MESSAGE:", userMessage);

    const systemPrompt = `You are a modern AI nutrition assistant inside a mobile app.

Rules:
* Keep responses concise and practical (maximum 4–8 lines unless user explicitly asks for detail).
* Use compact formatting without markdown headings.
* Keep recipes realistic, beginner-friendly, and budget-friendly (ideal for students).
* Suggest quick healthy food using common ingredients (no exotic items, unnecessary herbs, or excessive spices).
* Do NOT generate markdown spam (no ### headings, no giant bullet walls, no essay-style content).
* Prefer short responses over long explanations.
* Make responses visually clean and extremely scannable.
* For recipes, you MUST follow this exact compact structure:

Recipe Name
Calories | Protein | Time

Ingredients:
- short list only (max 4-5 common items)

Steps:
1. Short step 1
2. Short step 2

* IMPORTANT: Since you have a strict limit of 120 tokens, keep recipes extremely brief (at most 4-5 ingredients and 2-3 steps) so your message is complete and never cut off.`;
    const messagesPayload = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.map(msg => ({
            role: msg.role === 'ai' || msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        })),
        { role: "user", content: userMessage }
    ];

    const result = await callQwen(messagesPayload, 120);

    if (result.text) {
        return {
            success: true,
            message: result.text.trim(),
            raw: result.raw
        };
    } else {
        return {
            success: false,
            message: result.error && result.error.includes("HF_KEY")
                ? "Configuration Error: Hugging Face API key is missing. Please set HF_KEY in your .env file."
                : "I'm experiencing a minor connection delay. Let's try another prompt or recipe idea in a moment! 🍳",
            error: result.error,
            raw: result.raw || null
        };
    }
};

const parseIngredientsToRecipe = async (ingredients) => {
    console.log("USER MESSAGE (Ingredients):", ingredients);

    const systemPrompt = `You are a precise recipe generator. You output ONLY a perfectly formatted JSON object matching the requested schema, with no additional conversational text.
You MUST return ONLY a valid JSON object. Do not wrap it in markdown codeblocks (like \`\`\`json), do not write any intro or explanation. Just return the raw JSON object.

The JSON object MUST follow this exact schema:
{
  "recipeName": "Recipe Name",
  "description": "Brief description of the dish",
  "time": "30 mins",
  "servings": 4,
  "difficulty": "Easy",
  "calories": 350,
  "protein": 20,
  "carbs": 40,
  "fat": 10,
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
  "instructions": [
    { "step": "description of the step", "timeInMinutes": 5 },
    { "step": "another description", "timeInMinutes": 2 }
  ],
  "tags": ["Quick", "Healthy"],
  "emoji": "🍳"
}`;

    const messagesPayload = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a recipe using these ingredients: ${ingredients}` }
    ];

    const result = await callQwen(messagesPayload, 600);

    if (result.text) {
        try {
            const cleanText = result.text.trim();
            // Extract JSON block
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const recipe = JSON.parse(jsonMatch[0]);
                return {
                    success: true,
                    recipe,
                    raw: result.raw
                };
            }
        } catch (parseError) {
            console.error('Failed to parse Qwen JSON response:', result.text, parseError);
        }
    }

    return {
        success: false,
        message: "I could not format the recipe into a structured layout, but try using standard ingredients!",
        error: result.error,
        raw: result.raw || null
    };
};

module.exports = {
    generateRecipeSuggestions,
    parseIngredientsToRecipe
};
