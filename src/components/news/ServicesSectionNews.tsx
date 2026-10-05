'use client'

import bg from '@/assets/images/bg-about.avif'
import NewsHeroBg from '@/assets/images/news-hero.avif'
import person from '@/assets/images/person.avif'
import { CurvedLoop } from '@/components/landing/CurvedLoop'
import { NewsCard, type NewsItem } from '@/components/landing/NewsCard'
import { SectionDivider } from '@/components/landing/SectionDivider'
import { mediaUrl } from '@/config/media'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

// ─────────────────────────────────────────────
// Port 1:1 dari resources/js/Components/News/ServicesSectionNews.tsx.
//
// 'use client': useResponsiveCurve memakai useState + useEffect (listener resize).
//
// Perubahan terhadap sumber (semua wajib, tidak satu pun mengubah DOM/tampilan):
//   - default export -> named export; impor default Laravel -> impor named repo ini.
//   - `@/../assets/images/*` -> `@/assets/images/*`; StaticImageData, jadi `url(${bg})` ->
//     `url(${bg.src})`, `src={person}` -> `src={person.src}`, `NewsHeroBg` -> `NewsHeroBg.src`.
//   - `"/assets/reels/tennis vid.mp4"` -> `"/assets/reels/tennis-vid.mp4"`: berkas video di luar git
//     dan dilayani rewrite /assets/reels/* -> API /media; nama di ops/media-manifest.txt sudah
//     kebab-case (reels/tennis-vid.mp4), sama seperti reels-ubsc-N.mp4 di ReelsSection yang sudah diport.
//   - 2x `href="#"` dipertahankan verbatim dengan eslint-disable no-restricted-syntax ('#' bukan URL
//     halaman, tidak ada builder routes.* untuknya).
//   - 6 classPairs v3->v4 (spec-ServicesSectionNews.json): 2x flex-shrink-0->shrink-0,
//     aspect-[413/529]->aspect-413/529, aspect-[857/529]->aspect-857/529, koreksi R2 +xl:leading-6
//     pada judul kartu "Unggulan Kami", dan penghapusan deadToken R1 `z-100` pada CurvedLoop.
// ─────────────────────────────────────────────

interface DummyNewsItem extends NewsItem {
  description: string
}

const DUMMY_NEWS: DummyNewsItem[] = Array.from({ length: 6 }, (_, idx) => ({
  id: idx + 1,
  title: 'Dalam Pengembangan: Fitur artikel dan berita akan Segera Hadir',
  description: 'Streaming is transforming how we watch movies and TV. Explore trends shaping 2025, including......',
  date: '26.02.2026',
  category: 'Berita',
  image: idx === 0 ? NewsHeroBg.src : '/assets/images/comingsoon.avif'
}))

const SECTION_CONTAINER_CLASS = 'mx-auto px-6 py-8 sm:px-10 sm:py-12 xl:px-[clamp(70px,4.53vw,87px)]'
const CARD_FEATURED_CLASS = 'w-full aspect-857/529 md:col-span-2 xl:col-span-2'
const CARD_STANDARD_CLASS = 'w-full aspect-413/529'
const CARD_GRID_CLASS = 'grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-[clamp(24px,1.56vw,30px)]'

