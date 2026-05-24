import connectDB from '@/lib/db/connectDB';
import { verifyAuth } from '@/lib/middleware/auth';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';

export async function PUT(request) {
    try {
        await connectDB();
        
        const user = await verifyAuth(request);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Not authorized' },
                { status: 401 }
            );
        }

        const { username, fullName, bio } = await request.json();

        if (username !== undefined) {
            if (!username || !username.trim()) {
                return NextResponse.json(
                    { success: false, message: 'Username cannot be empty' },
                    { status: 400 }
                );
            }

            const cleanUsername = username.trim();

            // Check if username is already taken by another user
            const existingUser = await User.findOne({
                username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') },
                _id: { $ne: user._id }
            });

            if (existingUser) {
                return NextResponse.json(
                    { success: false, message: 'Username is already taken' },
                    { status: 400 }
                );
            }

            user.username = cleanUsername;
        }

        if (fullName !== undefined) {
            user.fullName = fullName.trim();
        }

        if (bio !== undefined) {
            user.bio = bio.trim();
        }

        await user.save();

        return NextResponse.json(
            {
                success: true,
                message: 'Profile updated successfully',
                data: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    bio: user.bio,
                    profileImage: user.profileImage
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update username error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error updating username', error: error.message },
            { status: 500 }
        );
    }
}
