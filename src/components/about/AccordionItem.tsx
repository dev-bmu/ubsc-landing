'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, X } from 'lucide-react'

interface AccordionItemProps {
  number: string
  title: string
  badgeText: string
  bigNumber: string
  bigNumberLabel: string
  innerHeading: string
  redLabel: string
  description: string
  image: string
  initialIsOpen?: boolean
}

const EASE = [0.76, 0, 0.24, 1] as const

/**
 * Port dari resources/js/Components/About/AccordionItem.tsx.
 *
 * 'use client': useState + onClick + AnimatePresence/motion. `framer-motion` -> `motion/react`.
 * Ikon `ChevronDown` dan `X` masih ada di lucide-react.
 *
 * classPairs (spec-AccordionItem.json), 2 buah: `flex-shrink-0` -> `shrink-0` pada nomor dan
 * pada tombol bulat ikon.
 */
export function AccordionItem({
  number,
  title,
  badgeText,
  bigNumber,
  bigNumberLabel,
  innerHeading,
  redLabel,
  description,
  image,
  initialIsOpen = false
}: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen)

  return (
    <div className="w-full border-b border-black/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between py-6 xl:py-8"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-8 text-left xl:gap-12">
          <span className="w-10 shrink-0 font-bdo text-[28px] leading-none font-medium text-black">{number}</span>
          <span className="font-bdo text-[clamp(1.25rem,2.5vw,2.75rem)] leading-tight font-light text-black">{title}</span>
        </div>

        <div
          className={`ml-6 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 xl:h-11 xl:w-11 ${
            isOpen ? 'bg-[#ff0000]' : 'bg-black'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span
                key="x"
                initial={{
                  opacity: 0,
                  rotate: -90,
                  scale: 0.7
                }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                transition={{ duration: 0.18, ease: EASE }}
                className="flex"
              >
                <X size={16} className="text-white" strokeWidth={2.5} />
              </motion.span>
            ) : (
              <motion.span
                key="chevron"
                initial={{ opacity: 0, rotate: 90, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -90, scale: 0.7 }}
                transition={{ duration: 0.18, ease: EASE }}
                className="flex"
              >
                <ChevronDown size={16} className="text-white" strokeWidth={2.5} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="pb-12">
              <div className="w-full overflow-hidden rounded-[15px]">
                {/* eslint-disable-next-line @next/next/no-img-element -- vission.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
                <img src={image} alt={title} className="h-full w-full object-cover" loading="lazy" />
              </div>

              <div className="mt-8 grid grid-cols-1 items-stretch gap-8 xl:grid-cols-12">
                <div className="flex flex-row items-center justify-between xl:col-span-3 xl:flex-col xl:items-start xl:justify-between">
                  <div className="inline-flex items-center rounded-full bg-black px-5 py-2.5">
                    <span className="font-bdo text-sm font-medium whitespace-nowrap text-white">{badgeText}</span>
                  </div>

                  <div className="flex flex-col xl:mt-auto">
                    <span className="font-bdo text-[clamp(3rem,6vw,5rem)] leading-none font-medium text-[#ff0000]">{bigNumber}</span>
                    <span className="font-regular text-md mt-1 font-bdo tracking-widest text-black">{bigNumberLabel}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-6 xl:col-span-9">
                  <h3 className="font-bdo text-[clamp(1.5rem,3vw,3.25rem)] leading-tight font-medium text-black">{innerHeading}</h3>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="xl:col-span-3">
                      <span className="font-bdo text-base text-[#ff0000]">{redLabel}</span>
                    </div>
                    <div className="xl:col-span-9">
                      <p className="font-bdo text-[clamp(1rem,1.04vw,20px)] leading-relaxed font-normal text-black">{description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
