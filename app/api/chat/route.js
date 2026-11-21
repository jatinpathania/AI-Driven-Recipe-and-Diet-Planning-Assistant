import { NextResponse } from 'next/server'
import { generateRecipeSuggestions, estimateCalories, planDay } from '@/lib/ai/kitchen'
import { buildSearchQuery, retrieveReferences } from '@/lib/ai/retrieve'
import {
    GUEST_PROMPT_LIMIT,
    isSignedInRequest,
    quotaPayload,
    readGuestCount,
    writeGuestCount,
} from '@/lib/server/guestQuota'

/**
 * POST /api/chat
 *
 * body: { message, history?, mode?: 'chat' | 'estimate' | 'plan', preferences?, portion?, day? }
 *
 * Every mode is an AI prompt, so for guests every mode draws from the same
 * free allowance. A guest past the limit gets 403 { code: 'GUEST_LIMIT' }
 * and the client opens the sign-in gate.
 *
 * The route used to connect to Mongo and attach the three newest recipes in
 * the whole database — anyone's — whenever a message contained "recipe" or
 * "cook". Those cards had nothing to do with the answer and leaked other
 * users' recipe names, so they are gone. Chat answers are now grounded in
 * the public KnowledgeDoc collection instead (lib/ai/retrieve.js), which
 * holds curated content only, never users' recipes.
 *
 * The assistant only answers food and cooking questions; anything else
 * comes back as { success: true, offTopic: true, message: <refusal> }.
 */

const sanitizePrefs = (p) => {
    if (!p || typeof p !== 'object') return {}
    return {
        diet: typeof p.diet === 'string' ? p.diet : undefined,
        avoid: Array.isArray(p.avoid) ? p.avoid.filter((a) => typeof a === 'string') : undefined,
        skill: typeof p.skill === 'string' ? p.skill : undefined,
        units: typeof p.units === 'string' ? p.units : undefined,
        maxCookTime: Number(p.maxCookTime) || undefined,
    }
}

export async function POST(request) {
    let body
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }

    const mode = ['chat', 'estimate', 'plan'].includes(body?.mode) ? body.mode : 'chat'
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    if (!message) return NextResponse.json({ message: 'Message is required' }, { status: 400 })
    if (message.length > 2000) return NextResponse.json({ message: 'Message is too long' }, { status: 413 })

    const signedIn = await isSignedInRequest(request)
    const used = signedIn ? 0 : readGuestCount(request)

    if (!signedIn && used >= GUEST_PROMPT_LIMIT) {
        return NextResponse.json(
            {
                code: 'GUEST_LIMIT',
                message: `You've used your ${GUEST_PROMPT_LIMIT} free prompts. Sign in to keep cooking with AI.`,
                quota: quotaPayload(used),
            },
            { status: 403 }
        )
    }

    const prefs = sanitizePrefs(body.preferences)
    let result
    let status = 200

    try {
        if (mode === 'estimate') {
            result = await estimateCalories(message, body.portion)
        } else if (mode === 'plan') {
            result = await planDay(message, prefs)
        } else {
            // RAG: ground the answer in the public knowledge base. Fails open,
            // so a slow or empty search just means an answer without notes.
            const references = await retrieveReferences(buildSearchQuery(message, body.history), prefs)
            result = await generateRecipeSuggestions(message, body.history, prefs, { references })
        }
    } catch (error) {
        console.error('Chat route error:', error)
        result = { success: false, message: 'Something went wrong talking to the AI' }
        status = 500
    }

    // Every prompt a guest sends counts, answered or not, so "3 free prompts"
    // means three sends, exactly as the guest sees it.
    const nextUsed = signedIn ? used : used + 1
    const payload = {
        ...result,
        error: undefined,
        ...(signedIn ? {} : { quota: quotaPayload(nextUsed) }),
    }

    const response = NextResponse.json(payload, { status })
    if (!signedIn) writeGuestCount(response, nextUsed)
    return response
}
