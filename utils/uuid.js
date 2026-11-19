// Small UUID v4 helper.
//
// We used to import the `uuid` package here, but it was never declared in
// package.json — it only resolved because something else pulled it in. A clean
// `npm ci` would therefore crash the whole app, since GuestUserProvider wraps
// every page. crypto.randomUUID covers every modern browser; the fallback keeps
// non-secure-context origins (plain http on a LAN IP) working.
export const uuidv4 = () => {
    if (typeof crypto !== 'undefined') {
        if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()

        if (typeof crypto.getRandomValues === 'function') {
            const bytes = crypto.getRandomValues(new Uint8Array(16))
            bytes[6] = (bytes[6] & 0x0f) | 0x40
            bytes[8] = (bytes[8] & 0x3f) | 0x80
            const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
            return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
        }
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

export default uuidv4
