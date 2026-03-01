import connectDB from '@/lib/db/connectDB';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/middleware/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        await connectDB();
        const { username, fullName, email, password } = await request.json();
        if (!username || !email || !password){
            return NextResponse.json(
                { success: false, message: 'Please provide all required fields' },
                { status: 400 }
            );
        }
        // Check if user with same email exists
        const userByEmail = await User.findOne({ email });
        const userByUsername = await User.findOne({ username });
        
        let user;
        if(userByEmail) {
            // User exists with this email
            if(!userByEmail.authMethods) {
                userByEmail.authMethods = [];
            }
            
            // Check if user already has email auth method
            if(userByEmail.authMethods.includes('email')) {
                // User already signed up with email+password
                return NextResponse.json(
                    { success: false, message: 'User already exists with this email. Please login instead.' },
                    { status: 400 }
                );
            }
            
            // User only has other auth methods (like Google)
            // Allow adding email method
            userByEmail.authMethods.push('email');
            if(!userByEmail.password) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                userByEmail.password = hashedPassword;
            }
            if(!userByEmail.fullName && fullName) {
                userByEmail.fullName = fullName;
            }
            await userByEmail.save();
            user = userByEmail;
        } else if(userByUsername) {
            return NextResponse.json(
                { success: false, message: 'Username already exists' },
                { status: 400 }
            );
        } else {
            // Create new user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = await User.create({
                username,
                fullName: fullName || username,
                email,
                password: hashedPassword,
                authMethods: ['email']
            });
        }

        const token = generateToken(user._id);

        return NextResponse.json(
            {
                success: true,
                message: 'User created successfully',
                data: {
                    _id: user._id,
                    username: user.username,
                    fullName: user.fullName,
                    email: user.email,
                    token
                }
            },
            { status: 201 }
        );
    }catch (error){
        console.error('Signup error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error during signup', error: error.message },
            { status: 500 }
        );
    }
}