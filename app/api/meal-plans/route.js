import connectDB from '@/lib/db/connectDB';
import MealPlan from '@/lib/models/MealPlan';
import { NextResponse } from 'next/server';

const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

export async function POST(request) {
    try {
        await connectDB();

        const { userId, guestId, weekOf } = await request.json();

        const startOfWeek = getStartOfWeek(weekOf || new Date());

        let query = { weekOf: startOfWeek };
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

        let mealPlan = await MealPlan.findOne(query).populate('meals.recipeId');

        if (mealPlan) {
            return NextResponse.json(mealPlan, { status: 200 });
        }

        const planData = {
            weekOf: startOfWeek,
            meals: []
        };

        if (userId) {
            planData.userId = userId;
        } else {
            planData.guestId = guestId;
        }

        mealPlan = await MealPlan.create(planData);
        return NextResponse.json(mealPlan, { status: 201 });
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
        const weekOf = searchParams.get('weekOf');

        const startOfWeek = getStartOfWeek(weekOf || new Date());

        let query = { weekOf: startOfWeek };
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

        const mealPlan = await MealPlan.findOne(query).populate('meals.recipeId');

        if (!mealPlan) {
            return NextResponse.json(
                { message: 'Meal plan not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(mealPlan, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
