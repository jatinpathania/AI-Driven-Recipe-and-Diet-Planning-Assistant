import { NextResponse } from 'next/server'
import { planWeekFromVegetables } from '@/lib/ai/kitchen'
import {
    GUEST_PROMPT_LIMIT,
    isSignedInRequest,
    quotaPayload,
    readGuestCount,
    writeGuestCount,
} from '@/lib/server/guestQuota'

/**
 * POST /api/chat/plan-week
 *
 * body: { vegetables: string[], staples?: string[], days: string[], preferences? }
 *   vegetables  what the user bought ("Potato", "Palak", or anything typed in)
 *   staples     pantry items the plan may also use ("Rice", "Wheat flour (atta)")
 *   days        labels of the days to plan, in order ("Saturday", "Sunday", ...), max 7
 *
 * → { success, days: [{ Breakfast, Lunch, Dinner }], fixed, dropped }
 *   Each dish is { name, emoji, calories, uses }. Dishes that would need a
 *   vegetable the user didn't pick are repaired or dropped server-side.
 *
 * One plan counts as one prompt against the guest allowance.
 */

const strings = (v, max, len = 40) =>
    (Array.isArray(v) ? v : []).filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim().slice(0, len)).slice(0, max)

const sanitizePrefs = (p) => {
    if (!p || typeof p !== 'object') return {}
    return {
        diet: typeof p.diet === 'string' ? p.diet : undefined,
        avoid: Array.isArray(p.avoid) ? p.avoid.filter((a) => typeof a === 'string') : undefined,
        skill: typeof p.skill === 'string' ? p.skill : undefined,
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

    const vegetables = strings(body?.vegetables, 40)
    const staples = strings(body?.staples, 20)
    const days = strings(body?.days, 7, 20)
    if (!vegetables.length) return NextResponse.json({ success: false, message: 'Pick at least one vegetable.' }, { status: 400 })
    if (!days.length) return NextResponse.json({ success: false, message: 'Pick at least one day to plan.' }, { status: 400 })

    const signedIn = await isSignedInRequest(request)
    const used = signedIn ? 0 : readGuestCount(request)
    if (!signedIn && used >= GUEST_PROMPT_LIMIT) {
        return NextResponse.json(
            { code: 'GUEST_LIMIT', message: 'Sign in to plan your week with AI.', quota: quotaPayload(used) },
            { status: 403 }
        )
    }
    const nextUsed = signedIn ? used : used + 1

    let result
    try {
        result = await planWeekFromVegetables({ vegetables, staples, days, prefs: sanitizePrefs(body.preferences) })
    } catch (error) {
        console.error('Week plan error:', error)
        result = { success: false, message: 'Something went wrong planning the week.' }
    }

    const response = NextResponse.json(
        { ...result, error: undefined, ...(signedIn ? {} : { quota: quotaPayload(nextUsed) }) },
        { status: result.success ? 200 : 502 }
    )
    if (!signedIn) writeGuestCount(response, nextUsed)
    return response
}
