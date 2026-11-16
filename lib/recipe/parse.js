/**
 * Recipe text parsing: quantities and durations.
 *
 * Recipes are stored as plain strings ("200g Spaghetti", "Simmer for 8
 * minutes"), which is fine for display and useless for anything else. These
 * helpers pull structure back out so the app can scale servings, switch between
 * metric and imperial, and offer a timer on the step that needs one.
 *
 * Deliberately conservative: anything that doesn't parse cleanly is returned
 * untouched rather than guessed at. A wrong quantity is worse than no quantity.
 */

/* ────────────────────────────────────────────────────────────
   Fractions
   ──────────────────────────────────────────────────────────── */

const VULGAR = {
    '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75,
    '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
    '⅙': 1 / 6, '⅚': 5 / 6, '⅐': 1 / 7, '⅛': 0.125,
    '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
}

// Ordered so the closest match wins when we render back out.
const NICE_FRACTIONS = [
    [1 / 8, '⅛'], [1 / 6, '⅙'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'],
    [1 / 2, '½'], [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [5 / 6, '⅚'], [7 / 8, '⅞'],
]

/** 1.5 → "1½", 0.25 → "¼", 2 → "2", 3.14 → "3.1" */
export const formatAmount = (value) => {
    if (!Number.isFinite(value) || value <= 0) return ''

    // Big numbers don't want fractions — nobody measures 247½ grams.
    if (value >= 10) return String(Math.round(value))

    const whole = Math.floor(value)
    const frac = value - whole

    if (frac < 0.02) return String(whole)

    let best = null
    let bestDiff = Infinity
    for (const [val, glyph] of NICE_FRACTIONS) {
        const diff = Math.abs(frac - val)
        if (diff < bestDiff) {
            bestDiff = diff
            best = glyph
        }
    }

    // Only use a fraction glyph when it is genuinely close, else fall back to a decimal.
    if (bestDiff > 0.04) {
        return value < 1 ? String(Math.round(value * 100) / 100) : String(Math.round(value * 10) / 10)
    }

    return whole > 0 ? `${whole}${best}` : best
}

/** "1 1/2" | "1½" | "0.5" | "½" → number */
const readAmount = (text) => {
    const t = text.trim()

    // mixed vulgar: "1½"
    const mixedVulgar = t.match(/^(\d+)\s*([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞])$/)
    if (mixedVulgar) return parseInt(mixedVulgar[1], 10) + VULGAR[mixedVulgar[2]]

    // bare vulgar: "½"
    if (VULGAR[t] !== undefined) return VULGAR[t]

    // mixed ascii: "1 1/2"
    const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/)
    if (mixed) return parseInt(mixed[1], 10) + parseInt(mixed[2], 10) / parseInt(mixed[3], 10)

    // plain ascii fraction: "1/2"
    const frac = t.match(/^(\d+)\/(\d+)$/)
    if (frac) return parseInt(frac[1], 10) / parseInt(frac[2], 10)

    const num = parseFloat(t)
    return Number.isFinite(num) ? num : null
}

/* ────────────────────────────────────────────────────────────
   Units
   ──────────────────────────────────────────────────────────── */

const UNITS = {
    g: { canonical: 'g', kind: 'mass', metric: true },
    gram: { canonical: 'g', kind: 'mass', metric: true },
    grams: { canonical: 'g', kind: 'mass', metric: true },
    kg: { canonical: 'kg', kind: 'mass', metric: true },
    oz: { canonical: 'oz', kind: 'mass', metric: false },
    ounce: { canonical: 'oz', kind: 'mass', metric: false },
    ounces: { canonical: 'oz', kind: 'mass', metric: false },
    lb: { canonical: 'lb', kind: 'mass', metric: false },
    lbs: { canonical: 'lb', kind: 'mass', metric: false },

    ml: { canonical: 'ml', kind: 'volume', metric: true },
    l: { canonical: 'l', kind: 'volume', metric: true },
    litre: { canonical: 'l', kind: 'volume', metric: true },
    liter: { canonical: 'l', kind: 'volume', metric: true },
    cup: { canonical: 'cup', kind: 'volume', metric: false },
    cups: { canonical: 'cup', kind: 'volume', metric: false },
    tbsp: { canonical: 'tbsp', kind: 'volume', metric: false },
    tablespoon: { canonical: 'tbsp', kind: 'volume', metric: false },
    tablespoons: { canonical: 'tbsp', kind: 'volume', metric: false },
    tsp: { canonical: 'tsp', kind: 'volume', metric: false },
    teaspoon: { canonical: 'tsp', kind: 'volume', metric: false },
    teaspoons: { canonical: 'tsp', kind: 'volume', metric: false },
}

// Everything relative to grams / millilitres.
const TO_BASE = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592, ml: 1, l: 1000, cup: 240, tbsp: 15, tsp: 5 }

const pluralise = (amount, unit) => {
    if (amount <= 1) return unit
    if (unit === 'cup') return 'cups'
    return unit // g/ml/tbsp/tsp/oz/lb don't pluralise in recipe shorthand
}

/**
 * Pick a readable unit for a converted amount — 0.25 kg reads worse than 250 g,
 * and 1500 ml reads worse than 1.5 l.
 */
const tidy = (amount, unit) => {
    if (unit === 'g' && amount >= 1000) return { amount: amount / 1000, unit: 'kg' }
    if (unit === 'kg' && amount < 1) return { amount: amount * 1000, unit: 'g' }
    if (unit === 'ml' && amount >= 1000) return { amount: amount / 1000, unit: 'l' }
    if (unit === 'l' && amount < 1) return { amount: amount * 1000, unit: 'ml' }
    if (unit === 'tsp' && amount >= 3) return { amount: amount / 3, unit: 'tbsp' }
    if (unit === 'tbsp' && amount >= 16) return { amount: amount / 16, unit: 'cup' }
    return { amount, unit }
}

