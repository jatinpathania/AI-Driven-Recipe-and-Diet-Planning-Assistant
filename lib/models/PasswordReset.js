import mongoose from 'mongoose'

/**
 * A "forgot password" request in progress (app/api/auth/password/*).
 *
 *  1. forgot  emails a 6-digit code (stored only as an HMAC, see lib/auth/otp.js)
 *  2. verify  trades the right code for a one-time reset token (stored only
 *             as a SHA-256 hash), valid for RESET_TOKEN_TTL_MINUTES
 *  3. reset   uses that token once to set the new password, and the document
 *             is deleted
 *
 * MongoDB deletes abandoned requests by itself at `purgeAt` (TTL index).
 */
const passwordResetSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },

        codeHash: { type: String, default: null }, // null once used up or invalidated
        codeExpiresAt: { type: Date, default: null },
        attempts: { type: Number, default: 0 }, // wrong guesses against the current code
        sendCount: { type: Number, default: 0 }, // codes emailed for this request
        lastSentAt: { type: Date, default: null },

        resetTokenHash: { type: String, default: null },
        resetTokenExpiresAt: { type: Date, default: null },

        purgeAt: { type: Date, required: true },
    },
    { timestamps: true }
)

passwordResetSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.PasswordReset || mongoose.model('PasswordReset', passwordResetSchema)
