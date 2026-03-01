import connectDB from '@/lib/db/connectDB';
import Recipe from '@/lib/models/Recipe';
import User from '@/lib/models/User';
import { verifyAuth } from '@/lib/middleware/auth';
import { uploadToCloudinary } from '@/lib/config/cloudinary';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try{
        await connectDB();
        const authHeader = request.headers.get('Authorization');
        const user = await verifyAuth(authHeader);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Not authorized' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const recipeName = formData.get('recipeName');
        const description = formData.get('description');
        const ingredients = JSON.parse(formData.get('ingredients') || '[]');
        const instructions = JSON.parse(formData.get('instructions') || '[]');
        const nutritionSummary = formData.get('nutritionSummary');
        const originalPrompt = formData.get('originalPrompt');
        const file = formData.get('recipeImage');

        if (!recipeName || !ingredients.length || !instructions.length) {
            return NextResponse.json(
                { success: false, message: 'Please provide recipe name, ingredients, and instructions' },
                { status: 400 }
            );
        }

        let imageUrl = '';
        let imageId = '';
        if (file) {
            const buffer = await file.arrayBuffer();
            const uploadFile = {
                buffer: Buffer.from(buffer),
                originalname: file.name,
                mimetype: file.type
            };
            const uploadResult = await uploadToCloudinary(uploadFile, {
                folder: `flavour_ai/recipes/${user._id}`
            });
            imageUrl = uploadResult.url;
            imageId = uploadResult.public_id;
        }

        const recipe = await Recipe.create({
            recipeName,
            description,
            ingredients,
            instructions,
            nutritionSummary,
            originalPrompt,
            userId: user._id,
            imageUrl,
            imageId
        });

        await User.findByIdAndUpdate(user._id, {
            $inc: { totalRecipes: 1 }
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Recipe created successfully',
                data: recipe
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create recipe error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error creating recipe', error: error.message },
            { status: 500 }
        );
    }
}

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

        const recipes = await Recipe.find({ userId: user._id }).sort({ createdAt: -1 });

        return NextResponse.json(
            {
                success: true,
                count: recipes.length,
                data: recipes
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get recipes error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error fetching recipes', error: error.message },
            { status: 500 }
        );
    }
}
