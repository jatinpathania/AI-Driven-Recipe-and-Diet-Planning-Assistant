import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/connectDB'
import Recipe from '@/lib/models/Recipe'
import { parseIngredientsToRecipe } from '@/lib/ai/kitchen'
import { retrieveReferences } from '@/lib/ai/retrieve'
import { verifyAuth } from '@/lib/middleware/auth'
import {
    GUEST_PROMPT_LIMIT,
    isSignedInRequest,
    quotaPayload,
    readGuestCount,
    writeGuestCount,
} from '@/lib/server/guestQuota'

/**
 * POST /api/chat/generate-recipe  body: { ingredients, preferences? }
 *
 * Counts against the guest allowance like any other AI prompt. Signed-in
 * users get the recipe saved to their account; the owner now comes from the
 * verified token rather than a userId the client could set to anyone's.
 */
export async function POST(request) {
    let body
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }

    const ingredients = typeof body?.ingredients === 'string' ? body.ingredients.trim() : ''
    if (!ingredients) return NextResponse.json({ message: 'Ingredients are required' }, { status: 400 })

    const signedIn = await isSignedInRequest(request)
    const used = signedIn ? 0 : readGuestCount(request)
    if (!signedIn && used >= GUEST_PROMPT_LIMIT) {
        return NextResponse.json(
            { code: 'GUEST_LIMIT', message: 'Sign in to keep generating recipes.', quota: quotaPayload(used) },
            { status: 403 }
        )
    }

    // Every guest prompt counts, answered or not (same rule as /api/chat).
    const nextUsed = signedIn ? used : used + 1

    const prefs = body.preferences && typeof body.preferences === 'object' ? body.preferences : {}
    const references = await retrieveReferences(ingredients.slice(0, 500), prefs)
    const result = await parseIngredientsToRecipe(ingredients, prefs, { references })
    if (!result.success) {
        const failed = NextResponse.json(
            {
                success: false,
                message: result.message,
                ...(result.offTopic ? { code: 'OFF_TOPIC' } : {}),
                ...(signedIn ? {} : { quota: quotaPayload(nextUsed) }),
            },
            // Off-topic input is the request's fault, not the AI's.
            { status: result.offTopic ? 422 : 502 }
        )
        if (!signedIn) writeGuestCount(failed, nextUsed)
        return failed
    }

    let savedRecipe = null
    if (signedIn) {
        try {
            await connectDB()
            const user = await verifyAuth(request)
            if (user) {
                savedRecipe = await Recipe.create({ ...result.recipe, userId: user._id, originalPrompt: ingredients })
            }
        } catch (error) {
            // Saving is a bonus; the user still gets their recipe.
            console.error('Could not save generated recipe:', error.message)
        }
    }

    const response = NextResponse.json(
        {
            success: true,
            recipe: result.recipe,
            savedRecipe,
            ...(signedIn ? {} : { quota: quotaPayload(nextUsed) }),
        },
        { status: savedRecipe ? 201 : 200 }
    )
    if (!signedIn) writeGuestCount(response, nextUsed)
    return response
}
