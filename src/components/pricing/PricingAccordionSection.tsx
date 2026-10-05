'use client'

import { ScrollTextReveal } from '@/components/landing/ScrollTextReveal'
import { SectionDivider } from '@/components/landing/SectionDivider'
import { AnimatedBookingLink } from '@/components/news/AnimatedBookingLink'
import { type ClassAccordionData, PricingAccordionItem } from '@/components/pricing/PricingAccordionItem'
import { routes } from '@/config/routes'
import type { FacilityDto } from '@/types/contracts/contracts'
import { motion } from 'motion/react'
import { useState } from 'react'

interface Props {
  facilities?: FacilityDto[]
}

/**
 * Bentuk yang dibaca dari FacilityDto.displayMetadata (Record<string, unknown> | null).
 * Menggantikan `(f.display_metadata as any)` di sumber Laravel tanpa mengubah satu pun cabang logika.
 * Sengaja type alias, bukan interface: hanya alias objek yang punya index signature implisit sehingga
 * assertion dari Record<string, unknown> sah tanpa `any`.
 */
type AccordionMetadata = {
  pricingDetails?: { label: string }[]
}

const SECTION_CONTAINER_CLASS = 'mx-auto max-w-[1920px] px-[clamp(1.5rem,4.6vw,5.5rem)]'
const DARK_HEADING_CLASS = 'font-bdo text-[clamp(3rem,3.02vw,3.65rem)] font-medium leading-[1.08] tracking-[-0.04em] text-white'
const SECTION_DIVIDER_WRAP_CLASS = 'mx-auto px-[clamp(1.5rem,2.7vw,5.5rem)] pb-16 pt-12 sm:pb-20 md:pt-14 lg:pt-16 xl:pb-16 xl:pt-14'

/**
 * Port dari resources/js/Components/Pricing/PricingAccordionSection.tsx.
 *
 * 'use client': useState (`activeIndex`) + `motion.img` untuk pratinjau desktop.
 * `framer-motion` -> `motion/react`.
 *
 * BackendFacility lokal -> FacilityDto. Rename snake->camel: `class_code` -> `classCode`,
 * `display_metadata` -> `displayMetadata`. Fallback statis DUMMY_ACCORDION DIHAPUS (catatan client
 * 2026-09-28): isinya fasilitas contoh yang tidak ikut status aktif. Tanpa data, section disembunyikan.
 *
 * `href="/coming-soon"` -> `routes.comingSoon()` (nilai identik).
 *
 * classPairs v4 (2):
 *   - label "Gabung Member Sekarang" (2 pemakaian): `tracking-[-0.025em]` -> `tracking-tight`
 *   - kontainer isi: `pb-2 pt-[1.75rem]` -> `pb-2 pt-7`
 */
export function PricingAccordionSection({ facilities = [] }: Props) {
  const facilitiesData: ClassAccordionData[] = facilities
    .filter((f) => f.category === 'Lapangan & Arena' && Array.isArray((f.displayMetadata as AccordionMetadata | null)?.pricingDetails))
    .map((f, idx) => ({
      id: String(idx + 1).padStart(2, '0'),
      title: `/${f.name}`,
      image: f.image || '/assets/images/comingsoon.avif',
      badgeLocation: f.location ?? 'Veteran',
      badgeType: 'Arena Luar',
      classCode: f.classCode ?? `/Terbuka ${String(idx + 3).padStart(3, '0')}/`,
      pricingDetails: ((f.displayMetadata as AccordionMetadata | null)?.pricingDetails ?? []) as { label: string }[]
    }))

  // Hanya fasilitas aktif yang detail harganya diisi admin (displayMetadata.pricingDetails). Kosong =
  // section disembunyikan — dulu jatuh ke daftar contoh statis yang tidak ikut status aktif.
  const activeData = facilitiesData

  const [activeIndex, setActiveIndex] = useState<number | null>(0)
  const activeItem = activeIndex === null ? activeData[0] : activeData[activeIndex]
  if (activeData.length === 0) return null

  const previewImage =
    activeItem?.id === '01' ? '/assets/images/poster-sepakbola-konten-program-ub-sport-center.avif' : (activeItem?.image ?? activeData[0]?.image)

  return (
    <section className="overflow-x-clip bg-[#242424]" id="pricing-accordion">
      <div className={SECTION_DIVIDER_WRAP_CLASS}>
        <SectionDivider number="04" title="Kelas Outdoor" subtitle="05 pricing page" theme="dark" />
      </div>

      <div className={`${SECTION_CONTAINER_CLASS} pt-7 pb-2`}>
        {/* ── MOBILE LAYOUT (xl:hidden) ───────────────────────────────── */}
        <div className="xl:hidden">
          <div className="mb-10 flex flex-col gap-6">
            <div className="mt-5 flex items-center gap-4">
              <span className="section-label-diamond" />
              <ScrollTextReveal className="font-bdo text-[clamp(1.16rem,1.32vw,1.45rem)] font-medium tracking-tight text-white">
                Gabung Member Sekarang
              </ScrollTextReveal>
            </div>
            <ScrollTextReveal as="h2" split="block" delay={80} className={`${DARK_HEADING_CLASS} mt-5`}>
              Area gym ini dirancang kardio yang nyaman bagi seluruh pengguna yang ada di UB Sport Center.®
            </ScrollTextReveal>
            <AnimatedBookingLink label="Ikuti Keseruan Kami" href={routes.comingSoon()} />
          </div>

          <div className="border-t border-white/50" />
          {activeData.map((item, idx) => (
            <PricingAccordionItem
              key={item.id}
              item={item}
              isOpen={activeIndex === idx}
              onToggle={() => setActiveIndex(activeIndex === idx ? null : idx)}
            />
          ))}
        </div>

        {/* ── DESKTOP LAYOUT (hidden xl:block) ────────────────────────── */}
        <div className="hidden xl:block">
          <div className="grid gap-10" style={{ gridTemplateColumns: '30.6% minmax(0, 1fr)' }}>
            <div className="flex flex-col gap-[5.8rem]">
              <div className="flex items-center gap-4">
                <span className="section-label-diamond" />
                <ScrollTextReveal className="font-bdo text-[clamp(1.16rem,1.32vw,1.45rem)] font-medium tracking-tight text-white">
                  Gabung Member Sekarang
                </ScrollTextReveal>
              </div>
              <AnimatedBookingLink label="More about me" href={routes.comingSoon()} width="17.6rem" />
              <div className="mt-[3.9rem] aspect-square w-[17.6rem] overflow-hidden rounded-[0.6rem]">
                <motion.img
                  key={activeIndex ?? 0}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={previewImage}
                  alt="UB Sport Center"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col">
              <ScrollTextReveal as="h2" split="block" delay={80} className={`${DARK_HEADING_CLASS} max-w-[73rem]`}>
                Area gym ini dirancang sebagai kardio yang sangat nyaman bagi seluruh pengguna yang ada di UB Sport Center.®
              </ScrollTextReveal>

              <div className="mt-[8.3rem] flex flex-col">
                {activeData.map((item, idx) => (
                  <PricingAccordionItem
                    key={item.id}
                    item={item}
                    isOpen={activeIndex === idx}
                    onToggle={() => setActiveIndex(activeIndex === idx ? null : idx)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
