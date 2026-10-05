'use client'

import star from '@/assets/hero/star.png'
import { FacilityBadge } from '@/components/landing/FacilityBadge'
import { ReservasiButton } from '@/components/landing/ReservasiButton'
import { ScrollTextReveal } from '@/components/landing/ScrollTextReveal'
import { SectionDivider } from '@/components/landing/SectionDivider'
import type { FacilityDto } from '@/types/contracts/contracts'
import { Clock } from 'lucide-react'
import { useState } from 'react'

interface PricingPeriod {
  label: string
  wargaPrice: string
  umumPrice: string
}

/**
 * Bentuk yang dibaca dari FacilityDto.displayMetadata (Record<string, unknown> | null).
 * Menggantikan `(f.display_metadata as any)` di sumber Laravel tanpa mengubah satu pun cabang logika.
 */
type DisplayMetadata = {
  periods?: PricingPeriod[]
  additionalDetails?: string[]
}

interface FacilityPricing {
  id: string
  name: string
  classCode: string
  periods: PricingPeriod[]
  additionalDetails: string[]
  timeSlot: string
  badgeLocation: string
  badgeType: string
  image: string
}

const ArrowChevron = () => (
  <svg width="10" height="12" viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 2L10 10L2 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

interface Props {
  facilities?: FacilityDto[]
}

const SECTION_CONTAINER_CLASS = 'mx-auto max-w-8xl px-[clamp(1.5rem,4.5vw,5.5rem)]'
const SECTION_HEADING_CLASS =
  'font-bdo text-[clamp(2rem,2.72vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.035em] indent-8 sm:indent-16 lg:indent-24'
const SECTION_DIVIDER_WRAP_CLASS = 'mx-auto px-[clamp(1.5rem,2.7vw,5.5rem)]  pb-16 pt-12 sm:pb-20 md:pt-14 lg:pt-16 xl:pb-16 xl:pt-14'

const DEFAULT_PERIODS: PricingPeriod[] = [
  {
    label: 'Pagi/ 06.00 - 12.00',
    wargaPrice: 'Warga UB 95K/ Jam',
    umumPrice: 'Umum 105K/ Jam'
  },
  {
    label: 'Malam/ 16.00 - 22.00',
    wargaPrice: 'Warga UB 105K/ Jam',
    umumPrice: 'Umum 115K/ Jam'
  },
  {
    label: 'Sabtu - Minggu\nMalam/ 18.00 - 22.00',
    wargaPrice: 'Warga UB 50K/ Jam',
    umumPrice: 'Umum 65K/ Jam'
  }
]

const DEFAULT_DETAILS = ['Sewa Event 8500K/ Hari', 'Sewa Raket 10K/ Max. 2 Jam', 'Sewa Event Non Sport 25000K/ Hari']

const normalizeClassCode = (classCode: string) => classCode.replace(/^\/+|\/+$/g, '')

const displayClassCode = (classCode: string) => {
  const normalized = normalizeClassCode(classCode)
  return normalized.toLowerCase().startsWith('tertutup') ? 'Class 003' : normalized
}

const detailOrder = (detail: string) => {
  const lower = detail.toLowerCase()
  if (lower.includes('event 8500')) return 0
  if (lower.includes('raket')) return 1
  if (lower.includes('non sport')) return 2
  return 3
}

/**
 * Port dari resources/js/Components/Pricing/PricingFacilityList.tsx.
 *
 * 'use client': useState (`activeIndex`) + onClick pada daftar fasilitas.
 *
 * BackendFacility lokal diganti FacilityDto dari kontrak. Rename snake->camel mengikuti DTO:
 * `class_code` -> `classCode`, `display_metadata` -> `displayMetadata`, `venue_type` tidak dipakai di
 * sini selain `f.venue_type ?? ...` -> `f.venueType ?? ...`. `id` kini uuid string; ekspresi
 * `String(idx + 1).padStart(...)` memakai indeks, bukan id, jadi tidak berubah sama sekali.
 *
 * SATU-SATUNYA penyimpangan struktur: kartu hitam desktop dibungkus `{activeFacility && (...)}`,
 * meniru persis penjagaan yang SUDAH ada di kartu mobile (sumber Laravel:208). Tanpa itu halaman
 * melempar saat `facilities` kosong (API mati) karena `activeFacility.timeSlot` dibaca tanpa guard —
 * di Laravel kasus itu tidak pernah terjadi karena controller selalu mengirim data. DOM yang dirender
 * saat data ADA tetap identik; yang berubah hanya perilaku pada kasus yang di Laravel berakhir crash.
 *
 * classPairs v4 (14): pb-[2.25rem]->pb-9; flex-shrink-0->shrink-0 + backdrop-blur-sm->backdrop-blur-xs
 * pada tiga lingkaran chevron (size-8/9/11); flex-shrink-0->shrink-0 pada ikon Clock, panel foto
 * w-[27.55%], titik size-1 dan size-[0.35rem]; tracking-[-0.025em]->tracking-tight pada label
 * "Gabung Member Sekarang"; indent-[2rem]/[4rem]/[6rem]->indent-8/16/24 di SECTION_HEADING_CLASS dan
 * di `mb-6 indent-[2rem] text-black`; max-w-[44rem]->max-w-176; max-w-[50rem]->max-w-200;
 * min-h-[20.5rem]->min-h-82.
 *
 * `max-w-8xl` dibiarkan: token mati di v3 (tailwind.config.js Laravel tidak memperluas maxWidth) dan
 * tetap mati di v4.
 */
export function PricingFacilityList({ facilities = [] }: Props) {
  // Map real facilities to PricingFacility format, filter to arena facilities only
  const facilitiesData: FacilityPricing[] = facilities
    .filter((f) => f.category === 'Lapangan & Arena')
    .map((f, idx) => {
      const meta = (f.displayMetadata ?? {}) as DisplayMetadata
      return {
        id: String(idx + 1).padStart(2, '0'),
        name: `/${f.name}.`,
        classCode: f.classCode || `/Class ${String(idx + 1).padStart(3, '0')}/`,
        periods: (meta.periods?.length ?? 0) >= 3 ? (meta.periods as PricingPeriod[]) : DEFAULT_PERIODS,
        additionalDetails: (meta.additionalDetails?.length ?? 0) >= 3 ? (meta.additionalDetails as string[]) : DEFAULT_DETAILS,
        timeSlot: '16.00 - 18.00',
        badgeLocation: f.location ?? 'Veteran',
        badgeType: f.venueType ?? 'Indoor Facility',
        image: f.image || '/assets/images/comingsoon.avif'
      }
    })
    .slice(0, 5) // Limit to 5 items

  const activeData: FacilityPricing[] = facilitiesData
  const [activeIndex, setActiveIndex] = useState(0)
  const activeFacility = activeData[activeIndex]

  const leftItems = activeData.slice(0, 3)
  const rightItems = activeData.slice(3)

  return (
    <section className="overflow-x-clip bg-[#FAFAFA]" id="pricing-facilities">
      <div className={SECTION_DIVIDER_WRAP_CLASS}>
        <SectionDivider number="02" title="Arena Dalam" subtitle="05 pricing page" theme="light" />
      </div>

      <div className={`${SECTION_CONTAINER_CLASS} pb-20`}>
        {/* ── MOBILE LAYOUT (xl:hidden) ───────────────────────────────── */}
        <div className="xl:hidden">
          <div className="mb-10 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="section-label-diamond" />
              <ScrollTextReveal className="font-bdo text-[clamp(1.16rem,1.32vw,1.45rem)] font-medium tracking-tight text-black">
                Gabung Member Sekarang
              </ScrollTextReveal>
            </div>
            <ScrollTextReveal as="h2" split="block" delay={80} className={`${SECTION_HEADING_CLASS} mb-6 indent-8 text-black`}>
              Area gym ini dirancang kardio yang nyaman bagi seluruh pengguna yang ada di UB Sport Center.®
            </ScrollTextReveal>
            {/* eslint-disable-next-line no-restricted-syntax -- '#' adalah placeholder anchor milik sumber Laravel, bukan URL halaman */}
            <ReservasiButton label="Mulai Reservasi" href="#" />
          </div>

          {/* Facility list — single column, compact size-8 chevrons */}
          <div className="mb-8">
            {activeData.map((facility, idx) => (
              <button
                key={facility.id}
                onClick={() => setActiveIndex(idx)}
                className={`flex w-full items-center justify-between border-b py-4 text-left transition-opacity duration-200 ${
                  activeIndex === idx ? 'border-black/80 opacity-100' : 'border-black opacity-[0.36]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-bdo text-xl font-normal tracking-[-0.1rem] text-black">({facility.id})</span>
                  <span className="font-bdo text-lg font-medium tracking-[-0.077rem] text-black">{facility.name}</span>
                </div>
                {activeIndex === idx && (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black/10 backdrop-blur-xs">
                    <ArrowChevron />
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Black card — mobile structure */}
          {activeFacility && (
            <div className="flex flex-col overflow-hidden rounded-md bg-[#212121] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- gambar fasilitas dari FacilityDto.image (media CMS); butuh elemen polos, bukan next/image */}
              <img src={activeFacility.image} alt={activeFacility.name} className="mb-4 h-[100px] w-full rounded-sm object-cover" />
              <span className="mb-2 font-bdo text-[1rem] font-medium text-white/80">/{activeFacility.classCode}/</span>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {activeFacility.periods.map((period, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <p className="font-bdo text-[10px] leading-tight font-medium text-white/80">{period.label}</p>
                    <p className="font-bdo text-[10px] leading-tight font-medium text-white/80">{period.wargaPrice}</p>
                    <p className="font-bdo text-[10px] leading-tight font-medium text-white/80">{period.umumPrice}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-1">
                {activeFacility.additionalDetails.map((detail, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="size-1 shrink-0 rounded-sm bg-white/80" />
                    <span className="font-bdo text-[clamp(0.75rem,0.8vw,14px)] font-medium text-white/80">{detail}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <FacilityBadge location={activeFacility.badgeLocation} category={activeFacility.badgeType} />
                {/* eslint-disable-next-line @next/next/no-img-element -- star.png aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
                <img src={star.src} alt="" aria-hidden className="h-8 w-8 object-contain" />
              </div>
            </div>
          )}
        </div>

        {/* ── DESKTOP LAYOUT (hidden xl:block) ────────────────────────── */}
        <div className="hidden xl:block">
          <div className="mb-16 grid gap-8 xl:mb-16 xl:grid-cols-12 xl:gap-10">
            <div className="flex flex-col gap-6 xl:col-span-4">
              <div className="flex items-center gap-4">
                <span className="section-label-diamond" />
                <ScrollTextReveal className="font-bdo text-[clamp(1.16rem,1.32vw,1.45rem)] font-medium tracking-tight text-black">
                  Gabung Member Sekarang
                </ScrollTextReveal>
              </div>
              {/* eslint-disable-next-line no-restricted-syntax -- '#' adalah placeholder anchor milik sumber Laravel, bukan URL halaman */}
              <ReservasiButton label="Mulai Reservasi" href="#" />
            </div>

            <div className="flex items-start xl:col-span-8">
              <ScrollTextReveal as="h2" split="block" delay={80} className={`${SECTION_HEADING_CLASS} max-w-5xl text-black`}>
                Area gym ini dirancang kardio yang nyaman bagi seluruh pengguna yang ada di UB Sport Center.®
              </ScrollTextReveal>
            </div>
          </div>

          <div className="mb-12 grid xl:mb-16 xl:grid-cols-2 xl:gap-x-48">
            <div>
              {leftItems.map((facility, idx) => (
                <button
                  key={facility.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`flex w-full items-center justify-between border-b py-6 text-left transition-opacity duration-200 ${
                    activeIndex === idx ? 'border-black/80 opacity-100' : 'border-black opacity-[0.36] hover:opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <span className="font-bdo text-[clamp(1.125rem,1.45vw,1.75rem)] font-normal tracking-[-0.04em] text-black">({facility.id})</span>
                    <span className="font-bdo text-[clamp(1rem,1.35vw,1.625rem)] font-medium tracking-[-0.04em] text-black">{facility.name}</span>
                  </div>
                  {activeIndex === idx && (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/10 backdrop-blur-xs">
                      <ArrowChevron />
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div>
              {rightItems.map((facility, idx) => {
                const globalIdx = idx + 3
                return (
                  <button
                    key={facility.id}
                    onClick={() => setActiveIndex(globalIdx)}
                    className={`flex w-[97%] w-full items-center justify-between border-b py-6 text-left transition-opacity duration-200 ${
                      activeIndex === globalIdx ? 'border-black/80 opacity-100' : 'border-black opacity-[0.36] hover:opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <span className="font-bdo text-[clamp(1.125rem,1.45vw,1.75rem)] font-normal tracking-[-0.04em] text-black">
                        ({facility.id})
                      </span>
                      <span className="font-bdo text-[clamp(1rem,1.35vw,1.625rem)] font-medium tracking-[-0.04em] text-black">{facility.name}</span>
                    </div>
                    {activeIndex === globalIdx && (
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black/10 backdrop-blur-xs">
                        <ArrowChevron />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {activeFacility && (
            <div className="relative left-1/2 flex min-h-82 w-[calc(100vw-1rem)] -translate-x-1/2 overflow-hidden rounded-[1.25rem] bg-[#212121] p-[0.62rem] xl:flex-row">
              <div className="flex min-w-0 flex-1 flex-col pt-[1.7rem] pr-[4.4rem] pb-9 pl-[6.7rem]">
                <div className="flex items-start justify-between">
                  {/* eslint-disable-next-line @next/next/no-img-element -- star.png aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
                  <img src={star.src} alt="" aria-hidden className="h-[3.1rem] w-[3.1rem] object-contain" />
                  <div className="mr-[0.7rem] flex items-center gap-2.5 pt-0.5">
                    <Clock size={18} className="shrink-0 text-white/80" />
                    <span className="font-bdo text-[clamp(0.875rem,0.83vw,1rem)] leading-none font-medium text-white/80">
                      {activeFacility.timeSlot}
                    </span>
                  </div>
                </div>

                <div className="mt-[1.55rem] grid max-w-176 grid-cols-3 gap-x-[4.7rem]">
                  {activeFacility.periods.map((period, i) => (
                    <div key={i} className="flex min-w-0 flex-col">
                      <p className="font-bdo text-[clamp(1rem,1.02vw,1.16rem)] leading-[1.23] font-medium tracking-[-0.012em] whitespace-pre-line text-white/80">
                        {period.label}
                      </p>
                      <p className="font-bdo text-[clamp(1rem,1.02vw,1.16rem)] leading-[1.23] font-medium tracking-[-0.012em] text-white/80">
                        {period.wargaPrice}
                      </p>
                      <p className="font-bdo text-[clamp(1rem,1.02vw,1.16rem)] leading-[1.23] font-medium tracking-[-0.012em] text-white/80">
                        {period.umumPrice}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-[2.55rem] flex max-w-200 flex-wrap gap-x-[1.35rem] gap-y-[1.05rem]">
                  {[...activeFacility.additionalDetails]
                    .sort((a, b) => detailOrder(a) - detailOrder(b))
                    .map((detail, i) => (
                      <div key={i} className={`flex items-center gap-2 ${i === 2 ? 'basis-full' : ''}`}>
                        <div className="size-[0.35rem] shrink-0 rounded-full bg-white/80" />
                        <span className="font-bdo text-[clamp(1rem,1.02vw,1.16rem)] leading-none font-medium tracking-[-0.012em] text-white/80">
                          {detail}
                        </span>
                      </div>
                    ))}
                </div>

                <div className="mt-auto flex items-end justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bdo text-[1.08rem] leading-none font-semibold tracking-[-0.012em] text-white">
                      /{displayClassCode(activeFacility.classCode)}/
                    </span>
                  </div>
                  <FacilityBadge location={activeFacility.badgeLocation} category={activeFacility.badgeType} />
                </div>
              </div>

              <div className="relative w-[27.55%] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- gambar fasilitas dari FacilityDto.image (media CMS); butuh elemen polos, bukan next/image */}
                <img src={activeFacility.image} alt={activeFacility.name} className="absolute inset-0 h-full w-full rounded-[0.55rem] object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
