// Trigger hot reload compilation
import connectDB from '@/lib/db/connectDB';
import Recipe from '@/lib/models/Recipe';
import { generateRecipeSuggestions } from '@/lib/config/qwen';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        let dbConnected = false;
        try {
            await connectDB();
            dbConnected = true;
        } catch (dbError) {
            console.error('Graceful Fallback - MongoDB not running:', dbError.message);
        }

        const { message, history } = await request.json();

        if (!message) {
            return NextResponse.json(
                { message: 'Message is required' },
                { status: 400 }
            );
        }

        // AI response from Qwen
        const aiResponse = await generateRecipeSuggestions(message, history || []);

        // Fetch recipe cards if the response mentions recipes
        let recipeCards = [];
        if (message.toLowerCase().includes('recipe') || message.toLowerCase().includes('cook')) {
            if (dbConnected) {
                try {
                    const recipes = await Recipe.find().limit(3).sort({ createdAt: -1 });
                    recipeCards = recipes.map(r => ({
                        id: r._id,
                        name: r.recipeName,
                        time: r.time,
                        calories: r.calories,
                        emoji: r.emoji,
                        difficulty: r.difficulty
                    }));
                } catch (err) {
                    console.error('Failed to query recipes from DB, using fallback cards:', err.message);
                    dbConnected = false;
                }
            }
            
            // Fallback recipes if DB query failed or MongoDB is not running
            if (!dbConnected || recipeCards.length === 0) {
                recipeCards = [
                    {
                        id: 'fallback-carbonara',
                        name: 'Pasta Carbonara',
                        time: '25m',
                        calories: 520,
                        emoji: '🍝',
                        difficulty: 'Easy'
                    },
                    {
                        id: 'fallback-ramen',
                        name: 'Miso Ramen',
                        time: '35m',
                        calories: 380,
                        emoji: '🍜',
                        difficulty: 'Medium'
                    },
                    {
                        id: 'fallback-tofu',
                        name: 'Tofu Buddha Bowl',
                        time: '20m',
                        calories: 410,
                        emoji: '🥗',
                        difficulty: 'Easy'
                    }
                ];
            }
        }

        return NextResponse.json(
            {
                message: aiResponse.message,
                recipeCards,
                success: aiResponse.success,
                debug: aiResponse.raw || null
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in chat API route:', error);
        return NextResponse.json(
            { message: error.message || 'An error occurred during chat processing' },
            { status: 500 }
        );
    }
}