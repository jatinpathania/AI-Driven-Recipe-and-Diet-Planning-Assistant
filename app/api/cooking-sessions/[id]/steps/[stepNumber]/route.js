import connectDB from '@/lib/db/connectDB';
import CookingSession from '@/lib/models/CookingSession';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
    try {
        await connectDB();

        const session = await CookingSession.findById(params.id);

        if (!session) {
            return NextResponse.json(
                { message: 'Session not found' },
                { status: 404 }
            );
        }

        const step = session.steps.find(s => s.stepNumber === parseInt(params.stepNumber));

        if (!step) {
            return NextResponse.json(
                { message: 'Step not found' },
                { status: 404 }
            );
        }

        step.completed = true;
        step.completedAt = new Date();

        // Check if all steps are completed
        const allCompleted = session.steps.every(s => s.completed);
        if (allCompleted) {
            session.status = 'completed';
            session.completedAt = new Date();
        }

        await session.save();
        const updatedSession = await CookingSession.findById(session._id).populate('recipeId');

        return NextResponse.json(updatedSession, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
