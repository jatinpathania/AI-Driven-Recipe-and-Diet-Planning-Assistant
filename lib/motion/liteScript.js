/**
 * Tags <html> before the first paint so CSS and components can tone motion
 * down on phones and low-end devices. Plain module (not 'use client') so the
 * root layout, a server component, can inline the script. See lib/motion/lite.js.
 *
 *   lite-motion  touch screens, small screens, weak hardware, Save-Data or
 *                "reduce motion": no endless background animation, no
 *                backdrop blur, no pointer/scroll-driven 3D.
 *   low-power    weak hardware, Save-Data or "reduce motion": entrance
 *                animations also drop their movement and only fade.
 *
 * Weak hardware: at most 4 logical cores, or under 4 GB of memory where the
 * browser reports it.
 */

export const LITE_CLASS = 'lite-motion'
export const LOW_POWER_CLASS = 'low-power'

export const LITE_MOTION_SCRIPT = `(function () {
  try {
    var d = document.documentElement, n = navigator;
    var mm = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
    var reduce = mm('(prefers-reduced-motion: reduce)');
    var saveData = !!(n.connection && n.connection.saveData);
    var weak = (n.hardwareConcurrency > 0 && n.hardwareConcurrency <= 4) || (n.deviceMemory > 0 && n.deviceMemory < 4);
    var touch = mm('(hover: none)') || mm('(pointer: coarse)') || mm('(max-width: 767px)');
    if (touch || weak || reduce || saveData) d.classList.add('${LITE_CLASS}');
    if (weak || reduce || saveData) d.classList.add('${LOW_POWER_CLASS}');
  } catch (e) {}
})();`
