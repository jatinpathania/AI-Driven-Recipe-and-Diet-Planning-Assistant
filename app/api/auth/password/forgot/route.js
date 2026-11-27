import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/connectDB'
import User from '@/lib/models/User'
import PasswordReset from '@/lib/models/PasswordReset'
import { PENDING_TTL_MINUTES, codeSentPayload, isValidEmail, issueCode, normalizeEmail, resendWait } from '@/lib/auth/otp'

/**
 * POST /api/auth/password/forgot  body: { email }
 *
 * Step 1 of 3. Emails a 6-digit code to the account's address.
 *
 * → 200 { success, otpRequired: true, email, codeLength, expiresInSec, resendInSec, message }
 * Errors carry a `code`: NO_ACCOUNT.
 *
 * Asking again within the resend cooldown keeps the code already sent, so a
 * double-click doesn't invalidate it. Sign-up already tells whether an email
 * has an account, so saying so here gives nothing new away.
 */

const bad = (message, status = 400, extra = {}) => NextResponse.json({ success: false, message, ...extra }, { status })

export async function POST(request) {
    let body
    try {
        body = await request.json()
    } catch {
        return bad('Invalid request')
    }
    const email = normalizeEmail(body?.email)
    if (!email) return bad('Please enter your email')
    if (!isValidEmail(email)) return bad('Please enter a valid email address')

    try {
        await connectDB()

        const user = await User.findOne({ email }).select('fullName username').lean()
        if (!user) {
            return bad("We couldn't find an account with that email. Check the spelling, or create an account.", 404, { code: 'NO_ACCOUNT' })
        }

        let pending = await PasswordReset.findOne({ email })
        if (pending) {
            const stillValid = pending.codeHash && pending.codeExpiresAt && new Date(pending.codeExpiresAt).getTime() > Date.now()
            if (stillValid && resendWait(pending) > 0) {
                return NextResponse.json({ ...codeSentPayload(pending), message: `We already sent a code to ${email}. Check your inbox.` })
            }
        } else {
            pending = new PasswordReset({ email, purgeAt: new Date(Date.now() + PENDING_TTL_MINUTES * 60 * 1000) })
        }

        // A new code cancels any reset token handed out for an earlier one.
        pending.resetTokenHash = null
        pending.resetTokenExpiresAt = null

        const sent = await issueCode(pending, { purpose: 'reset', name: user.fullName || user.username })
        if (!sent.ok) return bad(sent.message, sent.status)

        return NextResponse.json({ ...codeSentPayload(pending), message: `We sent a 6-digit code to ${email}.` })
    } catch (error) {
        // Two requests racing to create the same reset.
        if (error?.code === 11000) return bad('Please try again.', 409)
        console.error('Forgot password error:', error.message)
        return bad('Server error while sending the code', 500)
    }
}
