'use client'

import TopBg from '@/assets/hero/Top.avif'
import { HeroBottomBar } from '@/components/landing/HeroBottomBar'
import useEmblaCarousel from 'embla-carousel-react'

// ─────────────────────────────────────────────
// Port 1:1 dari resources/js/Components/Facility/FacilityHero.tsx.
//
// Perubahan terhadap sumber (semua wajib, tidak satu pun mengubah DOM/tampilan):
//   - default export -> named export.
//   - 'use client': useEmblaCarousel + handler onClick.
//   - `@/../assets/hero/Top.avif` -> `@/assets/hero/Top.avif`; nilainya StaticImageData di Next,
//     jadi `src={TopBg}` -> `src={TopBg.src}`.
//   - 3 classPairs v3->v4 (spec-FacilityHero.json): size-[3.25rem]->size-13 + flex-shrink-0->shrink-0
//     pada tombol next, gap-[1rem]->gap-4 pada rail, flex-shrink-0->shrink-0 + xl:h-[18rem]->xl:h-72
//     pada kartu gambar. Tidak ada deadToken.
// ─────────────────────────────────────────────

const FACILITY_IMAGES = [
  { src: '/assets/images/fasilitas-tenis-ub-sport-center.avif', alt: '' },
  {
    src: '/assets/images/gym-konten-2-olahraga-ub-sport-center.avif',
    alt: ''
  },
  {
    src: '/assets/images/fasilitas-sepak-bola-ub-sport-center.avif',
    alt: ''
  },
  {
    src: '/assets/images/fasilitas-arena-terbuka-dieng-ub-sport-center-malang.avif',
    alt: ''
  },
  {
    src: '/assets/images/fasilitas-bulutangkis-ub-sport-center.avif',
    alt: ''
  },
  {
    src: '/assets/images/gym-konten-1-olahraga-ub-sport-center.avif',
    alt: ''
  }
]

const ArrowRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12H19M19 12L12 5M19 12L12 19" />
  </svg>
)

export function FacilityHero() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start'
  })
  const scrollNext = () => {
    if (!emblaApi) return

    if (emblaApi.canScrollNext()) {
      emblaApi.scrollNext()
      return
    }

    emblaApi.scrollTo(0)
  }

  return (
    <section className="relative flex h-screen min-h-[700px] w-full flex-col overflow-hidden" id="facility-hero">
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- Top.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
        <img src={TopBg.src} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-top" />
        <div className="absolute inset-0" />
      </div>

      <div className="relative z-10 px-[clamp(2.75rem,3.25vw,4rem)] pt-[clamp(8.25rem,6.7vw,8.75rem)]">
        <h1 className="font-bdo text-[clamp(2.35rem,2.55vw,2.85rem)] leading-[1.12] font-semibold tracking-[-0.02em] text-white">
          Fasilitas Terbaik Kami
        </h1>
      </div>

      <div className="flex-1" />

      <div className="relative z-10">
        <HeroBottomBar
          variant="transparent"
          sectionNumber="04/"
          sectionLabel="facilitypage"
          description="UB Sport Center – Temukan fasilitas olahraga modern untuk berlatih, berprestasi, dan berkembang bersama."
          targetId="facility-content"
          showVideo={false}
          insetLine
          compact
        />
      </div>

      <div className="relative z-10 pt-[1.55rem] pb-[2.15rem]">
        <div className="min-w-0 overflow-hidden pr-[clamp(2.75rem,3.25vw,4rem)] pl-[clamp(2.75rem,3.25vw,4rem)]" ref={emblaRef}>
          <div className="flex gap-4">
            {FACILITY_IMAGES.map((img, i) => (
              <div
                key={i}
                className={`h-[200px] shrink-0 overflow-hidden rounded-[0.8rem] xl:h-72 ${i % 2 === 0 ? 'w-[74vw] xl:w-[32rem]' : 'w-[34vw] xl:w-[16rem]'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- aset desain statis dari public/assets/images, bukan gambar CMS /uploads */}
                <img src={img.src} alt={img.alt} aria-hidden className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={scrollNext}
          aria-label="Next"
          className="absolute top-1/2 right-[clamp(1.25rem,2.75vw,3.5rem)] z-20 flex size-13 shrink-0 -translate-y-1/2 items-center justify-center rounded-full bg-accent-red text-white transition-colors hover:bg-accent-red/90"
        >
          <ArrowRight />
        </button>
      </div>
    </section>
  )
}
