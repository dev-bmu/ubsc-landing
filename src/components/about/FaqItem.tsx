'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus } from 'lucide-react'

interface FaqItemProps {
  number: string
  question: string
  answer: string
}

const EASE = [0.76, 0, 0.24, 1] as const

/**
 * Port dari resources/js/Components/About/FaqItem.tsx.
 *
 * 'use client': useState + onClick + AnimatePresence/motion. `framer-motion` -> `motion/react`.
 * Ikon `Plus` masih ada di lucide-react.
 *
 * classPairs (spec-FaqItem.json), 3 buah:
 *   1. `flex-shrink-0` -> `shrink-0` pada nomor.
 *   2. `pl-[4.5rem]` -> `pl-18` pada paragraf jawaban.
 *   3. `ml-6 flex-shrink-0 text-black` -> `ml-6 shrink-0 text-black` pada ikon plus.
 */
export function FaqItem({ number, question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-black/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between py-12 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-6 xl:gap-8">
          <span className="w-12 shrink-0 font-bdo text-[clamp(1.125rem,1.46vw,28px)] leading-none font-light text-black">{number}</span>
          <span className="font-bdo text-[clamp(1.125rem,1.46vw,28px)] leading-snug font-medium text-black">{question}</span>
        </div>

        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3, ease: EASE }} className="ml-6 shrink-0 text-black">
          <Plus size={28} strokeWidth={1.5} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="font-regular pb-8 pl-18 font-bdo text-[clamp(1.25rem,1.15rem+0.5vw,1.5rem)] leading-relaxed text-black/50 xl:pb-12 xl:pl-20">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
