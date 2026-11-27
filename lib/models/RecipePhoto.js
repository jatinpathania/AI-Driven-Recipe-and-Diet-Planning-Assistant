import mongoose from 'mongoose'

/**
 * One photo per dish name, shared by everyone (see app/api/recipes/photo).
 * The first time a dish is asked for, an openly licensed photo is found on
 * Wikimedia Commons / Openverse and copied to Cloudinary; every later request
 * for the same dish reuses it, so each dish is searched once at most.
 *
 * status "none" remembers that nothing usable was found, so the search isn't
 * repeated for a while.
 */
const recipePhotoSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true }, // normalised dish name
        name: { type: String, default: '' }, // as first asked for
        status: { type: String, enum: ['found', 'none'], required: true },
        url: { type: String, default: null }, // Cloudinary copy
        publicId: { type: String, default: null },
        sourceUrl: { type: String, default: null }, // the original's page, for credit
        sourceDomain: { type: String, default: null },
        license: { type: String, default: null }, // e.g. "CC BY-SA 4.0"
        creator: { type: String, default: null },
        searchedAt: { type: Date, required: true },
    },
    { timestamps: true }
)

recipePhotoSchema.index({ searchedAt: 1 })

export default mongoose.models.RecipePhoto || mongoose.model('RecipePhoto', recipePhotoSchema)
