import connectDB from '@/lib/db/connectDB';
import CookingSession from '@/lib/models/CookingSession';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        await connectDB();

        const session = await CookingSession.findById(params.id).populate('recipeId');

        if (!session) {
            return NextResponse.json(
                { message: 'Session not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(session, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();

        const { status, remainingTime } = await request.json();

        const session = await CookingSession.findById(params.id);

        if (!session) {
            return NextResponse.json(
                { message: 'Session not found' },
                { status: 404 }
            );
        }

        if (status) {
            session.status = status;
            if (status === 'in_progress' && !session.startedAt) {
                session.startedAt = new Date();
            }
            if (status === 'completed') {
                session.completedAt = new Date();
            }
        }

        if (remainingTime !== undefined) {
            session.remainingTime = remainingTime;
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

export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const session = await CookingSession.findById(params.id);

        if (!session) {
            return NextResponse.json(
                { message: 'Session not found' },
                { status: 404 }
            );
        }

        await session.deleteOne();

        return NextResponse.json(
            { message: 'Session deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
