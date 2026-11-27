/**
 * Email one-time codes, for sign-up and for resetting a forgotten password.
 *
 *  - 6 digits from crypto.randomInt (not Math.random).
 *  - Stored as an HMAC keyed with the server secret and bound to the email
 *    and the purpose, so a code for one address (or one flow) can never
 *    verify another, and the database never holds a usable code.
 *  - Compared in constant time.
 */

import crypto from 'node:crypto'
import { sendEmail } from '@/lib/email/mailer'
import { renderOtpEmail } from '@/lib/email/templates/otpEmail'

export const OTP_LENGTH = 6
export const OTP_TTL_MINUTES = 10
export const RESEND_COOLDOWN_SECONDS = 60
export const MAX_ATTEMPTS = 5 // wrong guesses per code
export const MAX_SENDS = 5 // codes per sign-up before it has to wait
export const PENDING_TTL_MINUTES = 60 // how long an unfinished sign-up is kept

const secret = () => {
    const s = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
    if (!s) throw new Error('JWT_SECRET (or NEXTAUTH_SECRET) must be set to sign verification codes')
    return s
}

export const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254

export const generateCode = () => String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0')

// Sign-up codes keep their original, unprefixed form so codes already sent stay valid.
export const hashCode = (email, code, purpose = 'signup') =>
    crypto
        .createHmac('sha256', secret())
        .update(`${purpose === 'signup' ? '' : `${purpose}:`}${normalizeEmail(email)}:${code}`)
        .digest('hex')

export const codeMatches = (email, code, storedHash, purpose = 'signup') => {
    if (!storedHash || !/^\d{6}$/.test(String(code || ''))) return false
    const a = Buffer.from(hashCode(email, String(code), purpose), 'hex')
    const b = Buffer.from(storedHash, 'hex')
    return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/** Seconds until another code may be sent for this pending sign-up (0 = now). */
export const resendWait = (pending, now = Date.now()) => {
    if (!pending?.lastSentAt) return 0
    const left = RESEND_COOLDOWN_SECONDS - Math.floor((now - new Date(pending.lastSentAt).getTime()) / 1000)
    return Math.max(0, left)
}

/**
 * Issue a fresh code for `pending` (a PendingSignup or PasswordReset), save
 * it, and email it.
 * Returns { ok: true } or { ok: false, status, message } for the route to send back.
 *
 * @param {object} pending
 * @param {{ purpose?: 'signup' | 'reset', name?: string }} [opts]
 */
export async function issueCode(pending, { purpose = 'signup', name } = {}) {
    if (pending.sendCount >= MAX_SENDS) {
        return { ok: false, status: 429, message: 'Too many codes requested for this email. Please try again in an hour.' }
    }

    const code = generateCode()
    const now = Date.now()
    pending.codeHash = hashCode(pending.email, code, purpose)
    pending.codeExpiresAt = new Date(now + OTP_TTL_MINUTES * 60 * 1000)
    pending.attempts = 0
    pending.sendCount += 1
    pending.lastSentAt = new Date(now)
    pending.purgeAt = new Date(now + PENDING_TTL_MINUTES * 60 * 1000)
    await pending.save()

    const { subject, html, text, attachments } = renderOtpEmail({
        name: name || pending.fullName || pending.username,
        code,
        minutes: OTP_TTL_MINUTES,
        appUrl: process.env.APP_URL || process.env.NEXTAUTH_URL || '',
        purpose,
    })
    const sent = await sendEmail({ to: pending.email, subject, html, text, attachments, devLog: `${purpose} code ${code}` })
    if (sent.ok) return { ok: true }

    // The code never arrived, so don't hold it against the cooldown or the send limit.
    await pending.constructor.updateOne(
        { _id: pending._id },
        { $set: { codeHash: null, codeExpiresAt: null, lastSentAt: null }, $inc: { sendCount: -1 } }
    )
    return { ok: false, status: 502, message: "We couldn't send the verification email. Please try again in a moment." }
}

/** Response fields every "code sent" reply shares. */
export const codeSentPayload = (pending) => ({
    success: true,
    otpRequired: true,
    email: pending.email,
    codeLength: OTP_LENGTH,
    expiresInSec: pending.codeExpiresAt ? Math.max(0, Math.floor((new Date(pending.codeExpiresAt).getTime() - Date.now()) / 1000)) : 0,
    resendInSec: resendWait(pending),
})
