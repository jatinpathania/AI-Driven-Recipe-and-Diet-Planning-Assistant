/**
 * One-time reset tokens for the "forgot password" flow. The right email code
 * is traded for one of these (POST /api/auth/password/verify), and the new
 * password is only accepted with it (POST /api/auth/password/reset).
 *
 * The token is 32 random bytes; only its SHA-256 lands in the database, so a
 * leak can't be replayed. It works once and for RESET_TOKEN_TTL_MINUTES.
 */

import crypto from 'node:crypto'

export const RESET_TOKEN_TTL_MINUTES = 15
export const PASSWORD_MIN = 6
export const PASSWORD_MAX = 128

export const hashResetToken = (token) => crypto.createHash('sha256').update(String(token || '')).digest('hex')

export const newResetToken = () => {
    const token = crypto.randomBytes(32).toString('base64url')
    return { token, hash: hashResetToken(token) }
}
