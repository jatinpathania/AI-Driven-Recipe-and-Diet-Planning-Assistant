import connectDB from '@/lib/db/connectDB';
import MealPlan from '@/lib/models/MealPlan';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
    try {
        await connectDB();

        const { day, mealType, recipeId, recipeName, calories } = await request.json();

        const mealPlan = await MealPlan.findById(params.id);

        if (!mealPlan) {
            return NextResponse.json(
                { message: 'Meal plan not found' },
                { status: 404 }
            );
        }

        const newMeal = {
            day,
            mealType,
            recipeId: recipeId || null,
            recipeName: recipeName || '',
            calories: calories || 0,
            completed: false
        };

        mealPlan.meals.push(newMeal);
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
