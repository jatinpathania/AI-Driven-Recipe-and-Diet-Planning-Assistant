import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/connectDB'
import User from '@/lib/models/User'
import PendingSignup from '@/lib/models/PendingSignup'
import { generateToken } from '@/lib/middleware/auth'
import { MAX_ATTEMPTS, codeMatches, normalizeEmail } from '@/lib/auth/otp'
import { usernameTaken } from '@/lib/auth/username'

/**
 * POST /api/auth/signup/verify  body: { email, code }
 *
 * Step 2 of 2. Checks the emailed code and, if it matches, creates the
 * account (or adds email sign-in to an existing Google account, now that the
 * person has proven they own the address) and signs them in.
 *
 * → 201 { success, data: { _id, username, fullName, email, token } }
 * Errors carry a `code`: NO_PENDING, OTP_EXPIRED, OTP_INVALID (+ attemptsLeft),
 * OTP_LOCKED, USERNAME_TAKEN, EMAIL_EXISTS.
 */

const fail = (status, code, message, extra = {}) => NextResponse.json({ success: false, code, message, ...extra }, { status })

export async function POST(request) {
    let body
    try {
        body = await request.json()
    } catch {
        return fail(400, 'BAD_REQUEST', 'Invalid request')
    }
    const email = normalizeEmail(body?.email)
    const code = String(body?.code || '').replace(/\s/g, '')
    if (!email || !/^\d{6}$/.test(code)) return fail(400, 'OTP_INVALID', 'Enter the 6-digit code from the email.')

    try {
        await connectDB()
        const now = new Date()

        // Count the attempt atomically before comparing, so parallel guesses
        // can't get around the attempt limit.
        const pending = await PendingSignup.findOneAndUpdate(
            { email, codeHash: { $ne: null }, codeExpiresAt: { $gt: now }, attempts: { $lt: MAX_ATTEMPTS } },
            { $inc: { attempts: 1 } },
            { new: true }
        )

        if (!pending) {
            const existing = await PendingSignup.findOne({ email }).lean()
            if (!existing) {
                const verified = await User.exists({ email, authMethods: 'email' })
                return verified
                    ? fail(400, 'EMAIL_EXISTS', 'This email is already verified. Please sign in.')
                    : fail(400, 'NO_PENDING', 'This sign-up has expired. Please fill in the form again.')
            }
            if (existing.codeHash && existing.attempts >= MAX_ATTEMPTS) {
                return fail(429, 'OTP_LOCKED', 'Too many wrong tries. Tap “Resend code” to get a new one.')
            }
            return fail(400, 'OTP_EXPIRED', 'This code has expired. Tap “Resend code” to get a new one.')
        }

        if (!codeMatches(email, code, pending.codeHash)) {
            const attemptsLeft = Math.max(0, MAX_ATTEMPTS - pending.attempts)
            if (attemptsLeft === 0) {
                return fail(429, 'OTP_LOCKED', 'Too many wrong tries. Tap “Resend code” to get a new one.')
            }
            return fail(400, 'OTP_INVALID', `That code isn't right. ${attemptsLeft} ${attemptsLeft === 1 ? 'try' : 'tries'} left.`, { attemptsLeft })
        }

        // Code is right. Make sure the account can still be created.
        const existing = await User.findOne({ email })
        if (existing && (existing.authMethods?.includes('email') || existing.password)) {
            await PendingSignup.deleteOne({ _id: pending._id })
            return fail(400, 'EMAIL_EXISTS', 'An account with this email already exists. Please sign in instead.')
        }
        if (!existing && (await usernameTaken(pending.username, email))) {
            return fail(409, 'USERNAME_TAKEN', 'Someone just took that username. Go back and choose another one.')
        }

        // Consume the sign-up exactly once, even if the code is submitted twice.
        const claimed = await PendingSignup.findOneAndDelete({ _id: pending._id, codeHash: pending.codeHash })
        if (!claimed) return fail(409, 'NO_PENDING', 'This code was already used. Please sign in.')

        let user
        if (existing) {
            existing.authMethods = [...new Set([...(existing.authMethods || []), 'email'])]
            existing.password = claimed.passwordHash
            if (!existing.fullName && claimed.fullName) existing.fullName = claimed.fullName
            user = await existing.save()
        } else {
            user = await User.create({
                username: claimed.username,
                fullName: claimed.fullName || claimed.username,
                email,
                password: claimed.passwordHash,
                authMethods: ['email'],
            })
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Email verified. Welcome to Flavour.AI!',
                data: { _id: user._id, username: user.username, fullName: user.fullName, email: user.email, token: generateToken(user._id) },
            },
            { status: 201 }
        )
    } catch (error) {
        if (error?.code === 11000) return fail(409, 'USERNAME_TAKEN', 'That username or email was just taken. Please sign up again.')
        console.error('Signup verify error:', error.message)
        return fail(500, 'SERVER_ERROR', 'Server error while verifying the code')
    }
}
