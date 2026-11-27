/**
 * Find a real photo of a dish and keep a copy in Cloudinary. Server-only.
 *
 * Two free, keyless sources of openly licensed photos are searched together:
 *   - Wikimedia Commons  (https://commons.wikimedia.org/w/api.php)
 *   - Openverse          (https://api.openverse.org, Flickr and other CC collections,
 *                         limited to licences that allow commercial use and edits)
 *
 * A result only counts if its title names the dish. When the full name finds
 * nothing ("Spinach and Egg Fried Rice"), shorter forms are tried
 * ("Egg Fried Rice", "Fried Rice", ...).
 *
 * The chosen image is copied to Cloudinary right away, cropped to 4:3 at
 * 800×600 (the size the recipe cards use), so it never breaks if the
 * original moves.
 */

import crypto from 'node:crypto'
import { uploadFromUrl } from '@/lib/config/cloudinary'

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'
const OPENVERSE_API = 'https://api.openverse.org/v1/images/'
// Both APIs ask callers to identify themselves with a descriptive User-Agent.
const USER_AGENT = 'RecipePhotoLookup/1.0 (dish photos for a recipe app)'
const MAX_UPLOAD_TRIES = 4
const REQUEST_TIMEOUT_MS = 10000

// Words that don't describe what the dish looks like.
const FILLER = new Set([
    'a', 'an', 'and', 'the', 'of', 'in', 'on', 'with', 'style', 'recipe', 'easy', 'quick', 'homemade',
    'healthy', 'simple', 'classic', 'best', 'perfect', 'my', 'special', 'instant', 'tasty',
])

