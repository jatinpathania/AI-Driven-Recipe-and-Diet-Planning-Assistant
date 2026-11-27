import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/connectDB'
import PasswordReset from '@/lib/models/PasswordReset'
import { MAX_ATTEMPTS, codeMatches, normalizeEmail } from '@/lib/auth/otp'
import { RESET_TOKEN_TTL_MINUTES, newResetToken } from '@/lib/auth/passwordReset'

/**
 * POST /api/auth/password/verify  body: { email, code }
 *
 * Step 2 of 3. Checks the emailed code. The code works once: if it matches it
 * is traded for a one-time reset token that step 3 needs.
 *
 * → 200 { success, resetToken, expiresInSec }
 * Errors carry a `code`: NO_PENDING, OTP_EXPIRED, OTP_USED, OTP_INVALID (+ attemptsLeft), OTP_LOCKED.
 */

const fail = (status, code, message, extra = {}) => NextResponse.json({ success: false, code, message, ...extra }, { status })
const LOCKED = 'Too many wrong tries. Tap “Resend code” to get a new one.'

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
        const pending = await PasswordReset.findOneAndUpdate(
            { email, codeHash: { $ne: null }, codeExpiresAt: { $gt: now }, attempts: { $lt: MAX_ATTEMPTS } },
            { $inc: { attempts: 1 } },
            { new: true }
        )

        if (!pending) {
            const existing = await PasswordReset.findOne({ email }).lean()
            if (!existing) return fail(400, 'NO_PENDING', 'This reset request has expired. Please start again.')
            if (existing.codeHash && existing.attempts >= MAX_ATTEMPTS) return fail(429, 'OTP_LOCKED', LOCKED)
            if (!existing.codeHash && existing.resetTokenHash) return fail(400, 'OTP_USED', 'This code was already used. Request a new one to start again.')
            return fail(400, 'OTP_EXPIRED', 'This code has expired. Tap “Resend code” to get a new one.')
        }

        if (!codeMatches(email, code, pending.codeHash, 'reset')) {
            const attemptsLeft = Math.max(0, MAX_ATTEMPTS - pending.attempts)
            if (attemptsLeft === 0) return fail(429, 'OTP_LOCKED', LOCKED)
            return fail(400, 'OTP_INVALID', `That code isn't right. ${attemptsLeft} ${attemptsLeft === 1 ? 'try' : 'tries'} left.`, { attemptsLeft })
        }

        // Use the code up and hand out the reset token in one step, so a code
        // submitted twice only ever yields one token.
        const { token, hash } = newResetToken()
        const tokenExpiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)
        const claimed = await PasswordReset.findOneAndUpdate(
            { _id: pending._id, codeHash: pending.codeHash },
            {
                $set: {
                    codeHash: null,
                    codeExpiresAt: null,
                    resetTokenHash: hash,
                    resetTokenExpiresAt: tokenExpiresAt,
                    purgeAt: new Date(Math.max(new Date(pending.purgeAt).getTime(), tokenExpiresAt.getTime())),
                },
            },
            { new: true }
        )
        if (!claimed) return fail(409, 'NO_PENDING', 'This code was already used. Please start again.')

        return NextResponse.json({ success: true, resetToken: token, expiresInSec: RESET_TOKEN_TTL_MINUTES * 60 })
    } catch (error) {
        console.error('Reset verify error:', error.message)
        return fail(500, 'SERVER_ERROR', 'Server error while checking the code')
    }
}
