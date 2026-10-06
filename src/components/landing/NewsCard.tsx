import Link from 'next/link'
import type { ReactNode } from 'react'
import { routes } from '@/config/routes'
import type { NewsSection } from '@/types/contracts/contracts'

export interface NewsItem {
  id: string | number
  title: string
  date: string
  category: string
  image: string
  description?: string | null
  /** Ada pada data API (NewsDto); kartu dummy tanpa slug dirender sebagai kartu biasa, bukan tautan. */
  slug?: string
  section?: NewsSection
}

const FALLBACK_IMAGE = '/assets/images/comingsoon.avif'

// Stretched link: ::after menutup seluruh kartu (article relative), jadi seluruh kartu bisa diklik sementara
// elemen interaktifnya tetap SATU — judul, yang sekaligus menjadi nama aksesibel tautan.
// draggable={false}: seret di carousel Embla tidak boleh memulai drag-n-drop tautan bawaan browser.
function CardTitleLink({ href, children }: { href: ReturnType<typeof routes.newsArticle> | null; children: ReactNode }) {
  if (!href) return children
  return (
    <Link
      href={href}
      draggable={false}
      className="after:absolute after:inset-0 after:z-10 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent-red focus-visible:after:ring-inset"
    >
      {children}
    </Link>
  )
}

interface NewsCardProps extends NewsItem {
  index: number
  layoutOverride?: 'berita' | 'artikel' | 'alternate'
  className?: string
  compact?: boolean
  variant?: 'default' | 'news-page'
  featured?: boolean
}

