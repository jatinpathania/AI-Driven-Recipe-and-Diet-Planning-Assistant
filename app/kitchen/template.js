"use client"

import { motion } from 'framer-motion'

/**
 * Re-mounts on every kitchen navigation, giving each page a short lift-in.
 *
 * Only opacity/translate/scale are animated: once they settle framer-motion
 * writes `transform: none`, so this wrapper never becomes the containing block
 * for the pages' `position: fixed` modals and drawers. (A resting perspective
 * or filter would, and every modal would be clipped to the content area.)
 * Reduced-motion users get a plain fade via the MotionConfig in PremiumLayout.
 */
export default function KitchenTemplate({ children }) {
    return (
        <motion.div
            className="flex h-full min-w-0 flex-1"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.6 }}
        >
            {children}
        </motion.div>
    )
}
