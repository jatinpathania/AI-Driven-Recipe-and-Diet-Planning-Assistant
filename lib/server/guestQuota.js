import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { getToken } from 'next-auth/jwt'

/**
 * Server side of the "3 free prompts, then sign in" rule.
 *
 * The count lives in an HMAC-signed, httpOnly cookie, so editing localStorage
 * or the cookie value in devtools doesn't reset it. Clearing all site data
 * does — this is a sign-up nudge, not a billing control, and keying on IP
 * would lock out whole offices and campuses sharing one address.
 *
 * Signed-in callers are recognised from the token alone (no DB round-trip), so
 * a slow or offline Mongo never demotes a real user to the guest limit.
 */

export const GUEST_PROMPT_LIMIT = 3
const COOKIE = 'flavour_gq'
const MAX_AGE = 60 * 60 * 24 * 30

const secret = () => process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'flavour-dev-secret'

const sign = (n) => crypto.createHmac('sha256', secret()).update(`gq:${n}`).digest('base64url').slice(0, 22)

export const readGuestCount = (request) => {
    const raw = request.cookies?.get?.(COOKIE)?.value
    if (!raw) return 0
    const [n, mac] = raw.split('.')
    const count = parseInt(n, 10)
    if (!Number.isFinite(count) || count < 0 || !mac) return 0

    const a = Buffer.from(mac)
    const b = Buffer.from(sign(count))
    // A tampered value counts as no cookie. Deleting the cookie resets it
    // anyway, and treating it as "spent" would lock every guest out the day
    // the signing secret rotates.
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return 0
    return count
}

export const writeGuestCount = (response, count) => {
    response.cookies.set(COOKIE, `${count}.${sign(count)}`, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: MAX_AGE,
    })
}

export const quotaPayload = (used) => ({
    limit: GUEST_PROMPT_LIMIT,
    used: Math.min(used, GUEST_PROMPT_LIMIT),
    remaining: Math.max(0, GUEST_PROMPT_LIMIT - used),
})

/** True when the request carries a valid email-login JWT or a NextAuth session. */
export const isSignedInRequest = async (request) => {
    const header = request.headers.get('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (token && token !== 'null' && token !== 'undefined' && process.env.JWT_SECRET) {
        try {
            jwt.verify(token, process.env.JWT_SECRET)
            return true
        } catch {
            // expired or forged — fall through to the NextAuth cookie
        }
    }

    try {
        const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
        return !!(session?.id || session?.email)
    } catch {
        return false
    }
}
