/**
 * Google Gemini client (REST, no SDK), used by lib/ai/kitchen.js.
 *
 *  - 2 attempts with a 20s timeout; only transient failures (network,
 *    429, 5xx) are retried, so a bad key fails immediately.
 *  - Thinking is kept to a minimum: these are short, formatted answers,
 *    and thinking tokens cost seconds and eat the output budget.
 *  - Prompts and replies are never logged.
 *
 * Default model: gemini-3.5-flash-lite. Measured against this key on
 * 2026-11-16, it answered in about 1s; the full flash models took 8–25s or
 * returned 503 "high demand", and gemini-2.5-flash is closed to new keys.
 *
 * Env:
 *   GEMINI_API_KEY   required
 *   GEMINI_MODEL     optional, defaults to gemini-3.5-flash-lite
 *   GEMINI_API_URL   optional, points the client at a proxy or a local mock
 */

const API = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta'
const MODEL = (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim()
const TIMEOUT_MS = 20000
const MAX_ATTEMPTS = 2

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Trimmed and unquoted, so a stray space or quotes in .env don't break the key.
const apiKey = () => (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '')

// Gemini 2.5 takes a token budget (0 = off); Gemini 3+ takes a level.
const THINKING = /^gemini-2\.5/.test(MODEL) ? { thinkingBudget: 0 } : { thinkingLevel: 'minimal' }

/**
 * @param {object} opts
 * @param {string} opts.system         system instruction
 * @param {{role: 'user'|'assistant', content: string}[]} opts.messages
 * @param {number} [opts.maxTokens]
 * @param {number} [opts.temperature]
 * @param {boolean} [opts.json]        ask for a raw JSON response
 * @returns {Promise<{text: string|null, error?: string, status?: number}>}
 */
export async function generate({ system, messages, maxTokens = 300, temperature = 0.7, json = false }) {
    const key = apiKey()
    if (!key) return { text: null, error: 'GEMINI_API_KEY is missing in environment variables.', status: 0 }

    const body = {
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents: messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        })),
        generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            ...(json ? { responseMimeType: 'application/json' } : {}),
            thinkingConfig: THINKING,
        },
    }
    let thinkingDropped = false

    let lastError = 'Unknown error'
    let lastStatus = 0

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

        try {
            const response = await fetch(`${API}/models/${MODEL}:generateContent`, {
                method: 'POST',
                headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal,
            })
            clearTimeout(timeout)
            const data = await response.json().catch(() => null)

            if (response.ok) {
                const candidate = data?.candidates?.[0]
                const text = candidate?.content?.parts?.map((p) => p.text || '').join('').trim()
                if (text) return { text }
                lastError = candidate?.finishReason ? `No text (finish reason: ${candidate.finishReason})` : 'Empty response from model'
                lastStatus = response.status
                break
            }

            lastError = data?.error?.message || `HTTP ${response.status}`
            lastStatus = response.status

            // Some models (e.g. gemini-3.8-flash) reject the minimal thinking
            // level. Retry once without it, with room for the thinking tokens.
            if (response.status === 400 && !thinkingDropped && /thinking/i.test(lastError)) {
                thinkingDropped = true
                delete body.generationConfig.thinkingConfig
                body.generationConfig.maxOutputTokens = maxTokens + 1536
                attempt--
                continue
            }
            if (response.status !== 429 && response.status < 500) break
        } catch (error) {
            clearTimeout(timeout)
            lastError = error.name === 'AbortError' ? `Timed out after ${TIMEOUT_MS / 1000}s` : error.message
        }

        if (attempt < MAX_ATTEMPTS) await sleep(1200)
    }

    console.error('Gemini API error:', lastStatus || '', lastError)
    return { text: null, error: lastError, status: lastStatus }
}

/** User-facing copy for a failed call: config problems say so instead of "busy". */
export function failureMessage(result, fallback) {
    if (result.error?.includes('GEMINI_API_KEY')) return 'The AI isn’t configured yet — add GEMINI_API_KEY to your .env file.'
    // Gemini answers a bad key with 400 "API key not valid"; 401/403 cover revoked or restricted keys.
    if (result.status === 401 || result.status === 403 || (result.status === 400 && /api key/i.test(result.error || ''))) {
        return 'The AI key was rejected — check GEMINI_API_KEY in your .env file.'
    }
    if (result.status === 429) return 'The AI is at its usage limit right now — try again in a minute.'
    return fallback
}
