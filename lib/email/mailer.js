/**
 * Send email over SMTP with nodemailer. Defaults to Gmail, which delivers to
 * any address without owning a domain (about 500 emails a day).
 * Server-only: the password must never reach the browser.
 *
 * Env:
 *   SMTP_USER         the mailbox that sends, e.g. you@gmail.com
 *   SMTP_PASS         for Gmail, a 16-character App Password (not your normal
 *                     password): myaccount.google.com/apppasswords, which
 *                     needs 2-Step Verification turned on
 *   EMAIL_FROM_NAME   optional display name, default "Flavour AI"
 *   EMAIL_REPLY_TO    optional reply-to address
 *   SMTP_HOST         optional, default smtp.gmail.com
 *   SMTP_PORT         optional, default 465 (TLS); 587 uses STARTTLS
 *
 * Without SMTP_USER/SMTP_PASS in development, nothing is sent; the text is
 * printed to the server console instead so sign-up can still be tested.
 */

import nodemailer from 'nodemailer'

const TIMEOUT_MS = 15000

const clean = (v) => (v || '').trim().replace(/^["']|["']$/g, '')

export const emailConfigured = () => Boolean(clean(process.env.SMTP_USER) && clean(process.env.SMTP_PASS))

let transport = null
let transportKey = ''

const getTransport = () => {
    const host = clean(process.env.SMTP_HOST) || 'smtp.gmail.com'
    const port = Number(clean(process.env.SMTP_PORT)) || 465
    const user = clean(process.env.SMTP_USER)
    // Google shows App Passwords in groups of four ("abcd efgh ijkl mnop").
    const pass = clean(process.env.SMTP_PASS).replace(/\s+/g, '')
    const key = `${host}:${port}:${user}:${pass}`
    if (!transport || key !== transportKey) {
        transport = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
            connectionTimeout: TIMEOUT_MS,
            greetingTimeout: TIMEOUT_MS,
            socketTimeout: TIMEOUT_MS,
        })
        transportKey = key
    }
    return transport
}

/**
 * @param {{ to: string, subject: string, html: string, text: string, attachments?: object[], devLog?: string }} msg
 *   attachments: nodemailer attachments, e.g. inline images referenced by cid:
 *   devLog: what to print in development when SMTP isn't set (e.g. the code)
 * @returns {Promise<{ ok: true, id?: string, dev?: boolean } | { ok: false, error: string, status?: number }>}
 */
export async function sendEmail({ to, subject, html, text, attachments, devLog }) {
    if (!emailConfigured()) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`[email:dev] SMTP_USER/SMTP_PASS are not set, so nothing was sent. To: ${to} | ${subject}${devLog ? ` | ${devLog}` : ''}`)
            return { ok: true, dev: true }
        }
        return { ok: false, error: 'SMTP_USER and SMTP_PASS are not configured' }
    }

    const replyTo = clean(process.env.EMAIL_REPLY_TO)
    try {
        const info = await getTransport().sendMail({
            // Gmail only sends as the signed-in mailbox, so the address is always SMTP_USER.
            from: { name: clean(process.env.EMAIL_FROM_NAME) || 'Flavour AI', address: clean(process.env.SMTP_USER) },
            to,
            subject,
            html,
            text,
            ...(attachments?.length ? { attachments } : {}),
            ...(replyTo ? { replyTo } : {}),
        })
        return { ok: true, id: info.messageId }
    } catch (error) {
        // Never log the recipient or the body.
        const authFailed = error.code === 'EAUTH' || error.responseCode === 535
        console.error(
            'SMTP error:',
            error.code || '',
            authFailed ? 'login rejected; for Gmail, SMTP_PASS must be an App Password' : error.message
        )
        return { ok: false, error: error.message, status: error.responseCode }
    }
}
