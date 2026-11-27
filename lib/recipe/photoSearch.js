/**
 * Find a real photo of a dish with Google Images and keep a copy in Cloudinary.
 * Server-only.
 *
 * Google's own Custom Search API is closed to new users (and shuts down on
 * 2027-01-01), so Google Images results come through Serper
 * (https://serper.dev, env SERPER_API_KEY), which returns them as JSON.
 *
 * The chosen image is copied to Cloudinary right away: links to images on
 * other sites break or get hotlink-blocked over time, the copy doesn't. It is
 * also cropped to 4:3 at 800×600, the size the recipe cards use.
 */

import crypto from 'node:crypto'
import { uploadFromUrl } from '@/lib/config/cloudinary'

const SERPER_IMAGES_URL = 'https://google.serper.dev/images'
const MAX_UPLOAD_TRIES = 4

// Stock sites (watermarks), video thumbnails and social posts make poor recipe photos.
const SKIP_SOURCES =
    /(shutterstock|istockphoto|gettyimages|alamy|dreamstime|123rf|depositphotos|freepik|vecteezy|stock\.adobe|canstockphoto|bigstockphoto|pond5|ytimg|youtube|fbcdn|facebook|instagram|tiktok|lookaside)/i

const serperKey = () => (process.env.SERPER_API_KEY || '').trim()

export const photosConfigured = () => Boolean(serperKey())

/** Dish name as typed, trimmed to something sensible for a search. */
export const cleanDishName = (name) =>
    String(name || '')
        .replace(/[^\p{L}\p{N}\s&'(),.-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80)

/** Cache key: same dish, same key ("Potato Curry" = "potato  curry!"). */
export const dishKey = (name) => cleanDishName(name).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

const usable = (img) => {
    const url = img?.imageUrl
    if (!url || !/^https:\/\//i.test(url) || /\.(svg|gif)(\?|$)/i.test(url)) return false
    if (SKIP_SOURCES.test(`${img.domain || ''} ${img.link || ''} ${url}`)) return false
    const w = Number(img.imageWidth) || 0
    const h = Number(img.imageHeight) || 0
    if (!w || !h) return true // size unknown: let Cloudinary try
    const ratio = w / h
    return w >= 500 && h >= 350 && ratio >= 0.75 && ratio <= 2.2
}

async function searchGoogleImages(query) {
    const res = await fetch(SERPER_IMAGES_URL, {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey(), 'Content-Type': 'application/json' },
        // 10 results cost one search credit; more would cost two.
        body: JSON.stringify({ q: query, gl: 'in', hl: 'en', num: 10 }),
        signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
        const err = new Error(`Image search failed (${res.status})`)
        err.status = res.status
        throw err
    }
    const data = await res.json().catch(() => null)
    return Array.isArray(data?.images) ? data.images : []
}

/**
 * Search, pick the best usable result and copy it to Cloudinary.
 * @returns {Promise<{ url: string, publicId: string, sourceUrl: string, sourceDomain: string } | null>}
 *   null when nothing usable turned up. Throws if the search itself fails.
 */
export async function findDishPhoto(name) {
    const dish = cleanDishName(name)
    if (!dish) return null

    const results = await searchGoogleImages(`${dish} recipe`)
    const candidates = results.filter(usable).slice(0, MAX_UPLOAD_TRIES)

    const slug = dishKey(dish).replace(/\s+/g, '-').slice(0, 60) || 'dish'
    const suffix = crypto.createHash('sha1').update(dishKey(dish)).digest('hex').slice(0, 8)

    for (const img of candidates) {
        try {
            const copy = await uploadFromUrl(img.imageUrl, {
                folder: 'flavour_ai/recipe_photos',
                public_id: `${slug}-${suffix}`,
                overwrite: true,
                format: 'jpg',
                transformation: [{ width: 800, height: 600, crop: 'fill', gravity: 'auto', quality: 'auto:good' }],
            })
            return { url: copy.url, publicId: copy.public_id, sourceUrl: img.imageUrl, sourceDomain: img.domain || '' }
        } catch (error) {
            // Hotlink-protected, gone, or not an image: try the next result.
            console.warn('Recipe photo copy failed, trying the next result:', error?.message || error)
        }
    }
    return null
}
