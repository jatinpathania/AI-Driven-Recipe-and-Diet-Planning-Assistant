/**
 * Vegetables the weekly planner offers, and the check that keeps the AI to
 * the ones the user actually bought. Shared by the planner page (the picker)
 * and the server (validating every dish the model returns).
 *
 * `aliases` are names a dish might use for the vegetable (Hindi names
 * included: "Aloo Gobi" uses potato and cauliflower). They're matched as
 * whole words, so keep them specific: "pepper" alone would flag black
 * pepper, and "coriander" alone would flag coriander powder.
 *
 * `keeps` is roughly how many days it lasts in a fridge; the planner asks the
 * model to cook short-lived vegetables early in the week.
 */

export const VEGETABLE_GROUPS = [
    { id: 'everyday', label: 'Everyday basics' },
    { id: 'leafy', label: 'Leafy greens & herbs' },
    { id: 'gourds', label: 'Gourds & squashes' },
    { id: 'pods', label: 'Beans & pods' },
    { id: 'roots', label: 'Roots & tubers' },
    { id: 'other', label: 'More vegetables' },
]

export const VEGETABLES = [
    // Everyday basics
    { id: 'onion', name: 'Onion', hindi: 'Pyaz', emoji: '🧅', group: 'everyday', keeps: 21, aliases: ['onion', 'onions', 'pyaz', 'pyaaz', 'kanda', 'do pyaza'] },
    { id: 'tomato', name: 'Tomato', hindi: 'Tamatar', emoji: '🍅', group: 'everyday', keeps: 7, aliases: ['tomato', 'tomatoes', 'tamatar', 'tamater'] },
    { id: 'potato', name: 'Potato', hindi: 'Aloo', emoji: '🥔', group: 'everyday', keeps: 21, aliases: ['potato', 'potatoes', 'aloo', 'alu', 'batata'] },
    { id: 'garlic', name: 'Garlic', hindi: 'Lehsun', emoji: '🧄', group: 'everyday', keeps: 21, aliases: ['garlic', 'lehsun', 'lahsun', 'lasun'] },
    { id: 'ginger', name: 'Ginger', hindi: 'Adrak', emoji: '🫚', group: 'everyday', keeps: 14, aliases: ['ginger', 'adrak'] },
    { id: 'green-chilli', name: 'Green chilli', hindi: 'Hari mirch', emoji: '🌶️', group: 'everyday', keeps: 10, aliases: ['green chilli', 'green chillies', 'green chili', 'green chilies', 'hari mirch', 'mirchi'] },
    { id: 'lemon', name: 'Lemon', hindi: 'Nimbu', emoji: '🍋', group: 'everyday', keeps: 14, aliases: ['lemon', 'lemons', 'nimbu', 'lime'] },

    // Leafy greens & herbs
    { id: 'spinach', name: 'Spinach', hindi: 'Palak', emoji: '🥬', group: 'leafy', keeps: 3, aliases: ['spinach', 'palak'] },
    { id: 'fenugreek', name: 'Fenugreek leaves', hindi: 'Methi', emoji: '🌿', group: 'leafy', keeps: 3, aliases: ['methi', 'fenugreek leaves', 'fresh fenugreek'] },
    { id: 'coriander', name: 'Coriander leaves', hindi: 'Dhaniya patta', emoji: '🌿', group: 'leafy', keeps: 4, aliases: ['coriander leaves', 'fresh coriander', 'cilantro', 'dhaniya patta', 'hara dhaniya'] },
    { id: 'mint', name: 'Mint', hindi: 'Pudina', emoji: '🌱', group: 'leafy', keeps: 4, aliases: ['mint', 'pudina'] },
    { id: 'mustard-greens', name: 'Mustard greens', hindi: 'Sarson', emoji: '🥬', group: 'leafy', keeps: 3, aliases: ['sarson', 'mustard greens', 'sarson ka saag'] },
    { id: 'bathua', name: 'Bathua', hindi: 'Bathua', emoji: '🌿', group: 'leafy', keeps: 2, aliases: ['bathua'] },
    { id: 'spring-onion', name: 'Spring onion', hindi: 'Hara pyaz', emoji: '🌱', group: 'leafy', keeps: 5, aliases: ['spring onion', 'spring onions', 'scallion', 'scallions', 'hara pyaz'] },
    { id: 'curry-leaves', name: 'Curry leaves', hindi: 'Kadi patta', emoji: '🍃', group: 'leafy', keeps: 10, aliases: ['curry leaves', 'kadi patta', 'kadhi patta'] },
    { id: 'lettuce', name: 'Lettuce', hindi: 'Salad patta', emoji: '🥬', group: 'leafy', keeps: 5, aliases: ['lettuce'] },

    // Gourds & squashes
    { id: 'bottle-gourd', name: 'Bottle gourd', hindi: 'Lauki', emoji: '🥒', group: 'gourds', keeps: 7, aliases: ['bottle gourd', 'lauki', 'ghiya', 'dudhi'] },
    { id: 'ridge-gourd', name: 'Ridge gourd', hindi: 'Turai', emoji: '🥒', group: 'gourds', keeps: 4, aliases: ['ridge gourd', 'turai', 'tori', 'turiya'] },
    { id: 'bitter-gourd', name: 'Bitter gourd', hindi: 'Karela', emoji: '🥒', group: 'gourds', keeps: 5, aliases: ['bitter gourd', 'karela', 'bitter melon'] },
    { id: 'pumpkin', name: 'Pumpkin', hindi: 'Kaddu', emoji: '🎃', group: 'gourds', keeps: 21, aliases: ['pumpkin', 'kaddu', 'sitaphal'] },
    { id: 'cucumber', name: 'Cucumber', hindi: 'Kheera', emoji: '🥒', group: 'gourds', keeps: 6, aliases: ['cucumber', 'cucumbers', 'kheera', 'khira'] },
    { id: 'tinda', name: 'Round gourd', hindi: 'Tinda', emoji: '🟢', group: 'gourds', keeps: 5, aliases: ['tinda', 'round gourd', 'apple gourd'] },
    { id: 'parwal', name: 'Pointed gourd', hindi: 'Parwal', emoji: '🥒', group: 'gourds', keeps: 5, aliases: ['parwal', 'pointed gourd', 'parval'] },
    { id: 'zucchini', name: 'Zucchini', hindi: 'Zucchini', emoji: '🥒', group: 'gourds', keeps: 5, aliases: ['zucchini', 'courgette', 'courgettes'] },

    // Beans & pods
    { id: 'peas', name: 'Green peas', hindi: 'Matar', emoji: '🫛', group: 'pods', keeps: 4, aliases: ['peas', 'green peas', 'matar', 'mattar', 'mutter'] },
    { id: 'green-beans', name: 'Green beans', hindi: 'Phaliyan', emoji: '🫛', group: 'pods', keeps: 5, aliases: ['green beans', 'french beans', 'beans sabzi', 'phaliyan', 'beans poriyal'] },
    { id: 'okra', name: 'Okra', hindi: 'Bhindi', emoji: '🫛', group: 'pods', keeps: 3, aliases: ['okra', 'bhindi', 'ladyfinger', 'lady finger', "lady's finger", 'ladies finger'] },
    { id: 'cluster-beans', name: 'Cluster beans', hindi: 'Gawar', emoji: '🫛', group: 'pods', keeps: 4, aliases: ['gawar', 'guar', 'cluster beans'] },
    { id: 'broad-beans', name: 'Broad beans', hindi: 'Sem', emoji: '🫛', group: 'pods', keeps: 4, aliases: ['broad beans', 'sem phali'] },
    { id: 'drumstick', name: 'Drumstick', hindi: 'Sahjan', emoji: '🥢', group: 'pods', keeps: 5, aliases: ['drumstick', 'drumsticks', 'sahjan', 'moringa', 'murungakkai'] },

    // Roots & tubers
    { id: 'carrot', name: 'Carrot', hindi: 'Gajar', emoji: '🥕', group: 'roots', keeps: 14, aliases: ['carrot', 'carrots', 'gajar'] },
    { id: 'radish', name: 'Radish', hindi: 'Mooli', emoji: '🥕', group: 'roots', keeps: 7, aliases: ['radish', 'mooli', 'muli'] },
    { id: 'beetroot', name: 'Beetroot', hindi: 'Chukandar', emoji: '🫜', group: 'roots', keeps: 14, aliases: ['beetroot', 'beet', 'beets', 'chukandar'] },
    { id: 'sweet-potato', name: 'Sweet potato', hindi: 'Shakarkandi', emoji: '🍠', group: 'roots', keeps: 14, aliases: ['sweet potato', 'sweet potatoes', 'shakarkandi'] },
    { id: 'colocasia', name: 'Colocasia', hindi: 'Arbi', emoji: '🟤', group: 'roots', keeps: 10, aliases: ['arbi', 'colocasia', 'taro'] },
    { id: 'yam', name: 'Yam', hindi: 'Suran / Jimikand', emoji: '🟤', group: 'roots', keeps: 21, aliases: ['yam', 'suran', 'jimikand', 'elephant foot yam'] },
    { id: 'raw-banana', name: 'Raw banana', hindi: 'Kachcha kela', emoji: '🍌', group: 'roots', keeps: 5, aliases: ['raw banana', 'kachcha kela', 'kacha kela', 'plantain'] },

    // More vegetables
    { id: 'cauliflower', name: 'Cauliflower', hindi: 'Phool gobi', emoji: '🥦', group: 'other', keeps: 6, aliases: ['cauliflower', 'gobi', 'gobhi', 'phool gobi', 'phool gobhi'] },
    { id: 'cabbage', name: 'Cabbage', hindi: 'Patta gobi', emoji: '🥬', group: 'other', keeps: 10, aliases: ['cabbage', 'patta gobi', 'patta gobhi', 'band gobhi', 'bandh gobi'] },
    { id: 'brinjal', name: 'Brinjal', hindi: 'Baingan', emoji: '🍆', group: 'other', keeps: 5, aliases: ['brinjal', 'eggplant', 'aubergine', 'baingan', 'baigan', 'bharwan baingan'] },
    { id: 'capsicum', name: 'Capsicum', hindi: 'Shimla mirch', emoji: '🫑', group: 'other', keeps: 7, aliases: ['capsicum', 'bell pepper', 'bell peppers', 'shimla mirch'] },
    { id: 'mushroom', name: 'Mushroom', hindi: 'Khumb', emoji: '🍄', group: 'other', keeps: 3, aliases: ['mushroom', 'mushrooms', 'khumb'] },
    { id: 'corn', name: 'Sweet corn', hindi: 'Makka / Bhutta', emoji: '🌽', group: 'other', keeps: 3, aliases: ['sweet corn', 'corn', 'bhutta', 'makai', 'makka'] },
    { id: 'broccoli', name: 'Broccoli', hindi: 'Broccoli', emoji: '🥦', group: 'other', keeps: 5, aliases: ['broccoli'] },
    { id: 'jackfruit', name: 'Raw jackfruit', hindi: 'Kathal', emoji: '🟢', group: 'other', keeps: 4, aliases: ['jackfruit', 'kathal', 'kathhal'] },
    { id: 'baby-corn', name: 'Baby corn', hindi: 'Baby corn', emoji: '🌽', group: 'other', keeps: 4, aliases: ['baby corn'] },
]

