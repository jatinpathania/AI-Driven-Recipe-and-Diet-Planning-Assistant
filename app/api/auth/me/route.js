import connectDB from '@/lib/db/connectDB';
import { verifyAuth } from '@/lib/middleware/auth';
import { NextResponse } from 'next/server';

export async function GET(request){
    try{
        await connectDB();
        const user = await verifyAuth(request);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Not authorized, token failed' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { success: true, data: user },
            { status: 200 }
        );
    }catch(error){
        console.error('Get current user error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
}
