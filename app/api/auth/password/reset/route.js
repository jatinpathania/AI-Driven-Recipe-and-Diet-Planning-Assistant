import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/connectDB'
import User from '@/lib/models/User'
import PasswordReset from '@/lib/models/PasswordReset'
import { generateToken } from '@/lib/middleware/auth'
import { normalizeEmail } from '@/lib/auth/otp'
import { PASSWORD_MAX, PASSWORD_MIN, hashResetToken } from '@/lib/auth/passwordReset'

/**
 * POST /api/auth/password/reset  body: { email, resetToken, password }
 *
 * Step 3 of 3. Sets the new password with the one-time token from step 2,
 * then signs the person in. Every app token issued before now stops working
 * (User.passwordChangedAt, checked in lib/middleware/auth.js), so other
 * devices are signed out. A Google-only account gains email sign-in.
 *
 * → 200 { success, data: { _id, username, fullName, email, profileImage, token } }
 * Errors carry a `code`: RESET_EXPIRED, NO_ACCOUNT.
 */

const fail = (status, code, message) => NextResponse.json({ success: false, code, message }, { status })

export async function POST(request) {
    let body
    try {
        body = await request.json()
    } catch {
        return fail(400, 'BAD_REQUEST', 'Invalid request')
    }
    const email = normalizeEmail(body?.email)
    const resetToken = String(body?.resetToken || '')
    const password = String(body?.password || '')

    if (!email || !resetToken) return fail(400, 'RESET_EXPIRED', 'This reset session has expired. Please request a new code.')
    if (password.length < PASSWORD_MIN) return fail(400, 'WEAK_PASSWORD', `Password must be at least ${PASSWORD_MIN} characters`)
    if (password.length > PASSWORD_MAX) return fail(400, 'WEAK_PASSWORD', 'Password is too long')

    try {
        await connectDB()

        // The token works once: claim and delete the request in one step.
        const claimed = await PasswordReset.findOneAndDelete({
            email,
            resetTokenHash: hashResetToken(resetToken),
            resetTokenExpiresAt: { $gt: new Date() },
        })
        if (!claimed) return fail(400, 'RESET_EXPIRED', 'This reset session has expired. Please request a new code.')

        const user = await User.findOne({ email })
        if (!user) return fail(404, 'NO_ACCOUNT', "We couldn't find an account with that email.")

        user.password = await bcrypt.hash(password, 10)
        user.authMethods = [...new Set([...(user.authMethods || []), 'email'])]
        user.passwordChangedAt = new Date()
        await user.save()

        return NextResponse.json({
            success: true,
            message: 'Password updated. You are signed in.',
            data: {
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                profileImage: user.profileImage,
                // Issued after passwordChangedAt, so it survives the sign-out-everywhere check.
                token: generateToken(user._id),
            },
        })
    } catch (error) {
        console.error('Password reset error:', error.message)
        return fail(500, 'SERVER_ERROR', 'Server error while updating the password')
    }
}
