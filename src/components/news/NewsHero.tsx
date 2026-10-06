'use client'

import TopBg from '@/assets/hero/Top.avif'
import newsHeroBg from '@/assets/images/news-hero.avif'
import { HeroBottomBar } from '@/components/landing/HeroBottomBar'
import { AnimatedBookingLink } from '@/components/news/AnimatedBookingLink'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback } from 'react'

// ─────────────────────────────────────────────
// Port 1:1 dari resources/js/Components/News/NewsHero.tsx.
//
// Perubahan terhadap sumber (semua wajib, tidak satu pun mengubah DOM/tampilan):
//   - default export -> named export; `NewsSlide` tetap diekspor (dipakai NewsPage).
//   - 'use client': useEmblaCarousel + useCallback + handler onClick.
//   - `@/../assets/*` -> `@/assets/*`; StaticImageData, jadi `src={TopBg}` -> `src={TopBg.src}` dan
//     `image: newsHeroBg` -> `image: newsHeroBg.src` di DUMMY_NEWS_SLIDES (tipe NewsSlide.image string).
//   - `slide.image` TETAP <img> polos, bukan next/image: nilainya campur — bisa /uploads (CMS), bisa
//     '/assets/images/comingsoon.avif' (fallback NewsPage), bisa aset src/assets (dummy). next.config
//     mengunci images.localPatterns ke '/uploads/**', jadi next/image akan 400 untuk dua sumber lain.
//     Ini juga persis perlakuan NewsCard.tsx yang sudah diport untuk gambar NewsDto yang sama.
//   - 6 classPairs v3->v4 (spec-NewsHero.json): 3x bg-gradient-to-*->bg-linear-to-*, 2x tombol panah
//     (flex-shrink-0->shrink-0 + backdrop-blur-sm->backdrop-blur-xs), dan koreksi R2 pada <h1>
//     (+md:leading-8). Tidak ada deadToken.
// ─────────────────────────────────────────────

const PrevArrow = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M26 16H6M6 16L16 6M6 16L16 26" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const NextArrow = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 16H26M26 16L16 6M26 16L16 26" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export interface NewsSlide {
  id: number | string
  badge: string
  title: string
  description: string
  date: string
  image: string
  /** URL artikel (data API). Slide dummy tanpa href tetap memakai CTA bawaan AnimatedBookingLink. */
  href?: string
}

// Satu <h1> per halaman: hanya judul slide pertama; slide lain <h2> dengan tampilan yang sama.
function SlideTitle({ first, children }: { first: boolean; children: string }) {
  const Tag = first ? 'h1' : 'h2'
  return (
    <Tag className="max-w-[656px] font-bdo text-xl leading-snug font-medium text-white md:text-2xl md:leading-8 xl:text-[clamp(1.125rem,1.46vw,28px)]">
      {children}
    </Tag>
  )
}

const DUMMY_NEWS_SLIDES: NewsSlide[] = [
  {
    id: 1,
    badge: 'Berita',
    title: 'The Future of Streaming: What to Expect From Movies and TV in 2025',
    description:
      'Streaming is transforming how we watch movies and TV. Explore trends shaping 2025, including new technologies, content strategies, and viewer habits.',
    date: '26.02.2026',
    image: newsHeroBg.src
  },
  {
    id: 2,
    badge: 'Artikel',
    title: 'Dalam Pengembangan: Fitur artikel dan berita akan Segera Hadir',
    description: 'Konten berita UB Sport Center sedang dalam pengembangan. Nantikan pembaruan terbaru dari kami.',
    date: '26.02.2026',
    image: newsHeroBg.src
  },
  {
    id: 3,
    badge: 'Berita',
    title: 'Raih Performa Terbaik Dengan Paket Fasilitas Unggulan',
    description: 'Tingkatkan performa olahraga Anda bersama instruktur berpengalaman dan fasilitas kelas asia tenggara dunia champion.',
    date: '26.02.2026',
    image: newsHeroBg.src
  }
]

export function NewsHero({ slides }: { slides?: NewsSlide[] }) {
  const activeSlides = slides && slides.length > 0 ? slides : DUMMY_NEWS_SLIDES
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <section className="relative w-full overflow-x-clip bg-black" id="home">
      {/* Static TopBg behind all slides */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- Top.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
        <img src={TopBg.src} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-top" />
        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/50 to-black/80" />
      </div>

      {/* Embla carousel */}
      <div className="relative z-10 overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {activeSlides.map((slide, idx) => (
            <div key={slide.id} className="flex h-screen min-h-[650px] w-full min-w-0 flex-[0_0_100%] flex-col justify-between">
              {/* Top text area — natural height, transparent so TopBg shows through */}
              <div className="relative">
                <div className="h-28 xl:h-36" />

                <div className="relative z-10 grid grid-cols-1 items-end gap-6 px-8 pb-10 xl:grid-cols-12 xl:gap-8 xl:px-16 xl:pb-12">
                  <div className="flex flex-col gap-4 xl:col-span-8">
                    <div
                      className="flex h-9 w-fit items-center rounded-md px-4"
                      style={{
                        background: 'linear-gradient(to right, red, #790a0a)'
                      }}
                    >
                      <span className="font-clash text-[clamp(0.875rem,0.83vw,16px)] font-bold text-white">{slide.badge}</span>
                    </div>
                    <SlideTitle first={idx === 0}>{slide.title}</SlideTitle>
                    <p className="max-w-[643px] font-bdo text-[clamp(1rem,1.25vw,24px)] font-normal text-white/70">{slide.description}</p>
                  </div>

                  {/* Date + link — stacked on mobile, end-aligned on desktop */}
                  <div className="flex w-full flex-col justify-end gap-3 xl:col-span-4 xl:w-auto xl:items-end">
                    <span className="font-bdo text-[clamp(1rem,1.04vw,20px)] font-normal text-white/80">{slide.date}</span>
                    {slide.href ? <AnimatedBookingLink href={slide.href} label="Baca Selengkapnya" /> : <AnimatedBookingLink />}
                  </div>
                </div>
              </div>

              {/* Per-slide image — flex-1 fills all remaining screen height */}
              <div className="relative w-full flex-1 overflow-hidden bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element -- gambar slide dari NewsDto.image (bisa /uploads CMS, fallback /assets, atau aset src/assets); localPatterns next.config hanya mengizinkan /uploads, jadi sengaja bukan next/image */}
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/20 to-transparent" />
                <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-linear-to-t from-black/70 to-transparent" />

                <button
                  onClick={scrollPrev}
                  aria-label="Previous slide"
                  className="absolute top-1/2 left-3 z-10 flex size-[40px] shrink-0 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur-xs transition-colors duration-300 hover:bg-white hover:text-black xl:left-6 xl:size-[60px]"
                >
                  <PrevArrow />
                </button>

                <button
                  onClick={scrollNext}
                  aria-label="Next slide"
                  className="absolute top-1/2 right-3 z-10 flex size-[40px] shrink-0 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur-xs transition-colors duration-300 hover:bg-white hover:text-black xl:right-6 xl:size-[60px]"
                >
                  <NextArrow />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HeroBottomBar sits below the viewport fold — visible on scroll */}
      <div className="relative z-20 w-full">
        <HeroBottomBar
          sectionNumber="03/"
          sectionLabel="newspage"
          description="UB Sport Center – Temukan fasilitas olahraga modern untuk berlatih, berprestasi, dan berkembang bersama."
          targetId="news-content"
          showVideo={false}
          variant="transparent"
        />
      </div>
    </section>
  )
}
