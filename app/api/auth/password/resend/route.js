import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/connectDB'
import User from '@/lib/models/User'
import PasswordReset from '@/lib/models/PasswordReset'
import { codeSentPayload, issueCode, normalizeEmail, resendWait } from '@/lib/auth/otp'

/**
 * POST /api/auth/password/resend  body: { email }
 *
 * Emails a new reset code (the old one stops working). Limited to one per
 * RESEND_COOLDOWN_SECONDS and MAX_SENDS per request.
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
    if (!email) return bad('Email is required')

    try {
        await connectDB()
        const pending = await PasswordReset.findOne({ email })
        if (!pending) return bad('This reset request has expired. Please start again.', 400, { code: 'NO_PENDING' })

        const wait = resendWait(pending)
        if (wait > 0) return bad(`Please wait ${wait}s before asking for another code.`, 429, { code: 'COOLDOWN', resendInSec: wait })

        const user = await User.findOne({ email }).select('fullName username').lean()
        if (!user) {
            await PasswordReset.deleteOne({ _id: pending._id })
            return bad("We couldn't find an account with that email.", 404, { code: 'NO_ACCOUNT' })
        }

        pending.resetTokenHash = null
        pending.resetTokenExpiresAt = null
        const sent = await issueCode(pending, { purpose: 'reset', name: user.fullName || user.username })
        if (!sent.ok) return bad(sent.message, sent.status)

        return NextResponse.json({ ...codeSentPayload(pending), message: `New code sent to ${email}.` })
    } catch (error) {
        console.error('Reset resend error:', error.message)
        return bad('Server error while sending the code', 500)
    }
}