/**
 * Spoons are the same spoon in every kitchen. Rewriting "1 tsp black pepper"
 * as "5ml black pepper" is arithmetically correct and useless to cook from, so
 * these never cross systems — they only roll up among themselves.
 */
const UNIVERSAL = new Set(['tsp', 'tbsp'])

const convert = (amount, unit, system) => {
    const meta = UNITS[unit?.toLowerCase()]
    if (!meta) return { amount, unit }

    if (UNIVERSAL.has(meta.canonical)) {
        // Allow 3 tsp → 1 tbsp, but stop before tbsp → cup under metric.
        const rolled = tidy(amount, meta.canonical)
        if (rolled.unit === 'cup' && system === 'metric') return tidy(amount * TO_BASE[meta.canonical], 'ml')
        return rolled
    }

    const wantMetric = system === 'metric'
    if (meta.metric === wantMetric) return tidy(amount, meta.canonical)

    const base = amount * TO_BASE[meta.canonical]
    const target = meta.kind === 'mass' ? (wantMetric ? 'g' : 'oz') : (wantMetric ? 'ml' : 'cup')
    return tidy(base / TO_BASE[target], target)
}

/* ────────────────────────────────────────────────────────────
   Ingredients
   ──────────────────────────────────────────────────────────── */

const UNIT_PATTERN = Object.keys(UNITS).sort((a, b) => b.length - a.length).join('|')
const AMOUNT_PATTERN = '\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?\\s*[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞]|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞]|\\d+(?:\\.\\d+)?'

const INGREDIENT_RE = new RegExp(`^\\s*(${AMOUNT_PATTERN})\\s*(${UNIT_PATTERN})?\\b\\s*(.*)$`, 'i')

/**
 * "200g Spaghetti" → { amount: 200, unit: 'g', name: 'Spaghetti' }
 * "Black Pepper"   → { amount: null, unit: null, name: 'Black Pepper' }
 */
export const parseIngredient = (line) => {
    const text = String(line ?? '').trim()
    if (!text) return { amount: null, unit: null, name: '', text }

    const m = text.match(INGREDIENT_RE)
    if (!m) return { amount: null, unit: null, name: text, text }

    const amount = readAmount(m[1])
    if (amount === null) return { amount: null, unit: null, name: text, text }

    const unit = m[2] ? UNITS[m[2].toLowerCase()]?.canonical ?? null : null
    const name = (m[3] || '').trim()

    // "2 Eggs" is a count, not a measurement — still scalable, just unitless.
    return { amount, unit, name: name || text, text }
}

/**
 * Rewrite an ingredient line for a new serving count and unit system.
 * Lines without a parseable quantity come back unchanged.
 */
export const scaleIngredient = (line, factor = 1, system = 'metric') => {
    const parsed = parseIngredient(line)
    if (parsed.amount === null) return parsed.text

    let amount = parsed.amount * factor
    let unit = parsed.unit

    if (unit) {
        const converted = convert(amount, unit, system)
        amount = converted.amount
        unit = converted.unit
    }

    const shown = formatAmount(amount)
    if (!shown) return parsed.text

    if (!unit) return `${shown} ${parsed.name}`.trim()

    // Metric shorthand hugs the number ("200g"); imperial words don't ("2 cups").
    const tight = unit === 'g' || unit === 'kg' || unit === 'ml' || unit === 'l'
    const label = pluralise(amount, unit)
    return tight ? `${shown}${label} ${parsed.name}`.trim() : `${shown} ${label} ${parsed.name}`.trim()
}

/** True when at least one line carries a quantity worth scaling. */
export const hasQuantities = (lines = []) =>
    lines.some((l) => parseIngredient(l).amount !== null)

/* ────────────────────────────────────────────────────────────
   Durations
   ──────────────────────────────────────────────────────────── */

const DURATION_RE =
    /(\d+(?:\.\d+)?)\s*(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/gi

/**
 * Pull every timeable duration out of a step.
 *
 *   "Simmer for 8 minutes"        → [{ minutes: 8,  label: '8 min' }]
 *   "Bake for 12-15 minutes"      → [{ minutes: 15, label: '15 min' }]  (upper bound: check early, don't burn it)
 *   "Stir for 30 seconds"         → [{ minutes: 0.5, label: '30 sec' }]
 */
export const parseDurations = (text) => {
    const source = typeof text === 'string' ? text : text?.instruction || text?.step || text?.text || ''
    if (!source) return []

    const out = []
    const seen = new Set()

    for (const m of source.matchAll(DURATION_RE)) {
        const lower = m[1] ? parseFloat(m[1]) : NaN
        const upper = m[2] ? parseFloat(m[2]) : null
        // A range means "check at the first, it's done by the second" — time the longer one.
        const value = upper ?? lower
        if (!Number.isFinite(value) || value <= 0) continue

        const unit = m[3].toLowerCase()
        let minutes
        let label

        if (unit.startsWith('h')) {
            minutes = value * 60
            label = `${formatAmount(value)} hr`
        } else if (unit.startsWith('s')) {
            minutes = value / 60
            label = `${Math.round(value)} sec`
        } else {
            minutes = value
            label = `${formatAmount(value)} min`
        }

        // Timers under ~20s are noise; so is the same duration twice in one step.
        if (minutes < 0.33 || minutes > 600) continue
        if (seen.has(label)) continue
        seen.add(label)

        out.push({ minutes, label, seconds: Math.round(minutes * 60) })
    }

    return out
}

/** Plain text of a step, whatever shape it was stored in. */
export const stepText = (step) =>
    typeof step === 'string' ? step : step?.instruction || step?.step || step?.text || ''
