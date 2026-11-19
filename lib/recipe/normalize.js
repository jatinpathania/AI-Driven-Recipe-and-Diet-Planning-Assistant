/**
 * One recipe shape for the whole app.
 *
 * Recipes arrive from five places — the sample library, the AI chat (parsed
 * text), the recipe generator (JSON), the dashboard suggestions and the meal
 * plan — and each used its own field names: `steps` vs `instructions`,
 * calories as 450 or "520c", time as 25 or "25m". Every consumer then had its
 * own fallbacks. Normalising at the edges means the cook page, favourites,
 * the shopping list and the sidebar can all trust the same fields.
 */

import { recipeKey } from '@/lib/store/local'
import { stepText } from '@/lib/recipe/parse'

const toNumber = (v) => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null
    const m = String(v ?? '').match(/\d+(?:\.\d+)?/)
    return m ? Math.round(parseFloat(m[0])) : null
}

const toTime = (v) => {
    if (v == null || v === '') return ''
    if (typeof v === 'number') return `${v} min`
    const s = String(v).trim()
    // "25m" / "25" → "25 min"; leave "1 hr 10 min" alone
    if (/^\d+\s*m?$/i.test(s)) return `${parseInt(s, 10)} min`
    return s
}

const toList = (v) => {
    if (Array.isArray(v)) {
        return v
            .map((x) => (typeof x === 'string' ? x : x?.name || x?.item || stepText(x)))
            .map((x) => String(x || '').trim())
            .filter(Boolean)
    }
    if (typeof v === 'string') return v.split('\n').map((s) => s.trim()).filter(Boolean)
    return []
}

export const normalizeRecipe = (raw = {}) => {
    const name = String(raw.name || raw.recipeName || raw.title || 'Untitled recipe').trim()
    const steps = toList(raw.steps?.length ? raw.steps : raw.instructions)
    const protein = raw.protein == null ? '' : typeof raw.protein === 'number' ? `${raw.protein}g` : String(raw.protein)

    return {
        id: String(raw.id || raw._id || recipeKey(name) || Date.now()),
        key: recipeKey(name),
        name,
        emoji: raw.emoji || '🍽️',
        image: raw.image || raw.imageUrl || '',
        description: raw.description || raw.desc || '',
        time: toTime(raw.time ?? raw.cookTime),
        minutes: toNumber(raw.time ?? raw.cookTime),
        calories: toNumber(raw.calories),
        protein,
        difficulty: raw.difficulty || '',
        category: String(raw.category || 'dinner').toLowerCase(),
        ingredients: toList(raw.ingredients),
        steps,
    }
}

/**
 * Pull a recipe out of the compact text format the chat model is told to use:
 *
 *   Lemon Garlic Chicken
 *   380 kcal | 32g protein | 22 min
 *   Ingredients:
 *   - ...
 *   Steps:
 *   1. ...
 *
 * Returns null for anything that isn't clearly a recipe, so normal answers
 * render as prose.
 */
