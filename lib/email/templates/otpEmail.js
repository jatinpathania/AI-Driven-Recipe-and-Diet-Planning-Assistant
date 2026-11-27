/**
 * One-time code email ("Verify your email" for sign-up, "Reset your password"
 * for a forgotten password), styled like the sign-in
 * page: deep green night, emerald accent, the Flavour AI mascot.
 *
 * Email clients ignore <style> blocks and modern CSS, so this is table
 * layout with inline styles only, and a plain-text version for clients that
 * don't render HTML. The logo travels inside the email as a cid attachment
 * (see assets/logo.js), so it needs no hosted URL.
 *
 * Fonts: Apple Mail, iOS Mail and Outlook for Mac load the web fonts below.
 * Gmail and Outlook for Windows ignore web fonts, so each stack falls back to
 * a close system font: Rockwell or Georgia for the slab headings (like the
 * logo's lettering), Segoe UI or Helvetica for text.
 */

import { LOGO_CID, LOGO_PNG_BASE64 } from '../assets/logo.js'

const C = {
    page: '#051108',
    card: '#0b1710',
    cardBorder: '#1c3324',
    band: '#0f2a19',
    brand: '#10b981',
    brandBright: '#34d399',
    text: '#f3f4f6',
    muted: '#9ab3a3',
    faint: '#5f7769',
    digitBg: '#0f2418',
    digitBorder: '#245c3b',
}

const FONT = "'Poppins', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif"
const SLAB = "'Roboto Slab', Rockwell, 'Rockwell Extra Bold', Georgia, 'Times New Roman', serif"
const MONO = "'Roboto Mono', 'SF Mono', Menlo, Consolas, 'Courier New', monospace"
const FONTS_URL =
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&family=Roboto+Mono:wght@700&family=Roboto+Slab:wght@700;800&display=swap'

const escapeHtml = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])

// Wording per reason for the code; the layout is shared.
const COPY = {
    signup: {
        subject: (code) => `${code} is your Flavour.AI verification code`,
        heading: 'Verify your email',
        intro: 'Welcome to the kitchen! Enter this code on the sign-up page to finish creating your Flavour.AI account.',
        safety: "Didn't try to sign up? You can safely ignore this email. Nobody can use your address without this code. For your safety, we'll never ask you to share it.",
        textIntro: 'Welcome to Flavour.AI! Enter this code on the sign-up page to finish creating your account:',
        textSafety: "Didn't try to sign up? You can safely ignore this email. Never share this code with anyone.",
    },
    reset: {
        subject: (code) => `${code} is your Flavour.AI password reset code`,
        heading: 'Reset your password',
        intro: 'We got a request to reset your Flavour.AI password. Enter this code on the reset page to choose a new one.',
        safety: "Didn't ask to reset your password? You can safely ignore this email; your password stays the same. For your safety, we'll never ask you to share this code.",
        textIntro: 'Enter this code on the Flavour.AI reset page to choose a new password:',
        textSafety: "Didn't ask for this? Ignore this email; your password stays the same. Never share this code with anyone.",
    },
}

/**
 * @param {{ name?: string, code: string, minutes: number, appUrl?: string, purpose?: 'signup' | 'reset' }} opts
 * @returns {{ subject: string, html: string, text: string, attachments: object[] }}
 */
export function renderOtpEmail({ name, code, minutes, appUrl, purpose = 'signup' }) {
    const copy = COPY[purpose] || COPY.signup
    const first = String(name || '').trim().split(/\s+/)[0] || 'there'
    const safeName = escapeHtml(first)
    const digits = String(code).split('')
    const year = new Date().getFullYear()
    const site = appUrl ? appUrl.replace(/\/+$/, '') : ''

    const subject = copy.subject(code)

    const digitCells = digits
        .map(
            (d) => `<td align="center" valign="middle" style="width:46px;height:58px;background:${C.digitBg};border:1px solid ${C.digitBorder};border-radius:12px;font-family:${MONO};font-size:28px;line-height:58px;font-weight:700;color:${C.brandBright};">${escapeHtml(d)}</td>`
        )
        .join(`<td style="width:8px;font-size:0;line-height:0;">&nbsp;</td>`)

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${escapeHtml(subject)}</title>
<link href="${FONTS_URL}" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page};">Your code is ${escapeHtml(code)}. It expires in ${minutes} minutes.&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

        <!-- Wordmark -->
        <tr>
          <td align="center" style="padding:0 0 20px;font-family:${SLAB};font-size:24px;line-height:1.2;font-weight:800;">
            <span style="color:#dcfce7;">Flavour</span><span style="color:${C.brandBright};">.AI</span>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:${C.card};border:1px solid ${C.cardBorder};border-radius:24px;overflow:hidden;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="background:${C.band};background-image:linear-gradient(135deg,#1a4d2e 0%,#0d2715 60%,${C.card} 100%);padding:30px 24px 24px;">
                  <img src="cid:${LOGO_CID}" width="88" height="88" alt="Flavour AI" style="display:block;margin:0 auto;width:88px;height:88px;border:0;outline:none;text-decoration:none;font-family:${FONT};font-size:14px;color:${C.brandBright};">
                  <h1 style="margin:16px 0 0;font-family:${SLAB};font-size:26px;line-height:1.3;font-weight:800;color:${C.text};letter-spacing:0.2px;">${copy.heading}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:26px 28px 8px;font-family:${FONT};">
                  <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:${C.text};">Hi ${safeName},</p>
                  <p style="margin:0;font-size:15px;line-height:1.65;color:${C.muted};">${copy.intro}</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:22px 16px 6px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>${digitCells}</tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:14px 28px 4px;font-family:${FONT};">
                  <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:rgba(16,185,129,0.12);font-size:13px;font-weight:600;color:${C.brandBright};">⏱ Expires in ${minutes} minutes</span>
                </td>
              </tr>
              <tr>
                <td style="padding:22px 28px 28px;font-family:${FONT};">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="border-top:1px solid ${C.cardBorder};font-size:0;line-height:0;">&nbsp;</td></tr>
                  </table>
                  <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${C.faint};">${copy.safety}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:22px 16px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.faint};">
            Cook smart. Eat smart. Live healthy.<br>
            ${site ? `<a href="${escapeHtml(site)}" style="color:${C.brand};text-decoration:none;">${escapeHtml(site.replace(/^https?:\/\//, ''))}</a> · ` : ''}© ${year} Flavour.AI
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`

    const text = [
        `Hi ${first},`,
        '',
        copy.textIntro,
        '',
        `    ${code}`,
        '',
        `It expires in ${minutes} minutes.`,
        '',
        copy.textSafety,
        '',
        `— Flavour.AI${site ? ` · ${site}` : ''}`,
    ].join('\n')

    // Inline logo referenced by cid: in the HTML.
    const attachments = [
        {
            filename: 'flavour-ai.png',
            content: Buffer.from(LOGO_PNG_BASE64, 'base64'),
            contentType: 'image/png',
            cid: LOGO_CID,
            contentDisposition: 'inline',
        },
    ]

    return { subject, html, text, attachments }
}
