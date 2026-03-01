import connectDB from '@/lib/db/connectDB';
import Recipe from '@/lib/models/Recipe';
import User from '@/lib/models/User';
import { verifyAuth } from '@/lib/middleware/auth';
import { deleteFromCloudinary } from '@/lib/config/cloudinary';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
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

        const recipe = await Recipe.findById(params.id);

        if (!recipe) {
            return NextResponse.json(
                { success: false, message: 'Recipe not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, data: recipe },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get recipe error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error fetching recipe', error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
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

        const recipe = await Recipe.findById(params.id);

        if (!recipe) {
            return NextResponse.json(
                { success: false, message: 'Recipe not found' },
                { status: 404 }
            );
        }

        // Check if user owns the recipe
        if (recipe.userId.toString() !== user._id.toString()) {
            return NextResponse.json(
                { success: false, message: 'Not authorized to delete this recipe' },
                { status: 403 }
            );
        }

        // Delete image from cloudinary if exists
        if (recipe.imageId) {
            await deleteFromCloudinary(recipe.imageId);
        }

        await recipe.deleteOne();

        // Decrement user's total recipes count
        await User.findByIdAndUpdate(user._id, {
            $inc: { totalRecipes: -1 }
        });

        return NextResponse.json(
            { success: true, message: 'Recipe deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete recipe error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error deleting recipe', error: error.message },
            { status: 500 }
        );
    }
}
