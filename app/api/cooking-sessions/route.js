import connectDB from '@/lib/db/connectDB';
import CookingSession from '@/lib/models/CookingSession';
import Recipe from '@/lib/models/Recipe';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        await connectDB();

        const { recipeId, userId, guestId } = await request.json();
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return NextResponse.json(
                { message: 'Recipe not found' },
                { status: 404 }
            );
        }

        const steps = recipe.instructions.map((instruction, index) => ({
            stepNumber: index + 1,
            description: instruction,
            duration: 0,
            completed: false
        }));

        const sessionData = {
            recipeId,
            steps,
            totalDuration: recipe.time ? recipe.time * 60 : 0,
            remainingTime: recipe.time ? recipe.time * 60 : 0
        };

        if (userId) {
            sessionData.userId = userId;
        } else if (guestId) {
            sessionData.guestId = guestId;
        }

        const session = await CookingSession.create(sessionData);
        const populatedSession = await CookingSession.findById(session._id).populate('recipeId');

        return NextResponse.json(populatedSession, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const guestId = searchParams.get('guestId');

        let query = { status: { $ne: 'completed' } };

        if (userId) {
            query.userId = userId;
        } else if (guestId) {
            query.guestId = guestId;
        } else {
            return NextResponse.json(
                { message: 'userId or guestId required' },
                { status: 400 }
            );
        }

        const sessions = await CookingSession.find(query)
            .populate('recipeId')
            .sort({ createdAt: -1 });

        return NextResponse.json(sessions, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
