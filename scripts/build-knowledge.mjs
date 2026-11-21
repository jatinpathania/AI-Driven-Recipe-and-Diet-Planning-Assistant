/**
 * Build the AI's knowledge base (RAG).
 *
 *   npm run knowledge:build                    # data/knowledge/*.json
 *   npm run knowledge:build -- more.json       # plus extra files
 *   npm run knowledge:build -- --prune         # also delete entries no longer in the files
 *
 * Each file is { "kind": "recipe" | "tip", "items": [...] } (see
 * data/knowledge/). For every item the script builds the snippet text the
 * model will see, embeds it with gemini-embedding-001 and upserts it into
 * the KnowledgeDoc collection. Unchanged items are skipped, so re-running is
 * cheap. Finally it makes sure the Atlas Vector Search index exists; without
 * it, retrieval falls back to an in-memory scan, which also works.
 *
 * Needs MONGODB_URI and GEMINI_API_KEY in .env.
 */

import './load-env.mjs'
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import mongoose from 'mongoose'
import KnowledgeDoc, { VECTOR_INDEX } from '../lib/models/KnowledgeDoc.js'
import { embed, EMBED_MODEL, EMBED_DIMS } from '../lib/ai/gemini.js'

const DATA_DIR = path.resolve('data/knowledge')
// Free tier allows ~100 embedding requests a minute; stay under it.
const PACE_MS = 700
const MAX_TEXT = 900

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16)

/** vegan ⇒ vegetarian ⇒ pescatarian, so a pescatarian user still gets veggie dishes. */
const expandDiets = (diets = []) => {
    const set = new Set(diets.map((d) => String(d).toLowerCase()))
    if (set.has('vegan')) set.add('vegetarian')
    if (set.has('vegetarian')) set.add('pescatarian')
    return [...set]
}

const recipeText = (r) => {
    const facts = [
        r.calories && `${r.calories} kcal`,
        r.protein && `${r.protein}g protein`,
        r.time && `${r.time} min`,
        r.servings && `serves ${r.servings}`,
    ].filter(Boolean)
    const diets = (r.diets || []).length ? ` Diet: ${r.diets.join(', ')}.` : ''
    const steps = (r.steps || []).map((s, i) => `${i + 1}) ${s}`).join(' ')
    return `${r.title} (${facts.join(' | ')}, per serving).${diets} Ingredients: ${(r.ingredients || []).join('; ')}. Steps: ${steps}`
}

const tipText = (t) => `${t.title}: ${t.text}`

async function loadEntries(extraFiles) {
    const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith('.json')).map((f) => path.join(DATA_DIR, f))
    files.push(...extraFiles.map((f) => path.resolve(f)))

    const entries = []
    const seen = new Set()
    for (const file of files) {
        const json = JSON.parse(await readFile(file, 'utf8'))
        if (!['recipe', 'tip'].includes(json.kind) || !Array.isArray(json.items)) {
            throw new Error(`${file}: expected { "kind": "recipe" | "tip", "items": [...] }`)
        }
        for (const item of json.items) {
            if (!item.slug || !item.title) throw new Error(`${file}: every item needs a slug and a title`)
            if (seen.has(item.slug)) throw new Error(`${file}: duplicate slug "${item.slug}"`)
            seen.add(item.slug)

            const diets = json.kind === 'recipe' ? expandDiets(item.diets) : []
            const text = json.kind === 'recipe' ? recipeText({ ...item, diets: item.diets || [] }) : tipText(item)
            if (text.length > MAX_TEXT) console.warn(`  ! ${item.slug}: ${text.length} chars, the prompt keeps the first ${MAX_TEXT}`)
            entries.push({
                slug: item.slug,
                kind: json.kind,
                title: item.title,
                text,
                diets,
                tags: item.tags || [],
                source: item.source || path.basename(file, '.json'),
            })
        }
    }
    return entries
}