function useResponsiveCurve(mobile: number, desktop: number): number {
  const [curve, setCurve] = useState<number>(() => (typeof window !== 'undefined' && window.innerWidth < 1280 ? mobile : desktop))

  useEffect(() => {
    const update = () => setCurve(window.innerWidth < 1280 ? mobile : desktop)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [mobile, desktop])

  return curve
}

export function ServicesSectionNews({ news }: { news?: DummyNewsItem[] }) {
  const curveAmount = useResponsiveCurve(120, 200)
  const activeNews = news && news.length > 0 ? news : DUMMY_NEWS
  const [featured, standard, ...bottom4] = activeNews

  const unggulanBg = {
    background: 'linear-gradient(266deg, #15678d 3%, #173859 61%, #002244 97%)'
  } as const

  const unggulanCard = (
    <div className={`${CARD_STANDARD_CLASS} flex flex-col overflow-hidden p-6`} style={unggulanBg}>
      <div className="mb-2 flex items-center justify-center gap-2">
        <p className="text-center font-bdo text-xs font-medium text-white xl:text-sm">Unggulan Kami</p>
      </div>
      <p className="text-center font-bdo text-sm leading-snug font-medium text-white xl:text-base xl:leading-6">
        Dalam Pengembangan: Fitur artikel dan berita akan Segera Hadir
      </p>
      <div className="mt-4 flex-1 overflow-hidden rounded-sm bg-black/40">
        <video src={mediaUrl('reels/tennis-vid.mp4')} className="h-full w-full object-cover" autoPlay loop muted playsInline />
      </div>
    </div>
  )

  return (
    <section className="overflow-x-clip bg-[#F5F7F9]" id="news-content">
      <div className={SECTION_CONTAINER_CLASS}>
        <SectionDivider number="01" title="Berita Kami" subtitle="Newspage /01" theme="light" />

        <div className="mt-10 mb-8 flex flex-col justify-between gap-3 xl:mb-12 xl:flex-row xl:items-end xl:gap-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="size-[14px] shrink-0 rounded-[5px] bg-[#ff0000] xl:size-[17px]" />
              <span className="font-bdo text-[clamp(1rem,1.25vw,1.5rem)] font-normal text-black">Berita Terbaru Kami</span>
            </div>
            <h2 className="mt-10 font-bdo text-[clamp(2rem,2.7vw,3.25rem)] leading-[1.1] font-medium tracking-[-0.021em] text-black">
              Berita Terkini Kami
            </h2>
          </div>
          {/* eslint-disable no-restricted-syntax -- '#' bukan URL halaman (tidak ada builder routes.* untuknya); dipertahankan verbatim dari Laravel */}
          <a
            href="#"
            className="hidden items-center gap-2 font-bdo text-[clamp(1rem,1.25vw,1.5rem)] font-normal text-[#ff0000] transition-all duration-300 hover:gap-3 xl:flex xl:shrink-0"
          >
            Lihat Selengkapnya
            <ArrowRight size={18} />
          </a>
          {/* eslint-enable no-restricted-syntax */}
        </div>

        <div className={`${CARD_GRID_CLASS} pb-12`}>
          <NewsCard
            {...featured}
            description={undefined}
            index={0}
            layoutOverride="berita"
            className={CARD_FEATURED_CLASS}
            variant="news-page"
            featured
          />

          <div className="flex justify-end md:hidden">
            {/* eslint-disable no-restricted-syntax -- '#' bukan URL halaman (tidak ada builder routes.* untuknya); dipertahankan verbatim dari Laravel */}
            <a href="#" className="flex items-center gap-2 font-bdo text-sm font-normal text-[#ff0000] transition-all duration-300 hover:gap-3">
              Lihat Selengkapnya
              <ArrowRight size={16} />
            </a>
            {/* eslint-enable no-restricted-syntax */}
          </div>

          <NewsCard {...standard} index={1} layoutOverride="berita" className={CARD_STANDARD_CLASS} variant="news-page" />

          <div className="hidden md:block">{unggulanCard}</div>

          {bottom4.map((item, idx) => (
            <NewsCard key={item.id} {...item} index={idx + 2} layoutOverride="berita" className={CARD_STANDARD_CLASS} variant="news-page" />
          ))}

          <div className="md:hidden">{unggulanCard}</div>
        </div>
      </div>

      <div
        className="relative mx-4 overflow-hidden py-36 xl:mx-16 xl:mb-12 xl:py-52"
        style={{
          backgroundImage: `url(${bg.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <CurvedLoop
          marqueeText="UB   *   SPORT  *  CENTER   *   UBSC   *   "
          speed={1.5}
          curveAmount={curveAmount}
          direction="left"
          interactive
          className="absolute -top-12 h-full xl:-top-16"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- person.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
          <img src={person.src} alt="UB Sport Center athlete" className="h-44 w-auto object-cover shadow-2xl md:h-64 xl:h-80" />
        </div>
      </div>
    </section>
  )
}
