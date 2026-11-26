import User from '@/lib/models/User'

/** New usernames: 3–30 letters, numbers, dot, dash or underscore. */
export const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Is `username` used (case-insensitively) by an account other than `exceptEmail`'s? */
export async function usernameTaken(username, exceptEmail) {
    const other = await User.findOne({ username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') } })
        .select('email')
        .lean()
    return Boolean(other && other.email !== exceptEmail)
}
