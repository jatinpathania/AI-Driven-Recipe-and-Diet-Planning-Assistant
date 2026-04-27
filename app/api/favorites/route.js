import connectDB from '@/lib/db/connectDB';
import FavoriteRecipe from '@/lib/models/FavoriteRecipe';
import { verifyAuth } from '@/lib/middleware/auth';
import { NextResponse } from 'next/server';

// Add to favorites
export async function POST(request) {
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

        const { recipeId, rating, notes } = await request.json();

        if (!recipeId) {
            return NextResponse.json(
                { success: false, message: 'Recipe ID required' },
                { status: 400 }
            );
        }

        const existing = await FavoriteRecipe.findOne({
            userId: user._id,
            recipeId
        });

        if (existing) {
            if (rating) existing.rating = rating;
            if (notes) existing.notes = notes;
            await existing.save();
            return NextResponse.json({
                success: true,
                message: 'Favorite updated',
                data: existing
            });
        }

        const favorite = await FavoriteRecipe.create({
            userId: user._id,
            recipeId,
            rating: rating || null,
            notes: notes || ''
        });

        return NextResponse.json({
            success: true,
            message: 'Added to favorites',
            data: favorite
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
}

// Get user favorites
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

        const favorites = await FavoriteRecipe.find({ userId: user._id })
            .populate('recipeId')
            .sort({ savedAt: -1 });

        return NextResponse.json({
            success: true,
            data: favorites
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
}

// Delete from favorites
export async function DELETE(request) {
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

        const { recipeId } = await request.json();

        await FavoriteRecipe.deleteOne({
            userId: user._id,
            recipeId
        });

        return NextResponse.json({
            success: true,
            message: 'Removed from favorites'
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
}