/** Dish name as typed, trimmed to something sensible for a search. */
export const cleanDishName = (name) =>
    String(name || '')
        .replace(/[^\p{L}\p{N}\s&'(),.-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80)

/** Cache key: same dish, same key ("Potato Curry" = "potato  curry!"). */
export const dishKey = (name) => cleanDishName(name).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

// "potatoes" → "potato", "eggs" → "egg", "brownies" → "brownie"; "glass" stays.
const singular = (w) => (w.endsWith('oes') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)

const words = (text) =>
    String(text || '')
        .toLowerCase()
        .replace(/\.(jpe?g|png|webp|tiff?)$/i, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .split(' ')
        .filter((w) => w && !FILLER.has(w))
        .map(singular)

/**
 * Searches from most to least specific, e.g. "Spinach and Egg Fried Rice" →
 * [spinach egg fried rice] [egg fried rice] [fried rice]. It stops at two
 * words: one word alone ("qwerty", "special") finds anything at all.
 */
const searchLadder = (dish) => {
    const all = words(dish)
    const beforeWith = words(dish.split(/\bwith\b/i)[0])
    const tries = [all, beforeWith, all.slice(-3), all.slice(-2)]
    const seen = new Set()
    return tries.filter((t) => {
        const k = t.join(' ')
        if (!k || seen.has(k)) return false
        seen.add(k)
        return true
    })
}

const goodSize = (w, h) => {
    if (!w || !h) return false
    const ratio = w / h
    return w >= 500 && h >= 350 && ratio >= 0.75 && ratio <= 2.2
}

const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)

async function getJson(url) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
    if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status}`)
    return res.json()
}

async function searchCommons(query) {
    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        generator: 'search',
        gsrsearch: `${query} filetype:bitmap`,
        gsrnamespace: '6', // File: pages
        gsrlimit: '12',
        prop: 'imageinfo',
        iiprop: 'url|size|mime|extmetadata',
        iiextmetadatafilter: 'LicenseShortName|Artist',
        iiurlwidth: '1200', // a ready-made 1200px copy instead of the camera original
    })
    const data = await getJson(`${COMMONS_API}?${params}`)
    return Object.values(data?.query?.pages || {})
        .sort((a, b) => (a.index || 0) - (b.index || 0))
        .map((p) => {
            const info = p.imageinfo?.[0] || {}
            return {
                title: String(p.title || '').replace(/^File:/, ''),
                imageUrl: info.thumburl || info.url,
                width: info.width,
                height: info.height,
                photo: info.mime === 'image/jpeg',
                sourceUrl: info.descriptionurl || null,
                sourceDomain: 'commons.wikimedia.org',
                license: info.extmetadata?.LicenseShortName?.value || null,
                creator: stripHtml(info.extmetadata?.Artist?.value) || null,
            }
        })
}

async function searchOpenverse(query) {
    const params = new URLSearchParams({
        q: query,
        page_size: '20',
        license_type: 'commercial,modification',
        category: 'photograph',
        mature: 'false',
    })
    const data = await getJson(`${OPENVERSE_API}?${params}`)
    return (data?.results || []).map((r) => ({
        title: r.title || '',
        imageUrl: r.url,
        width: r.width,
        height: r.height,
        photo: !/\.(svg|gif)(\?|$)/i.test(r.url || ''),
        sourceUrl: r.foreign_landing_url || null,
        sourceDomain: r.source || r.provider || 'openverse.org',
        license: r.license ? `CC ${String(r.license).toUpperCase()} ${r.license_version || ''}`.trim() : null,
        creator: r.creator || null,
    }))
}

/**
 * Results whose title names every word of the query, best match first:
 * a title that is mostly the dish ("Potato curry") beats one that only
 * mentions it ("Cauliflower and potato curry with rice").
 */
const relevant = (results, queryWords) =>
    results
        .filter((r) => r.imageUrl && /^https:\/\//i.test(r.imageUrl) && r.photo && goodSize(Number(r.width), Number(r.height)))
        .map((r) => {
            const titleWords = new Set(words(r.title))
            const hits = queryWords.filter((w) => titleWords.has(w)).length
            return { ...r, score: hits === queryWords.length ? queryWords.length / Math.max(titleWords.size, 1) : 0 }
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)

/**
 * Search, pick the best matching photo and copy it to Cloudinary.
 * @returns {Promise<{ url, publicId, sourceUrl, sourceDomain, license, creator } | null>}
 *   null when nothing usable turned up. Throws only if every search failed
 *   (network down, both sites refusing), so that isn't remembered as "no photo".
 */
export async function findDishPhoto(name) {
    const dish = cleanDishName(name)
    if (!dish) return null

    let answered = false
    let candidates = []
    for (const queryWords of searchLadder(dish)) {
        const query = queryWords.join(' ')
        const settled = await Promise.allSettled([searchCommons(query), searchOpenverse(query)])
        const results = []
        for (const s of settled) {
            if (s.status === 'fulfilled') {
                answered = true
                results.push(...s.value)
            } else {
                console.warn('Recipe photo search failed:', s.reason?.message || s.reason)
            }
        }
        candidates = relevant(results, queryWords)
        if (candidates.length) break
    }
    if (!answered) throw new Error('Every photo search failed')

    const slug = dishKey(dish).replace(/\s+/g, '-').slice(0, 60) || 'dish'
    const suffix = crypto.createHash('sha1').update(dishKey(dish)).digest('hex').slice(0, 8)

    for (const img of candidates.slice(0, MAX_UPLOAD_TRIES)) {
        try {
            const copy = await uploadFromUrl(img.imageUrl, {
                folder: 'flavour_ai/recipe_photos',
                public_id: `${slug}-${suffix}`,
                overwrite: true,
                format: 'jpg',
                transformation: [{ width: 800, height: 600, crop: 'fill', gravity: 'auto', quality: 'auto:good' }],
            })
            return {
                url: copy.url,
                publicId: copy.public_id,
                sourceUrl: img.sourceUrl || img.imageUrl,
                sourceDomain: img.sourceDomain,
                license: img.license,
                creator: img.creator,
            }
        } catch (error) {
            // Gone, blocked, or not an image after all: try the next one.
            console.warn('Recipe photo copy failed, trying the next result:', error?.message || error)
        }
    }
    return null
}
