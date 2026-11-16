/**
 * Local-calendar date helpers.
 *
 * `new Date().toISOString().split('T')[0]` is the UTC date, which in India is
 * still "yesterday" until 05:30 in the morning. Everything the kitchen keys by
 * day (calorie log, meal plan, streaks) goes through these instead so a day
 * always means the user's own day.
 */

const pad = (n) => String(n).padStart(2, '0')

/** Date → "YYYY-MM-DD" in local time. */
export const dateKey = (d = new Date()) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** "YYYY-MM-DD" → Date at local noon (noon dodges DST edges when adding days). */
export const parseDateKey = (key) => {
    const [y, m, d] = String(key).split('-').map(Number)
    return new Date(y, (m || 1) - 1, d || 1, 12)
}

export const addDays = (key, n) => {
    const d = parseDateKey(key)
    d.setDate(d.getDate() + n)
    return dateKey(d)
}

/** Monday of the week containing `key`. */
export const startOfWeek = (key = dateKey()) => {
    const d = parseDateKey(key)
    const offset = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - offset)
    return dateKey(d)
}

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** The seven date keys (Mon→Sun) of the week `weekOffset` weeks from now. */
export const weekKeys = (weekOffset = 0, from = dateKey()) => {
    const monday = addDays(startOfWeek(from), weekOffset * 7)
    return DAY_NAMES.map((_, i) => addDays(monday, i))
}

export const dayName = (key) => DAY_NAMES[(parseDateKey(key).getDay() + 6) % 7]

export const greeting = (d = new Date()) => {
    const h = d.getHours()
    if (h < 5) return 'Late night'
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
}

/** Breakfast/Lunch/Snack/Dinner — what someone is most likely cooking right now. */
export const mealSlotNow = (d = new Date()) => {
    const h = d.getHours()
    if (h < 11) return 'Breakfast'
    if (h < 15) return 'Lunch'
    if (h < 18) return 'Snack'
    return 'Dinner'
}