export const parseRecipeText = (text) => {
    if (!text || !/ingredients\s*:/i.test(text) || !/(steps|method|instructions)\s*:/i.test(text)) return null

    const lines = String(text).split('\n').map((l) => l.trim()).filter(Boolean)
    let title = ''
    let stats = ''
    let intro = ''
    let section = ''
    const ingredients = []
    const steps = []

    for (const line of lines) {
        const lower = line.toLowerCase().replace(/[*#]/g, '').trim()
        if (/^ingredients\s*:/.test(lower)) { section = 'ingredients'; continue }
        if (/^(steps|method|instructions)\s*:/.test(lower)) { section = 'steps'; continue }

        const clean = line.replace(/^[-•*]\s*|^\d+[.)]\s*/, '').replace(/\*\*/g, '').trim()
        if (!clean) continue

        if (section === 'ingredients') ingredients.push(clean)
        else if (section === 'steps') steps.push(clean)
        else if (!title) title = line.replace(/[*#]/g, '').trim()
        else if (!stats && /kcal|cal|protein|min|\|/i.test(line)) stats = line.replace(/\*\*/g, '')
        else intro = intro ? `${intro} ${clean}` : clean
    }

    if (!title || !ingredients.length || !steps.length) return null

    const parts = stats.split('|').map((s) => s.trim())
    const find = (re) => parts.find((p) => re.test(p)) || ''
    const caloriesPart = find(/kcal|cal/i) || parts[0] || ''
    const proteinPart = find(/protein|\dg\b/i)
    const timePart = find(/min|hr|hour/i)

    return normalizeRecipe({
        name: title.replace(/^recipe\s*(name)?\s*:\s*/i, ''),
        emoji: '🍳',
        calories: caloriesPart,
        protein: proteinPart.replace(/protein/i, '').trim(),
        time: timePart,
        description: intro,
        ingredients,
        steps,
        stats: parts.filter(Boolean),
    })
}

/** Seed library for a brand-new kitchen. */
export const SAMPLE_RECIPES = [
    {
        name: 'Pasta Carbonara', emoji: '🍝', time: 25, calories: 450, protein: 24, difficulty: 'Medium', category: 'dinner',
        image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=400&q=70',
        description: 'Silky eggs, pecorino, crisp pancetta.',
        diet: ['none', 'high-protein'],
        ingredients: ['200g Spaghetti', '3 Egg yolks', '50g Pecorino Romano', '100g Pancetta', '1 tsp Black pepper'],
        steps: [
            'Bring a large pot of well-salted water to a rolling boil.',
            'Fry the diced pancetta over medium heat until crisp, about 6 minutes.',
            'Whisk the egg yolks with grated pecorino and plenty of black pepper.',
            'Cook the spaghetti until al dente; keep half a cup of pasta water.',
            'Off the heat, toss pasta with the pancetta and its fat.',
            'Add the egg mix and toss fast, loosening with pasta water until glossy.',
        ],
    },
    {
        name: 'Avocado Toast', emoji: '🥑', time: 10, calories: 280, protein: 7, difficulty: 'Easy', category: 'breakfast',
        image: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=400&q=70',
        description: 'Crunchy sourdough, lemony avocado.',
        diet: ['none', 'vegetarian', 'vegan'],
        ingredients: ['2 slices Sourdough bread', '1 Avocado', '½ Lemon', '1 tsp Red pepper flakes', '1 tsp Flaky salt'],
        steps: [
            'Toast the sourdough until deeply golden.',
            'Mash the avocado coarsely with lemon juice and salt.',
            'Spread thickly and finish with chilli flakes and olive oil.',
        ],
    },
    {
        name: 'Chicken Stir Fry', emoji: '🥢', time: 20, calories: 380, protein: 34, difficulty: 'Easy', category: 'dinner',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=70',
        description: 'Fast, glossy, crunchy peppers.',
        diet: ['none', 'high-protein'],
        ingredients: ['300g Chicken breast', '2 Bell peppers', '3 tbsp Soy sauce', '20g Ginger', '3 Garlic cloves'],
        steps: [
            'Slice the chicken thinly and pat it dry.',
            'Sear the chicken in a smoking-hot wok for 3 minutes.',
            'Add garlic and ginger and stir for 30 seconds.',
            'Toss in the peppers for 2 minutes, then the soy sauce. Serve.',
        ],
    },
    {
        name: 'Greek Salad', emoji: '🥗', time: 15, calories: 220, protein: 9, difficulty: 'Easy', category: 'lunch',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=70',
        description: 'Tomato, cucumber, a slab of feta.',
        diet: ['none', 'vegetarian', 'keto'],
        ingredients: ['1 Cucumber', '4 Tomatoes', '½ Red onion', '200g Feta cheese', '80g Kalamata olives'],
        steps: [
            'Cut tomatoes into wedges and cucumber into half-moons.',
            'Soak thin-sliced onion in cold water for 5 minutes.',
            'Combine with olives, dress with oil, vinegar and oregano.',
            'Top with feta and rest 5 minutes before serving.',
        ],
    },
    {
        name: 'Baked Garlic Salmon', emoji: '🐟', time: 20, calories: 450, protein: 38, difficulty: 'Easy', category: 'dinner',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=70',
        description: 'Lemon, dill, flaky in 15 minutes.',
        diet: ['none', 'pescatarian', 'keto', 'high-protein'],
        ingredients: ['200g Salmon fillet', '1 tbsp Olive oil', '2 Garlic cloves', '1 Lemon', 'Fresh dill'],
        steps: [
            'Heat the oven to 200°C.',
            'Rub the salmon with oil, garlic, salt and pepper.',
            'Top with lemon slices and dill.',
            'Bake for 12-15 minutes until it flakes.',
        ],
    },
    {
        name: 'Chickpea Grain Bowl', emoji: '🥙', time: 15, calories: 420, protein: 18, difficulty: 'Easy', category: 'lunch',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=70',
        description: 'Quinoa, chickpeas, tahini drizzle.',
        diet: ['none', 'vegetarian', 'vegan'],
        ingredients: ['1 cup Quinoa', '½ cup Roasted chickpeas', '½ Avocado', 'Cherry tomatoes', '2 tbsp Tahini'],
        steps: [
            'Spoon cooked quinoa into a bowl.',
            'Arrange chickpeas, avocado and tomatoes on top.',
            'Whisk tahini with lemon and water; drizzle and serve.',
        ],
    },
    {
        name: 'Miso Ramen', emoji: '🍜', time: 35, calories: 380, protein: 22, difficulty: 'Medium', category: 'dinner',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=70',
        description: 'Warming broth, soft eggs.',
        diet: ['none', 'vegetarian'],
        ingredients: ['2 packs Ramen noodles', '1 l Vegetable broth', '3 tbsp Miso paste', '2 Eggs', '1 cup Mushrooms'],
        steps: [
            'Simmer the broth.',
            'Whisk miso into a cup of broth, then stir it back in.',
            'Boil the eggs for 6 minutes and cook the noodles separately.',
            'Ladle broth over noodles; top with eggs and mushrooms.',
        ],
    },
    {
        name: 'Banana Smoothie', emoji: '🍌', time: 5, calories: 190, protein: 9, difficulty: 'Easy', category: 'snack',
        image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=400&q=70',
        description: 'Creamy, quick, no added sugar.',
        diet: ['none', 'vegetarian'],
        ingredients: ['2 Bananas', '150g Greek yogurt', '1 tbsp Honey', '200ml Milk', '6 Ice cubes'],
        steps: [
            'Add everything to a blender.',
            'Blend on high for 45 seconds until smooth.',
        ],
    },
].map((r) => ({ ...normalizeRecipe(r), diet: r.diet }))

/** Samples that fit a diet setting; "none" means anything goes. */
export const suggestionsFor = (diet = 'none', count = 4, salt = 0) => {
    const pool = SAMPLE_RECIPES.filter((r) => diet === 'none' || r.diet?.includes(diet))
    const list = pool.length ? pool : SAMPLE_RECIPES
    // Rotate by a stable salt (the day) so the dashboard varies without flickering.
    const start = list.length ? salt % list.length : 0
    return [...list.slice(start), ...list.slice(0, start)].slice(0, count)
}