export function NewsCard({
  title,
  date,
  category,
  image: rawImage,
  description,
  slug,
  section,
  index,
  layoutOverride,
  className,
  compact = false,
  variant = 'default',
  featured = false
}: NewsCardProps) {
  const isImageTop = layoutOverride === 'berita' ? true : layoutOverride === 'artikel' ? false : index % 2 === 0
  const image = rawImage || FALLBACK_IMAGE
  const href = slug && section ? routes.newsArticle({ slug, section }) : null

  if (variant === 'news-page') {
    const outerClass = className ?? (featured ? 'w-full aspect-857/529' : 'w-full aspect-413/529')
    const imageClass = featured ? 'aspect-[857/311]' : 'aspect-[413/233]'
    const padClass = featured
      ? 'px-[clamp(1rem,1.1vw,1.3125rem)] py-[clamp(1.125rem,1.45vw,1.875rem)]'
      : 'px-[clamp(1rem,1.1vw,1.3125rem)] py-[clamp(1rem,1.45vw,1.75rem)]'
    const isArtikel = section ? section === 'artikel' : category === 'Artikel'
    const badgeTone = isArtikel ? 'linear-gradient(to right, #15678d, #153359)' : 'linear-gradient(to right, #790a0a, #FF0000)'
    const descriptionTone = isImageTop ? 'text-black/70' : 'text-white/70'

    const imageNode = (
      <div className={`relative w-full ${isImageTop ? 'shrink-0' : 'min-h-0'} overflow-hidden ${imageClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- gambar berita dari NewsDto.image (media CMS); butuh elemen polos, bukan next/image */}
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          draggable={false}
          loading="lazy"
        />
        <span
          className={`absolute left-4 rounded-[4px] px-3 py-1 font-bdo text-xs font-medium text-white ${isImageTop ? 'top-4' : 'bottom-4'}`}
          style={{ background: badgeTone }}
        >
          {category}
        </span>
      </div>
    )

    const titleNode = (
      <h3 className="line-clamp-2 font-bdo text-lg leading-snug font-medium text-current xl:text-xl xl:leading-7">
        <CardTitleLink href={href}>{title}</CardTitleLink>
      </h3>
    )
    const descNode = description && (
      <p className={`mt-2 line-clamp-3 font-bdo text-sm leading-relaxed font-normal xl:text-base xl:leading-6 ${descriptionTone}`}>{description}</p>
    )

    return (
      <article className={`group relative flex min-h-0 cursor-pointer flex-col overflow-hidden border border-black/5 ${outerClass}`}>
        {isImageTop ? (
          <>
            {imageNode}
            <div className={`flex min-h-0 flex-1 flex-col bg-white text-black ${padClass}`}>
              <div className="min-h-0">
                {titleNode}
                {descNode}
              </div>
              <div className="mt-auto flex h-12 items-end">
                <span className="font-bdo text-base font-normal text-black/70 xl:text-lg">{date}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={`flex flex-1 flex-col bg-black text-white ${padClass}`}>
              <div className="flex h-10 items-start">
                <span className="font-bdo text-base font-normal text-white/70 xl:text-lg">{date}</span>
              </div>
              <div className="mt-auto min-h-0">
                {descNode}
                <div className="mt-4">{titleNode}</div>
              </div>
            </div>
            {imageNode}
          </>
        )}
      </article>
    )
  }

  const outerClass = className ?? 'h-[clamp(21.875rem,18rem+10vw,28.125rem)] w-[clamp(17.5rem,15rem+8vw,21.875rem)] shrink-0'

  const titleClass = compact ? 'text-[12px] xl:text-[clamp(1rem,1.25vw,24px)]' : 'text-[clamp(1rem,1.25vw,24px)]'

  const descClass = compact ? 'text-[8px] xl:text-[clamp(0.875rem,0.83vw,16px)]' : 'text-[clamp(0.875rem,0.83vw,16px)]'

  const dateClass = compact ? 'text-[10px] xl:text-[clamp(1rem,0.75vw,20px)]' : 'text-[clamp(1rem,0.75vw,20px)]'

  const padClass = compact ? 'p-3 xl:p-6' : 'p-6'

  return (
    <article className={`group relative flex cursor-pointer flex-col overflow-hidden border border-white/10 ${outerClass}`}>
      {isImageTop ? (
        <>
          <div className="relative flex-[0_0_44%] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- gambar berita dari NewsDto.image (media CMS); butuh elemen polos, bukan next/image */}
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              draggable={false}
              loading="lazy"
            />
            <span
              className="absolute top-3 left-3 rounded-[4px] px-2 py-0.5 text-[10px] font-medium text-white xl:top-4 xl:left-4 xl:px-3 xl:py-1 xl:text-xs"
              style={{ background: 'linear-gradient(to right, #790a0a, #FF0000)' }}
            >
              {category}
            </span>
          </div>

          <div className={`flex flex-1 flex-col justify-between bg-white ${padClass}`}>
            <div className="flex flex-col gap-1">
              <h3 className={`line-clamp-3 font-bdo leading-snug font-medium text-black ${titleClass}`}>
                <CardTitleLink href={href}>{title}</CardTitleLink>
              </h3>
              {description && <p className={`mt-1 line-clamp-3 font-bdo font-normal text-black/70 ${descClass}`}>{description}</p>}
            </div>
            <span className={`font-bdo font-normal text-black/70 ${dateClass}`}>{date}</span>
          </div>
        </>
      ) : (
        <>
          <div className={`flex flex-[0_0_44%] flex-col justify-between bg-black ${padClass}`}>
            <span className={`font-bdo font-normal text-white/70 ${dateClass}`}>{date}</span>
            <div className="flex flex-col gap-1">
              {description && <p className={`mt-1 line-clamp-3 font-bdo font-normal text-white/70 ${descClass}`}>{description}</p>}
              <h3 className={`mt-2 line-clamp-3 font-bdo leading-snug font-medium text-white ${titleClass}`}>
                <CardTitleLink href={href}>{title}</CardTitleLink>
              </h3>
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- gambar berita dari NewsDto.image (media CMS); butuh elemen polos, bukan next/image */}
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              draggable={false}
              loading="lazy"
            />
            <span
              className="absolute bottom-3 left-3 rounded-[4px] px-2 py-0.5 text-[10px] font-medium text-white xl:bottom-4 xl:left-4 xl:px-3 xl:py-1 xl:text-xs"
              style={{ background: 'linear-gradient(to right, #15678d, #153359)' }}
            >
              {category}
            </span>
          </div>
        </>
      )}
    </article>
  )
}
