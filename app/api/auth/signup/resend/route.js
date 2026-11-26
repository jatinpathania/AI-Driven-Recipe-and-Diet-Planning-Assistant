import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/connectDB'
import PendingSignup from '@/lib/models/PendingSignup'
import { codeSentPayload, issueCode, normalizeEmail, resendWait } from '@/lib/auth/otp'

/**
 * POST /api/auth/signup/resend  body: { email }
 *
 * Emails a new code for a sign-up in progress (the old code stops working).
 * Limited to one per RESEND_COOLDOWN_SECONDS and MAX_SENDS per sign-up.
 */
export async function POST(request) {
    let body
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 })
    }
    const email = normalizeEmail(body?.email)
    if (!email) return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })

    try {
        await connectDB()
        const pending = await PendingSignup.findOne({ email })
        if (!pending) {
            return NextResponse.json(
                { success: false, code: 'NO_PENDING', message: 'This sign-up has expired. Please fill in the form again.' },
                { status: 400 }
            )
        }

        const wait = resendWait(pending)
        if (wait > 0) {
            return NextResponse.json(
                { success: false, code: 'COOLDOWN', message: `Please wait ${wait}s before asking for another code.`, resendInSec: wait },
                { status: 429 }
            )
        }

        const sent = await issueCode(pending)
        if (!sent.ok) return NextResponse.json({ success: false, message: sent.message }, { status: sent.status })

        return NextResponse.json({ ...codeSentPayload(pending), message: `New code sent to ${email}.` })
    } catch (error) {
        console.error('Signup resend error:', error.message)
        return NextResponse.json({ success: false, message: 'Server error while sending the code' }, { status: 500 })
    }
}