async function embedWithRetry(entry) {
    for (let attempt = 1; attempt <= 4; attempt++) {
        const result = await embed(entry.text, { taskType: 'RETRIEVAL_DOCUMENT', title: entry.title, timeoutMs: 20000 })
        if (result.values) return result.values
        // Retry rate limits, server errors and network failures (no status);
        // a bad key or bad request won't fix itself.
        const transient = result.status === undefined || result.status === 429 || result.status >= 500
        if (!transient) throw new Error(`${entry.slug}: ${result.error}`)
        const wait = result.status === 429 ? 30000 * attempt : 3000 * attempt
        console.warn(`  … ${entry.slug}: ${result.error}; retrying in ${wait / 1000}s`)
        await sleep(wait)
    }
    throw new Error(`${entry.slug}: embedding kept failing`)
}

async function ensureVectorIndex() {
    const collection = KnowledgeDoc.collection
    try {
        const existing = await collection.listSearchIndexes(VECTOR_INDEX).toArray()
        if (existing.length) {
            const idx = existing[0]
            console.log(`Vector index "${VECTOR_INDEX}": ${idx.status || 'exists'}${idx.queryable ? ' (queryable)' : ''}`)
            return
        }
        await collection.createSearchIndex({
            name: VECTOR_INDEX,
            type: 'vectorSearch',
            definition: {
                fields: [{ type: 'vector', path: 'embedding', numDimensions: EMBED_DIMS, similarity: 'cosine' }],
            },
        })
        console.log(`Created vector index "${VECTOR_INDEX}". Atlas builds it in about a minute; until then retrieval uses the in-memory scan.`)
    } catch (error) {
        console.warn(`Could not create the vector index automatically (${error.message}).`)
        console.warn('Retrieval still works through the in-memory scan. To add it by hand: Atlas → your cluster →')
        console.warn(`Atlas Search → Create Search Index → Vector Search, collection "${collection.collectionName}", name "${VECTOR_INDEX}", JSON:`)
        console.warn(JSON.stringify({ fields: [{ type: 'vector', path: 'embedding', numDimensions: EMBED_DIMS, similarity: 'cosine' }] }))
    }
}

async function main() {
    const args = process.argv.slice(2)
    const prune = args.includes('--prune')
    const extraFiles = args.filter((a) => !a.startsWith('--'))

    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing from .env')
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing from .env')

    const entries = await loadEntries(extraFiles)
    console.log(`Loaded ${entries.length} entries from ${DATA_DIR}${extraFiles.length ? ` + ${extraFiles.length} file(s)` : ''}`)

    await mongoose.connect(process.env.MONGODB_URI)
    await KnowledgeDoc.init() // builds the unique slug index

    const existing = new Map(
        (await KnowledgeDoc.find({}, 'slug textHash embedModel').lean()).map((d) => [d.slug, d])
    )

    let embedded = 0
    let unchanged = 0
    let updatedMeta = 0
    for (const entry of entries) {
        const textHash = hash(entry.text)
        const prior = existing.get(entry.slug)
        const meta = { kind: entry.kind, title: entry.title, text: entry.text, diets: entry.diets, tags: entry.tags, source: entry.source }

        if (prior && prior.textHash === textHash && prior.embedModel === EMBED_MODEL) {
            // Text unchanged: keep the vector, refresh the filters.
            // timestamps: false, or updatedAt alone would count as a change.
            const res = await KnowledgeDoc.updateOne({ slug: entry.slug }, { $set: meta }, { timestamps: false })
            if (res.modifiedCount) updatedMeta++
            else unchanged++
            continue
        }

        const embedding = await embedWithRetry(entry)
        await KnowledgeDoc.updateOne(
            { slug: entry.slug },
            { $set: { ...meta, embedding, textHash, embedModel: EMBED_MODEL } },
            { upsert: true }
        )
        embedded++
        process.stdout.write(`  ✓ ${entry.slug}\n`)
        await sleep(PACE_MS)
    }

    let pruned = 0
    if (prune) {
        const keep = entries.map((e) => e.slug)
        pruned = (await KnowledgeDoc.deleteMany({ slug: { $nin: keep } })).deletedCount
    }

    console.log(`Done: ${embedded} embedded, ${updatedMeta} metadata-only updates, ${unchanged} unchanged${prune ? `, ${pruned} pruned` : ''}.`)
    await ensureVectorIndex()
}

main()
    .catch((error) => {
        console.error('Knowledge build failed:', error.message)
        process.exitCode = 1
    })
    .finally(() => mongoose.disconnect())
