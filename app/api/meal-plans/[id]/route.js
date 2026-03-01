import connectDB from '@/lib/db/connectDB';
import MealPlan from '@/lib/models/MealPlan';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
    try {
        await connectDB();

        const { meals } = await request.json();

        const mealPlan = await MealPlan.findById(params.id);

        if (!mealPlan) {
            return NextResponse.json(
                { message: 'Meal plan not found' },
                { status: 404 }
            );
        }

        if (meals) {
            mealPlan.meals = meals;
        }

        await mealPlan.save();
        const updatedPlan = await MealPlan.findById(mealPlan._id).populate('meals.recipeId');

        return NextResponse.json(updatedPlan, { status: 200 });
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

        const mealPlan = await MealPlan.findById(params.id);

        if (!mealPlan) {
            return NextResponse.json(
                { message: 'Meal plan not found' },
                { status: 404 }
            );
        }

        await mealPlan.deleteOne();

        return NextResponse.json(
            { message: 'Meal plan deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
