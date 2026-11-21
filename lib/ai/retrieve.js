/**
 * RAG retrieval: find the knowledge-base entries closest to a question and
 * return them as short text snippets for lib/ai/kitchen.js to put in the
 * prompt.
 *
 *  - Searches only the KnowledgeDoc collection (public, curated content),
 *    never users' saved recipes.
 *  - Uses Atlas Vector Search when the `knowledge_vector` index exists and
 *    falls back to an in-memory cosine scan otherwise. The fallback is fine
 *    for a few thousand documents.
 *  - Fails open. A missing key, a slow embedding call or a DB error returns
 *    [] and the chat answers without references; retrieval never blocks a
 *    reply for more than RETRIEVE_TIMEOUT_MS.
 */

import connectDB from '@/lib/db/connectDB'
import KnowledgeDoc, { VECTOR_INDEX } from '@/lib/models/KnowledgeDoc'
import { embed } from '@/lib/ai/gemini'

const TOP_K = 4
// Cosine similarity below this is "not really about the question". Measured
// on the seed data (gemini-embedding-001, 768 dims, 2026-11-21): good matches
// scored 0.62–0.74, off-topic questions 0.45–0.53, and a dish the book
// doesn't have ("pizza dough") 0.55 against unrelated recipes.
const MIN_COSINE = 0.6
const RETRIEVE_TIMEOUT_MS = 5000
const SCAN_CACHE_MS = 10 * 60 * 1000
const SCAN_LIMIT = 5000
const VECTOR_RETRY_MS = 10 * 60 * 1000

let scanCache = null // { at, docs }
let vectorSearchOffUntil = 0

const cosine = (a, b) => {
    let dot = 0
    let na = 0
    let nb = 0
    const n = Math.min(a.length, b.length)
    for (let i = 0; i < n; i++) {
        dot += a[i] * b[i]
        na += a[i] * a[i]
        nb += b[i] * b[i]
    }
    return na && nb ? dot / Math.sqrt(na * nb) : 0
}

async function vectorSearch(queryVector) {
    if (Date.now() < vectorSearchOffUntil) return null
    try {
        const docs = await KnowledgeDoc.aggregate([
            { $vectorSearch: { index: VECTOR_INDEX, path: 'embedding', queryVector, numCandidates: 100, limit: 12 } },
            { $project: { kind: 1, title: 1, text: 1, diets: 1, score: { $meta: 'vectorSearchScore' } } },
        ])
        // An index that is still building (or a collection that's empty)
        // returns nothing; let the scan answer instead.
        if (!docs.length) return null
        // Atlas reports cosine as (1 + cos) / 2.
        return docs.map((d) => ({ ...d, similarity: 2 * d.score - 1 }))
    } catch (error) {
        // No index / not Atlas: stop trying for a while and use the scan.
        vectorSearchOffUntil = Date.now() + VECTOR_RETRY_MS
        console.warn('Vector search unavailable, using in-memory scan:', error.message)
        return null
    }
}

async function scan(queryVector) {
    if (!scanCache || Date.now() - scanCache.at > SCAN_CACHE_MS) {
        const docs = await KnowledgeDoc.find({ 'embedding.0': { $exists: true } })
            .select('+embedding kind title text diets')
            .limit(SCAN_LIMIT)
            .lean()
        scanCache = { at: Date.now(), docs }
    }
    return scanCache.docs
        .map((d) => ({ ...d, similarity: cosine(queryVector, d.embedding) }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 12)
}

/** Drop recipes that break the user's diet or contain something they avoid. */
const fitsPreferences = (doc, prefs = {}) => {
    if (doc.kind !== 'recipe') return true
    if (prefs.diet && !doc.diets?.includes(prefs.diet)) return false
    const text = doc.text.toLowerCase()
    const avoid = (Array.isArray(prefs.avoid) ? prefs.avoid : [])
        .map((a) => String(a).toLowerCase().trim())
        .filter((a) => a.length >= 3)
    return !avoid.some((a) => text.includes(a))
}

/**
 * A follow-up like "make it spicier" says nothing on its own, so short
 * messages are searched together with the previous user turn.
 */
export function buildSearchQuery(message, history = []) {
    const current = String(message || '').trim()
    if (current.length >= 60 || !Array.isArray(history)) return current
    const previous = [...history]
        .reverse()
        .find((m) => m && m.role !== 'ai' && m.role !== 'assistant' && typeof m.content === 'string' && m.content.trim())
    return previous ? `${previous.content.trim().slice(0, 300)}\n${current}` : current
}

async function search(query, prefs) {
    const { values, error } = await embed(query, { taskType: 'RETRIEVAL_QUERY', timeoutMs: RETRIEVE_TIMEOUT_MS - 1000 })
    if (!values) {
        if (error) console.warn('RAG embedding failed:', error)
        return []
    }
    await connectDB()
    const candidates = (await vectorSearch(values)) || (await scan(values))
    return candidates
        .filter((d) => d.similarity >= MIN_COSINE && fitsPreferences(d, prefs))
        .slice(0, TOP_K)
        .map((d) => d.text)
}

/**
 * @param {string} query   what to search for (see buildSearchQuery)
 * @param {object} [prefs] sanitized kitchen preferences ({ diet, avoid })
 * @returns {Promise<string[]>} up to TOP_K snippets, best match first
 */
export async function retrieveReferences(query, prefs = {}) {
    const q = String(query || '').trim()
    if (!q) return []
    let timer
    try {
        return await Promise.race([
            search(q.slice(0, 1000), prefs),
            new Promise((resolve) => {
                timer = setTimeout(() => resolve([]), RETRIEVE_TIMEOUT_MS)
            }),
        ])
    } catch (error) {
        console.warn('RAG retrieval failed:', error.message)
        return []
    } finally {
        clearTimeout(timer)
    }
}
