'use client'

import { motion } from 'motion/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

/**
 * Varian ringan: tanpa motion, hanya class CSS bespoke `.lightweight-section-entrance`
 * (src/styles/ubsc-bespoke.css). Dipakai HomePage untuk SectionThree.
 *
 * Timeout 1120ms bukan angka bebas — ia harus lebih lama dari durasi transisi di CSS bespoke,
 * karena `is-complete` yang melepas `will-change`. Jangan diubah tanpa mengubah CSS-nya.
 */
function LightweightFadeIn({ children, className }: { children: ReactNode; className: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const node = rootRef.current
    if (!node) return

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setIsVisible(true)
        observer.disconnect()
      },
      {
        threshold: 0,
        rootMargin: '0px 0px 8% 0px'
      }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const timeout = window.setTimeout(() => setIsComplete(true), 1120)

    return () => window.clearTimeout(timeout)
  }, [isVisible])

  return (
    <div ref={rootRef} className={`lightweight-section-entrance ${isVisible ? 'is-visible' : ''} ${isComplete ? 'is-complete' : ''} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Port dari resources/js/Components/Landing/FadeIn.tsx. Nol string class berubah.
 *
 * SATU-SATUNYA perubahan terhadap sumber: `framer-motion` -> `motion/react`. Paket `motion` 12
 * adalah kelanjutan framer-motion yang kompatibel React 19 (R6); API `motion.div`, `initial`,
 * `whileInView`, `viewport`, dan `transition` identik, termasuk cubic-bezier array.
 *
 * `children` tetap PROP, bukan render callback (Rewrite.md:292) — mengubahnya jadi callback
 * akan menambah satu boundary render dan menggeser urutan efek.
 */
export function FadeIn({ children, className = '', lightweight = false }: { children: ReactNode; className?: string; lightweight?: boolean }) {
  if (lightweight) {
    return <LightweightFadeIn className={className}>{children}</LightweightFadeIn>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
