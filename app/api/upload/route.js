import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const user = await verifyAuth(authHeader);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Not authorized' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const type = formData.get('type') || 'image'; // image or document

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, message: 'File size must not exceed 2MB' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const allowedDocTypes = ['application/pdf', 'application/msword', 'text/plain'];
        
        const allowedTypes = type === 'image' ? allowedImageTypes : allowedDocTypes;
        
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, message: `Invalid ${type} type` },
                { status: 400 }
            );
        }

        // Convert to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        return new Promise((resolve) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `flavourai/${type}s/${user._id}`,
                    resource_type: 'auto',
                    max_file_size: MAX_FILE_SIZE,
                },
                (error, result) => {
                    if (error) {
                        resolve(NextResponse.json(
                            { success: false, message: 'Upload failed', error: error.message },
                            { status: 500 }
                        ));
                    } else {
                        resolve(NextResponse.json({
                            success: true,
                            message: 'File uploaded successfully',
                            data: {
                                url: result.secure_url,
                                publicId: result.public_id,
                                size: result.bytes,
                                type: result.resource_type
                            }
                        }));
                    }
                }
            );

            uploadStream.end(buffer);
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
}
