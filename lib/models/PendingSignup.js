import mongoose from 'mongoose'

/**
 * A sign-up waiting for its email to be verified. The real User is only
 * created once the emailed code is entered (app/api/auth/signup/verify).
 *
 * The password is stored already hashed (bcrypt) and the code only as an
 * HMAC, so a database leak exposes neither. MongoDB deletes the document by
 * itself at `purgeAt` (TTL index), so abandoned sign-ups clean themselves up.
 */
const pendingSignupSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        username: { type: String, required: true, trim: true },
        fullName: { type: String, default: '' },
        passwordHash: { type: String, required: true },

        codeHash: { type: String, default: null }, // null once used up or invalidated
        codeExpiresAt: { type: Date, default: null },
        attempts: { type: Number, default: 0 }, // wrong guesses against the current code
        sendCount: { type: Number, default: 0 }, // codes emailed for this sign-up
        lastSentAt: { type: Date, default: null },

        purgeAt: { type: Date, required: true },
    },
    { timestamps: true }
)

pendingSignupSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.PendingSignup || mongoose.model('PendingSignup', pendingSignupSchema)
