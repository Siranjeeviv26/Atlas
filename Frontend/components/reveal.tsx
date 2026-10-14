'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Scroll-triggered fade/slide reveal. Renders static content for users who
 * prefer reduced motion, so nothing is ever hidden behind an animation.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  duration = 0.7,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  duration?: number
}) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Mount-time staggered entrance for above-the-fold content (hero). `Reveal`
 * waits for scroll; this plays as soon as the section is in view — which for
 * the hero means immediately on load.
 */
export function Stagger({
  children,
  className,
  stagger = 0.09,
}: {
  children: ReactNode
  className?: string
  stagger?: number
}) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  y = 22,
}: {
  children: ReactNode
  className?: string
  y?: number
}) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function FadeUpCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={cn(className)}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      whileHover={{ y: -4 }}
    >
      {children}
    </motion.div>
  )
}
