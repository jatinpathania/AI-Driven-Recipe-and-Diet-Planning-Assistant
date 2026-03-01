import connectDB from '@/lib/db/connectDB';
import CalorieLog from '@/lib/models/CalorieLog';
import { NextResponse } from 'next/server';

const getStartOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getEndOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

export async function POST(request) {
    try{
        await connectDB();
        const { userId, guestId, date, food } = await request.json();

        const logDate = getStartOfDay(date || new Date());

        // Find or create calorie log for the day
        let query = { date: logDate };
        if(userId){
            query.userId = userId;
        } else if (guestId) {
            query.guestId = guestId;
        } else {
            return NextResponse.json(
                { message: 'userId or guestId required' },
                { status: 400 }
            );
        }

        let calorieLog = await CalorieLog.findOne(query);

        if (!calorieLog) {
            const logData = {
                date: logDate,
                foods: [],
                dailyGoal: 2000
            };
            if (userId) {
                logData.userId = userId;
            } else {
                logData.guestId = guestId;
            }
            calorieLog = await CalorieLog.create(logData);
        }

        // Add food entry
        calorieLog.foods.push(food);
        await calorieLog.save();

        return NextResponse.json(calorieLog, { status: 200 });
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
        const date = searchParams.get('date');

        const logDate = getStartOfDay(date || new Date());

        let query = { date: logDate };
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

        let calorieLog = await CalorieLog.findOne(query);

        // Create empty log if doesn't exist
        if (!calorieLog) {
            const logData = {
                date: logDate,
                foods: [],
                dailyGoal: 2000
            };
            if (userId) {
                logData.userId = userId;
            } else {
                logData.guestId = guestId;
            }
            calorieLog = await CalorieLog.create(logData);
        }

        return NextResponse.json(calorieLog, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
