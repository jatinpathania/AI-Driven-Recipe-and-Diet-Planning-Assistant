import connectDB from '@/lib/db/connectDB';
import Recipe from '@/lib/models/Recipe';
import { generateRecipeSuggestions } from '@/lib/config/openrouter';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        await connectDB();

        const { message, history } = await request.json();

        if (!message) {
            return NextResponse.json(
                { message: 'Message is required' },
                { status: 400 }
            );
        }

        //AI response from ai
        const aiResponse = await generateRecipeSuggestions(message, history || []);

        // Fetch recipe cards if the response mentions recipes
        let recipeCards = [];
        if (message.toLowerCase().includes('recipe') || message.toLowerCase().includes('cook')) {
            const recipes = await Recipe.find().limit(3).sort({ createdAt: -1 });
            recipeCards = recipes.map(r => ({
                id: r._id,
                name: r.recipeName,
                time: r.time,
                calories: r.calories,
                emoji: r.emoji,
                difficulty: r.difficulty
            }));
        }

        return NextResponse.json(
            {
                message: aiResponse.message,
                recipeCards,
                success: aiResponse.success
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
