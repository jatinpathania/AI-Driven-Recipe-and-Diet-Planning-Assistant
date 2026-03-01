import connectDB from '@/lib/db/connectDB';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/middleware/auth';
import { NextResponse } from 'next/server';

export async function POST(request){
    try{
        await connectDB();
        const { emailOrUsername, password } = await request.json();

        if(!emailOrUsername || !password) {
            return NextResponse.json(
                { success: false, message: 'Please provide email/username and password' },
                { status: 400 }
            );
        }

        const user= await User.findOne({
            $or: [
                { email: emailOrUsername },
                { username: emailOrUsername }
            ]
        });

        if(!user){
            return NextResponse.json(
                { success: false, message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check if user has password (email signup) or OAuth only
        if(!user.password) {
            return NextResponse.json(
                { success: false, message: 'This account uses OAuth login. Please login with Google.' },
                { status: 401 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            return NextResponse.json(
                { success: false, message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const token = generateToken(user._id);
        return NextResponse.json(
            {
                success: true,
                message: 'Login successful',
                data: {
                    _id: user._id,
                    username: user.username,
                    fullName: user.fullName,
                    email: user.email,
                    profileImage: user.profileImage,
                    token
                }
            },
            { status: 200 }
        );
    }catch (error){
        console.error('Login error:', error.message);
        console.error('Error details:', error);
        return NextResponse.json(
            { success: false, message: 'Server error during login', error: error.message },
            { status: 500 }
        );
    }
}
