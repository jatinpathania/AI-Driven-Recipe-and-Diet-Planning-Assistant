import connectDB from '@/lib/db/connectDB';
import Recipe from '@/lib/models/Recipe';
import { parseIngredientsToRecipe } from '@/lib/config/qwen';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        let dbConnected = false;
        try {
            await connectDB();
            dbConnected = true;
        } catch (dbError) {
            console.error('Graceful Fallback - MongoDB not running for recipe generation:', dbError.message);
        }

        const { ingredients, userId, guestId } = await request.json();
        if (!ingredients) {
            return NextResponse.json(
                { message: 'Ingredients are required' },
                { status: 400 }
            );
        }

        const result = await parseIngredientsToRecipe(ingredients);

        if (!result.success) {
            return NextResponse.json(
                { message: result.message },
                { status: 400 }
            );
        }

        if (dbConnected && (userId || guestId)) {
            try {
                const recipeData = {
                    ...result.recipe,
                    userId: userId || null,
                    originalPrompt: ingredients
                };

                const savedRecipe = await Recipe.create(recipeData);
                return NextResponse.json(
                    {
                        ...result,
                        savedRecipe
                    },
                    { status: 201 }
                );
            } catch (saveError) {
                console.error('Failed to save generated recipe to MongoDB, returning unsaved:', saveError.message);
            }
        }

        // Return the recipe without saving to DB if DB is offline
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error('Error in generate-recipe route:', error);
        return NextResponse.json(
            { message: error.message || 'An error occurred during recipe generation' },
            { status: 500 }
        );
    }
}