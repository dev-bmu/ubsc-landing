'use client'

import { FacilityBadge } from '@/components/landing/FacilityBadge'
import { motion } from 'motion/react'

export interface ClassAccordionData {
  id: string
  title: string
  image: string
  badgeLocation: string
  badgeType: string
  classCode: string
  pricingDetails: { label: string }[]
}

interface Props {
  item: ClassAccordionData
  isOpen: boolean
  onToggle: () => void
}

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

const ChevronDown = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
)

function AccordionBodyImage({ image, alt, className = '' }: { image: string; alt: string; className?: string }) {
  return (
    <div className={`shrink-0 overflow-hidden rounded-[5px] border-4 border-white bg-white ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- gambar fasilitas dari FacilityDto.image (media CMS); butuh elemen polos, bukan next/image */}
      <img src={image} alt={alt} className="aspect-309/160 w-full rounded-[2px] object-cover" />
      <div className="flex items-center justify-between px-3 py-3">
        <span className="font-bdo text-[0.72rem] font-medium text-black">UBSC</span>
        <span className="font-bdo text-[0.72rem] font-medium text-black/55">Sport Center</span>
      </div>
    </div>
  )
}

/**
 * Port dari resources/js/Components/Pricing/PricingAccordionItem.tsx.
 *
 * 'use client': `motion` (animasi buka) + tombol onToggle.
 * `framer-motion` -> `motion/react` (R6, React 19); API initial/animate/exit/transition tidak berubah.
 *
 * Catatan sumber yang SENGAJA dipertahankan: `exit` dipasang tanpa <AnimatePresence> pembungkus, jadi
 * animasi keluar memang tidak pernah jalan — sama persis seperti di Laravel, bukan bug yang "dibetulkan".
 *
 * classPairs v4 (9):
 *   - `aspect-[309/160] ...`                     -> `aspect-309/160 ...`
 *   - footer gambar: `... py-[0.75rem]`          -> `... py-3`
 *   - kolom harga desktop: `flex min-w-[21rem] flex-col gap-[2rem] pt-[0.25rem]` -> `flex min-w-84 flex-col gap-8 pt-1`
 *   - lingkaran toggle: `flex size-[3.95rem] flex-shrink-0 ...` -> `... shrink-0 ...`
 *   - bingkai gambar: `flex-shrink-0 ... border-[4px] ...`      -> `shrink-0 ... border-4 ...`
 *   - grid isi desktop: `mt-[1.5rem] grid grid-cols-[...]`      -> `mt-6 grid grid-cols-[...]`
 *   - titik desktop: `size-1.5 flex-shrink-0 rounded-full bg-white`     -> `size-1.5 shrink-0 ...`
 *   - titik mobile:  `size-1.5 flex-shrink-0 rounded-full bg-white/60`  -> `size-1.5 shrink-0 ...`
 *   - label harga desktop: `... tracking-[-0.025em] text-white`         -> `... tracking-tight text-white`
 *
 * `font-regular` pada <p> kode kelas mobile DIBIARKAN: token itu juga tidak menghasilkan CSS di v3
 * (tailwind.config.js Laravel tidak mendefinisikan fontWeight 'regular'), jadi paritasnya utuh.
 */
export function PricingAccordionItem({ item, isOpen, onToggle }: Props) {
  const titleText = item.title.startsWith('/') ? item.title.replace('/', '/ ') : item.title

  return (
    <div>
      <button
        onClick={onToggle}
        className={`group grid w-full grid-cols-[10.35rem_minmax(0,1fr)_4rem] items-center text-left ${
          isOpen ? 'pt-[3.25rem] pb-[2.25rem]' : 'border-b border-white/35 py-[3.45rem]'
        }`}
      >
        <div className="contents">
          <span className="font-bdo text-[1.75rem] leading-none font-medium tracking-[-0.035em] text-white">{item.id}</span>
          <span className="font-bdo text-[2.7rem] leading-none font-medium tracking-[-0.055em] text-white transition-colors">{titleText}</span>
        </div>
        <div
          className={`flex size-[3.95rem] shrink-0 items-center justify-center justify-self-end rounded-full transition-colors ${
            isOpen ? 'bg-[#FF0000] text-white' : 'bg-white text-black group-hover:bg-white/90'
          }`}
        >
          {isOpen ? <XIcon /> : <ChevronDown />}
        </div>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="flex flex-col border-b border-white/50 py-6 xl:hidden">
            <FacilityBadge location={item.badgeLocation} category={item.badgeType} variant="red" />
            <div className="mt-4 flex w-full flex-row items-start gap-4">
              <AccordionBodyImage image={item.image} alt={item.title} className="w-[153px]" />
              <div className="flex flex-col gap-2">
                {item.pricingDetails.map((detail, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="size-1.5 shrink-0 rounded-full bg-white/60" />
                    <span className="font-bdo text-[clamp(0.875rem,1vw,1.125rem)] font-medium text-white">{detail.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="font-regular mt-3 font-bdo text-[0.65rem] tracking-widest text-white">{item.classCode}</p>
          </div>

          <div className="hidden border-b border-white/35 pb-[4.65rem] xl:block">
            <div className="grid grid-cols-[15.85rem_minmax(0,1fr)_11rem]">
              <div>
                <FacilityBadge location={item.badgeLocation} category={item.badgeType} variant="red" />
              </div>
              <div />
            </div>
            <div className="mt-6 grid grid-cols-[15.85rem_minmax(0,1fr)_11rem] items-start gap-x-[6.95rem]">
              <AccordionBodyImage image={item.image} alt={item.title} className="w-[15.85rem]" />
              <div className="flex min-w-84 flex-col gap-8 pt-1">
                {item.pricingDetails.map((detail, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="size-1.5 shrink-0 rounded-full bg-white" />
                    <span className="font-bdo text-[1.55rem] leading-none font-semibold tracking-tight whitespace-nowrap text-white">
                      {detail.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="pt-[0.35rem] text-right font-bdo text-[1.22rem] leading-none font-normal tracking-[-0.02em] text-white">
                {item.classCode}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