/** Pantry staples the planner may combine with the vegetables. */
export const STAPLES = [
    { id: 'rice', name: 'Rice', emoji: '🍚', default: true },
    { id: 'atta', name: 'Wheat flour (atta)', emoji: '🌾', default: true },
    { id: 'dal', name: 'Dal / lentils', emoji: '🫘', default: true },
    { id: 'besan', name: 'Besan (gram flour)', emoji: '🟡', default: true },
    { id: 'suji', name: 'Suji (semolina)', emoji: '🥣', default: true },
    { id: 'poha', name: 'Poha', emoji: '🍚', default: true },
    { id: 'curd', name: 'Curd / yogurt', emoji: '🥛', default: true },
    { id: 'milk', name: 'Milk', emoji: '🥛', default: true },
    { id: 'chana', name: 'Chickpeas / rajma', emoji: '🫘', default: false },
    { id: 'paneer', name: 'Paneer', emoji: '🧀', default: false },
    { id: 'eggs', name: 'Eggs', emoji: '🥚', default: false },
    { id: 'bread', name: 'Bread', emoji: '🍞', default: false },
    { id: 'oats', name: 'Oats', emoji: '🥣', default: false },
    { id: 'pasta', name: 'Pasta / noodles', emoji: '🍝', default: false },
    { id: 'peanuts', name: 'Peanuts', emoji: '🥜', default: false },
    { id: 'coconut', name: 'Coconut', emoji: '🥥', default: false },
    { id: 'chicken', name: 'Chicken', emoji: '🍗', default: false },
]

