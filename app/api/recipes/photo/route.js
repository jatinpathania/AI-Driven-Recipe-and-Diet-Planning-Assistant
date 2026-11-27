import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/connectDB'
import RecipePhoto from '@/lib/models/RecipePhoto'
import { cleanDishName, dishKey, findDishPhoto } from '@/lib/recipe/photoSearch'

/**
 * GET /api/recipes/photo?name=Potato%20Curry
 *
 * A real photo for a dish, found once on Wikimedia Commons / Openverse
 * (lib/recipe/photoSearch.js, no API key), copied to Cloudinary and
 * remembered for every later request of the same dish.
 *
 * → 200 { success: true, url }                 found (or already known)
 * → 200 { success: true, url: null, reason }   reason: NOT_FOUND, DAILY_LIMIT
 *
 * Open to guests too (their recipes live in the browser), so new searches are
 * capped per day to go easy on the free APIs; cached dishes are never capped.
 */

const DAILY_NEW_SEARCHES = 150
const RETRY_NOT_FOUND_AFTER_MS = 7 * 24 * 60 * 60 * 1000

const ok = (body, cacheSeconds = 0) =>
    NextResponse.json(
        { success: true, ...body },
        cacheSeconds ? { headers: { 'Cache-Control': `private, max-age=${cacheSeconds}` } } : undefined
    )

export async function GET(request) {
    const name = cleanDishName(new URL(request.url).searchParams.get('name'))
    if (!name) return NextResponse.json({ success: false, message: 'Dish name is required' }, { status: 400 })
    const key = dishKey(name)

    try {
        await connectDB()

        const cached = await RecipePhoto.findOne({ key }).lean()
        if (cached?.status === 'found' && cached.url) return ok({ url: cached.url }, 86400)
        if (cached?.status === 'none' && Date.now() - new Date(cached.searchedAt).getTime() < RETRY_NOT_FOUND_AFTER_MS) {
            return ok({ url: null, reason: 'NOT_FOUND' })
        }

        const startOfDay = new Date()
        startOfDay.setUTCHours(0, 0, 0, 0)
        if ((await RecipePhoto.countDocuments({ searchedAt: { $gte: startOfDay } })) >= DAILY_NEW_SEARCHES) {
            return ok({ url: null, reason: 'DAILY_LIMIT' })
        }

        const photo = await findDishPhoto(name)
        await RecipePhoto.updateOne(
            { key },
            {
                $set: {
                    name,
                    status: photo ? 'found' : 'none',
                    url: photo?.url || null,
                    publicId: photo?.publicId || null,
                    sourceUrl: photo?.sourceUrl || null,
                    sourceDomain: photo?.sourceDomain || null,
                    license: photo?.license || null,
                    creator: photo?.creator || null,
                    searchedAt: new Date(),
                },
            },
            { upsert: true }
        )

        return photo ? ok({ url: photo.url }, 86400) : ok({ url: null, reason: 'NOT_FOUND' })
    } catch (error) {
        // Searches unreachable: not cached, so the next visit tries again.
        console.error('Recipe photo error:', error?.message || error)
        return NextResponse.json({ success: false, message: 'Could not find a photo right now' }, { status: 502 })
    }
}
