'use client'

import { ScrollTextReveal } from '@/components/landing/ScrollTextReveal'
import { motion } from 'motion/react'

interface SectionDividerProps {
  number: string
  title: string
  subtitle: string
  theme?: 'light' | 'dark'
  outerClassName?: string
  contentClassName?: string
  size?: 'default' | 'compact'
  titlePlacement?: 'center' | 'right'
}

/**
 * Port dari resources/js/Components/Landing/SectionDivider.tsx.
 *
 * Dua perubahan terhadap sumber, keduanya wajib:
 *   1. `framer-motion` -> `motion/react` (R6, React 19).
 *   2. `flex-shrink-0` -> `shrink-0` pada titik merah (reference/class-migration.json, cari
 *      'Components/Landing/SectionDivider.tsx' — satu-satunya pair yang berubah di berkas ini).
 *
 * `repeat: Infinity` pada animasi titik TIDAK dibungkus prefers-reduced-motion di Laravel, dan
 * itu dipertahankan apa adanya. Audit reduced-motion dijadwalkan Fase 9; memperbaikinya di sini
 * berarti run `reducedMotion: 'reduce'` di baterai verifikasi tidak lagi setara dengan Laravel.
 */
export function SectionDivider({
  number,
  title,
  subtitle,
  theme = 'light',
  outerClassName = '',
  contentClassName = '',
  size = 'compact',
  titlePlacement = 'right'
}: SectionDividerProps) {
  const isDark = theme === 'dark'
  const isCompact = size === 'compact'
  const [subtitleNumber, ...subtitleWords] = subtitle.split(' ')
  const subtitleLabel = subtitleWords.join(' ')
  const rootPadding = isCompact ? 'pt-4' : 'pt-5'
  const textSize = isCompact ? 'text-[8.8px] sm:text-[10.4px] xl:text-[12.8px]' : 'text-[11px] sm:text-[13px] xl:text-[16px]'
  const dotSize = isCompact ? 'h-[5px] w-[5px]' : 'h-1.5 w-1.5'
  const numberGap = isCompact ? 'gap-2.5' : 'gap-3'
  const isRightTitle = titlePlacement === 'right'

  return (
    <div className={`border-t ${rootPadding} ${isDark ? 'border-white/20' : 'border-black/55'} ${outerClassName}`}>
      <div
        className={`grid ${
          isRightTitle ? 'grid-cols-[auto_1fr] md:grid-cols-[1fr_auto_1fr]' : 'grid-cols-[1fr_auto_1fr]'
        } items-center ${textSize} ${isDark ? 'text-white' : 'text-black'} ${contentClassName}`}
      >
        <span className={`flex items-center ${numberGap} font-bdo font-light`}>
          <motion.span
            className={`${dotSize} shrink-0 rounded-full bg-[#ff0000]`}
            animate={{
              scale: [1, 1.7, 1],
              boxShadow: ['0 0 0px 0px rgba(220,38,38,0)', '0 0 6px 3px rgba(220,38,38,0.35)', '0 0 0px 0px rgba(220,38,38,0)']
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <ScrollTextReveal delay={20}>{`(${number})`}</ScrollTextReveal>
        </span>
        {isRightTitle ? (
          <>
            <span className="justify-self-end font-bdo font-medium md:justify-self-center">
              <ScrollTextReveal delay={70}>{`(${title})`}</ScrollTextReveal>
            </span>
            <span className="hidden justify-self-end font-bdo md:inline-flex">
              <ScrollTextReveal delay={120} className="font-thin">{`/${subtitleNumber}`}</ScrollTextReveal>
              {subtitleLabel && (
                <ScrollTextReveal delay={150} className="ml-1 font-medium">
                  {subtitleLabel}
                </ScrollTextReveal>
              )}
            </span>
          </>
        ) : (
          <>
            <span className="font-bdo font-medium">
              <ScrollTextReveal delay={70}>{`(${title})`}</ScrollTextReveal>
            </span>
            <span className="hidden justify-self-end font-bdo md:inline-flex">
              <ScrollTextReveal delay={120} className="font-thin">{`/${subtitleNumber}`}</ScrollTextReveal>
              {subtitleLabel && (
                <ScrollTextReveal delay={150} className="ml-1 font-medium">
                  {subtitleLabel}
                </ScrollTextReveal>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