export const DEFAULT_STAPLES = STAPLES.filter((s) => s.default).map((s) => s.id)

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const norm = (s) => String(s || '').toLowerCase().trim()

/** The catalogue entry a typed name refers to, if any ("Aloo" → potato). */
export const findVegetable = (name) => {
    const n = norm(name)
    if (!n) return null
    return VEGETABLES.find((v) => v.id === n || norm(v.name) === n || norm(v.hindi) === n || v.aliases.includes(n)) || null
}

const aliasRegex = (v) => new RegExp(`(^|[^a-z])(${v.aliases.map(escape).join('|')})(?=[^a-z]|$)`, 'i')
const REGEX = new Map(VEGETABLES.map((v) => [v.id, aliasRegex(v)]))

/**
 * Which catalogue vegetables does `text` mention that the user did NOT pick?
 * `allowedIds` is a Set of catalogue ids the user selected.
 *
 * Mentions of allowed vegetables are blanked out first (longest names first),
 * so picking "Spring onion" doesn't make "spring onion paratha" look like it
 * uses plain onion. A bare "onion" elsewhere in the text still counts.
 */
export const forbiddenIn = (text, allowedIds) => {
    let t = ` ${norm(text)} `
    if (!t.trim()) return []
    // Blank out mentions of allowed vegetables first, longest names first, so
    // "spring onion" (allowed) can't leave a bare "onion" behind to match.
    const allowedAliases = VEGETABLES.filter((v) => allowedIds.has(v.id))
        .flatMap((v) => v.aliases)
        .sort((a, b) => b.length - a.length)
    for (const a of allowedAliases) {
        t = t.replace(new RegExp(`(^|[^a-z])${escape(a)}(?=[^a-z]|$)`, 'gi'), '$1 ')
    }
    return VEGETABLES.filter((v) => !allowedIds.has(v.id) && REGEX.get(v.id).test(t)).map((v) => v.name)
}

/**
 * Normalise what the client sent: known vegetables become catalogue entries,
 * anything else is kept as a custom vegetable the user typed in.
 */
export const resolveSelection = (names = []) => {
    const allowedIds = new Set()
    const labels = []
    const seen = new Set()
    for (const raw of names) {
        const name = String(raw || '').trim().slice(0, 40)
        if (!name || seen.has(norm(name))) continue
        seen.add(norm(name))
        const v = findVegetable(name)
        if (v) {
            if (allowedIds.has(v.id)) continue
            allowedIds.add(v.id)
            labels.push({ name: v.hindi && v.hindi !== v.name ? `${v.name} (${v.hindi})` : v.name, keeps: v.keeps, known: true })
        } else {
            labels.push({ name, keeps: null, known: false })
        }
    }
    return { allowedIds, labels }
}
