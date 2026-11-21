import mongoose from 'mongoose'

/** Name of the Atlas Vector Search index on `embedding`. */
export const VECTOR_INDEX = 'knowledge_vector'

/**
 * The AI's cooking knowledge base (RAG). Public, curated content only —
 * never users' saved recipes, so retrieval can't leak one user's data into
 * another user's answer.
 *
 * Filled by `npm run knowledge:build` from data/knowledge/*.json.
 * `embedding` is a 768-number vector from gemini-embedding-001; it is
 * excluded from queries by default because nothing outside search needs it.
 */
const knowledgeDocSchema = new mongoose.Schema(
    {
        // Stable id from the seed file, so re-running the build updates in place.
        slug: { type: String, required: true, unique: true },
        kind: { type: String, enum: ['recipe', 'tip'], required: true },
        title: { type: String, required: true },
        // The snippet handed to the model, and the text that was embedded.
        text: { type: String, required: true },
        // Diets the dish satisfies, e.g. ['vegetarian', 'vegan']. Empty for tips.
        diets: { type: [String], default: [] },
        tags: { type: [String], default: [] },
        source: { type: String, default: 'curated' },
        embedding: { type: [Number], select: false },
        // Hash of `text`, so the build only re-embeds documents that changed.
        textHash: { type: String },
        embedModel: { type: String },
    },
    { timestamps: true }
)

export default mongoose.models.KnowledgeDoc || mongoose.model('KnowledgeDoc', knowledgeDocSchema)
