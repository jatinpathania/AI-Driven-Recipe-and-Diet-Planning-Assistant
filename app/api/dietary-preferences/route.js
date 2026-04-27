import connectDB from '@/lib/db/connectDB';
import DietaryPreferences from '@/lib/models/DietaryPreferences';
import { verifyAuth } from '@/lib/middleware/auth';
import { NextResponse } from 'next/server';

// Get dietary preferences
export async function GET(request) {
    try {
        await connectDB();
        const authHeader = request.headers.get('Authorization');
        const user = await verifyAuth(authHeader);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Not authorized' },
                { status: 401 }
            );
        }

        let preferences = await DietaryPreferences.findOne({ userId: user._id });

        if (!preferences) {
            // Create default preferences
            preferences = await DietaryPreferences.create({
                userId: user._id,
                dietary: [],
                allergies: [],
                dislikedIngredients: [],
                cuisinePreferences: []
            });
        }

        return NextResponse.json({
            success: true,
            data: preferences
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
}

// Update dietary preferences
export async function PUT(request) {
    try {
        await connectDB();
        const authHeader = request.headers.get('Authorization');
        const user = await verifyAuth(authHeader);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Not authorized' },
                { status: 401 }
            );
        }

        const updates = await request.json();

        let preferences = await DietaryPreferences.findOne({ userId: user._id });

        if (!preferences) {
            preferences = await DietaryPreferences.create({
                userId: user._id,
                ...updates
            });
        } else {
            Object.keys(updates).forEach(key => {
                preferences[key] = updates[key];
            });
            await preferences.save();
        }

        return NextResponse.json({
            success: true,
            message: 'Preferences updated',
            data: preferences
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
}
