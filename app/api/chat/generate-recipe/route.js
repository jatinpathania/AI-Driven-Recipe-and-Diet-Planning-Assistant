import connectDB from '@/lib/db/connectDB';
import Recipe from '@/lib/models/Recipe';
import { parseIngredientsToRecipe } from '@/lib/config/openrouter';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        await connectDB();
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

        if (userId || guestId) {
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
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
