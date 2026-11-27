'use client'

/**
 * Lighter motion for phones and low-end devices. The classes are set on <html>
 * before the first paint by LITE_MOTION_SCRIPT (lib/motion/liteScript.js,
 * inlined in app/layout.js) and never change after load.
 *
 * The server always sees "false", so use these only for things that don't
 * change the rendered markup (framer transitions, listeners), or read them
 * after mount (see useReducedMotionAfterMount in components/Home/Scene3D.jsx).
 */

import { LITE_CLASS, LOW_POWER_CLASS } from './liteScript'

const hasClass = (c) => typeof document !== 'undefined' && document.documentElement.classList.contains(c)

export const isLiteMotion = () => hasClass(LITE_CLASS)
export const isLowPower = () => hasClass(LOW_POWER_CLASS)
