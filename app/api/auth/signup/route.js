import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/connectDB'
import User from '@/lib/models/User'
import PendingSignup from '@/lib/models/PendingSignup'
import {
    PENDING_TTL_MINUTES, codeSentPayload, isValidEmail, issueCode, normalizeEmail, resendWait,
} from '@/lib/auth/otp'
import { USERNAME_RE, usernameTaken } from '@/lib/auth/username'

/**
 * POST /api/auth/signup  body: { username, fullName, email, password }
 *
 * Step 1 of 2. Validates the form and emails a 6-digit code; the account is
 * only created when that code is entered (POST /api/auth/signup/verify).
 *
 * → 200 { success, otpRequired: true, email, codeLength, expiresInSec, resendInSec, message }
 *
 * Submitting the form again within the resend cooldown keeps the code that
 * was already sent (so an impatient double-click doesn't invalidate it), but
 * saves any edited details.
 */

const bad = (message, status = 400, extra = {}) => NextResponse.json({ success: false, message, ...extra }, { status })

export async function POST(request) {
    let body
    try {
        body = await request.json()
    } catch {
        return bad('Invalid request')
    }

    const username = String(body?.username || '').trim()
    const fullName = String(body?.fullName || '').trim().slice(0, 80)
    const email = normalizeEmail(body?.email)
    const password = String(body?.password || '')

    if (!username || !email || !password) return bad('Please provide all required fields')
    if (!USERNAME_RE.test(username)) return bad('Username must be 3–30 characters: letters, numbers, dot, dash or underscore')
    if (!isValidEmail(email)) return bad('Please enter a valid email address')
    if (password.length < 6) return bad('Password must be at least 6 characters')
    if (password.length > 128) return bad('Password is too long')

    try {
        await connectDB()

        const existing = await User.findOne({ email }).select('authMethods password').lean()
        if (existing && (existing.authMethods?.includes('email') || existing.password)) {
            return bad('An account with this email already exists. Please sign in instead.', 400, { code: 'EMAIL_EXISTS' })
        }
        // A Google-only account keeps its username when email sign-in is added.
        if (!existing && (await usernameTaken(username, email))) {
            return bad('That username is taken. Try another one.', 400, { code: 'USERNAME_TAKEN' })
        }

        const passwordHash = await bcrypt.hash(password, 10)
        let pending = await PendingSignup.findOne({ email })

        if (pending) {
            pending.username = username
            pending.fullName = fullName || username
            pending.passwordHash = passwordHash
            const stillValid = pending.codeHash && pending.codeExpiresAt && new Date(pending.codeExpiresAt).getTime() > Date.now()
            if (stillValid && resendWait(pending) > 0) {
                await pending.save()
                return NextResponse.json({ ...codeSentPayload(pending), message: `We already sent a code to ${email}. Check your inbox.` })
            }
        } else {
            pending = new PendingSignup({
                email,
                username,
                fullName: fullName || username,
                passwordHash,
                purgeAt: new Date(Date.now() + PENDING_TTL_MINUTES * 60 * 1000),
            })
        }

        const sent = await issueCode(pending)
        if (!sent.ok) return bad(sent.message, sent.status)

        return NextResponse.json({ ...codeSentPayload(pending), message: `We sent a 6-digit code to ${email}.` })
    } catch (error) {
        // Two submits racing to create the same pending sign-up.
        if (error?.code === 11000) return bad('Please try again.', 409)
        console.error('Signup error:', error.message)
        return bad('Server error during signup', 500)
    }
}
