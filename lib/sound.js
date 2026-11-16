/**
 * Kitchen chime.
 *
 * The timers used to call `new Audio('/notification.mp3')`, but the project has
 * no public/ folder, so every finished timer produced an unhandled promise
 * rejection and no sound. A few synthesised beeps need no asset at all.
 *
 * Browsers only allow audio after a user gesture, so `primeAudio()` is called
 * from the click that starts a timer; the chime that fires minutes later then
 * reuses that already-unlocked context.
 */

let ctx = null

const getContext = () => {
    if (typeof window === 'undefined') return null
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) return null
    if (!ctx) ctx = new Ctor()
    return ctx
}

export const primeAudio = () => {
    try {
        const c = getContext()
        if (c && c.state === 'suspended') c.resume().catch(() => {})
    } catch {
        // audio is a nicety; never let it break a click handler
    }
}

/** Three rising beeps, plus a buzz on phones that support it. */
export const playChime = () => {
    try {
        navigator.vibrate?.([180, 80, 180])
    } catch {
        // vibration is optional
    }

    try {
        const c = getContext()
        if (!c) return
        if (c.state === 'suspended') c.resume().catch(() => {})

        const notes = [784, 988, 1175]
        notes.forEach((freq, i) => {
            const start = c.currentTime + i * 0.22
            const osc = c.createOscillator()
            const gain = c.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, start)
            gain.gain.setValueAtTime(0.0001, start)
            gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02)
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2)
            osc.connect(gain)
            gain.connect(c.destination)
            osc.start(start)
            osc.stop(start + 0.22)
        })
    } catch {
        // no audio device, or the browser refused — the visual alert still shows
    }
}
