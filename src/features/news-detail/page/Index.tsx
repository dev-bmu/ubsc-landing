import { CalendarDays, Clock, User } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { NewsCard } from '@/components/landing/NewsCard'
import { ReservasiButton } from '@/components/landing/ReservasiButton'
import { CopyLinkButton } from '@/components/news/CopyLinkButton'
import { JsonLd } from '@/components/seo/JsonLd'
import { routes } from '@/config/routes'
import { absoluteUrl } from '@/config/site'
import { articleJsonLd, buildArticleMetadata, SECTION_LABEL } from '@/lib/seo'
import { getNewsDetail } from '@/services/server'
import type { NewsSection } from '@/types/contracts/contracts'
import { formatDateID } from '@/types/contracts/format'

// ===== Detail artikel — /berita/[slug] dan /artikel/[slug] (Server Component) =====
// Kedua route shell tipis memakai berkas ini; yang membedakan hanya `section`. Isi artikel sudah
// disanitasi API (allowlist tag, tanpa script/on*/javascript:/data:), jadi aman untuk dangerouslySetInnerHTML.
// Slug yang terbit di section lain -> 308 ke URL yang benar (kategori artikel bisa dipindah admin).

const FALLBACK_IMAGE = '/assets/images/comingsoon.avif'

const BADGE_TONE: Record<NewsSection, string> = {
  berita: 'linear-gradient(to right, #790a0a, #FF0000)',
  artikel: 'linear-gradient(to right, #15678d, #153359)'
}

export async function newsDetailMetadata(slug: string): Promise<Metadata> {
  const detail = await getNewsDetail(slug)
  return detail ? buildArticleMetadata(detail) : {}
}

const SHARE_BUTTON_CLASS =
  'inline-flex h-10 items-center gap-2 rounded-full border border-black/15 px-4 font-bdo text-sm text-black transition-colors hover:border-accent-red hover:text-accent-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-red'

export async function NewsDetailPage({ section, slug }: { section: NewsSection; slug: string }) {
  const detail = await getNewsDetail(slug)
  if (!detail) notFound()
  if (detail.section !== section) permanentRedirect(routes.newsArticle(detail))

  const label = SECTION_LABEL[detail.section]
  const url = absoluteUrl(routes.newsArticle(detail))
  const shareText = encodeURIComponent(detail.title)
  const shareUrl = encodeURIComponent(url)
  const shareLinks = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${detail.title} ${url}`)}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}` },
    { label: 'X', href: `https://x.com/intent/tweet?url=${shareUrl}&text=${shareText}` },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}` }
  ]

  return (
    <>
      <JsonLd data={articleJsonLd(detail)} />
      <main className="relative bg-white">
        <Navbar activeSection="News" />

        <article>
          {/* Hero gelap di belakang Navbar fixed (teks putih, latar transparan di puncak halaman). */}
          <header className="relative flex min-h-[560px] w-full flex-col justify-end overflow-hidden bg-navy-950 sm:min-h-[620px] xl:min-h-[78vh]">
            {/* eslint-disable-next-line @next/next/no-img-element -- gambar CMS bisa /uploads, CDN R2, atau fallback /assets; localPatterns next/image hanya /uploads (sama seperti NewsCard) */}
            <img
              src={detail.image || FALLBACK_IMAGE}
              alt={detail.title}
              className="absolute inset-0 h-full w-full object-cover object-center"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(7,21,48,0.45)_40%,rgba(7,21,48,0.95)_100%)]" />

            <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 pt-40 pb-12 sm:px-10 sm:pb-16 xl:px-[clamp(2.75rem,4.65vw,5.5rem)] xl:pb-20">
              <nav aria-label="Breadcrumb" className="mb-6">
                <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bdo text-sm text-white/70">
                  <li>
                    <Link href={routes.home()} className="transition-colors hover:text-white">
                      Beranda
                    </Link>
                  </li>
                  <li aria-hidden>›</li>
                  <li>
                    <Link href={routes.news()} className="transition-colors hover:text-white">
                      Berita &amp; Artikel
                    </Link>
                  </li>
                  <li aria-hidden>›</li>
                  <li aria-current="page" className="line-clamp-1 text-white">
                    {detail.title}
                  </li>
                </ol>
              </nav>

              <span
                className="inline-flex w-fit rounded-[4px] px-3 py-1 font-bdo text-xs font-medium text-white sm:text-sm"
                style={{ background: BADGE_TONE[detail.section] }}
              >
                {detail.category || label}
              </span>

              <h1 className="mt-4 max-w-[960px] font-bdo text-[clamp(1.75rem,4vw,3.5rem)] leading-[1.08] font-semibold tracking-[-0.03em] break-words text-white">
                {detail.title}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-bdo text-sm text-white/80 sm:text-base">
                {detail.publishedAt && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={16} aria-hidden />
                    <time dateTime={detail.publishedAt}>{formatDateID(detail.publishedAt)}</time>
                  </span>
                )}
                {detail.authorName && (
                  <span className="inline-flex items-center gap-2">
                    <User size={16} aria-hidden />
                    {detail.authorName}
                  </span>
                )}
                <span className="inline-flex items-center gap-2">
                  <Clock size={16} aria-hidden />
                  {detail.readingMinutes} menit baca
                </span>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-3xl px-6 py-12 sm:px-10 xl:py-16">
            {detail.description && <p className="font-bdo text-lg leading-relaxed text-black/70 sm:text-xl">{detail.description}</p>}

            <div
              className="prose mt-8 max-w-none font-bdo break-words prose-slate prose-headings:font-bdo prose-headings:font-semibold prose-a:text-accent-red prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: detail.content }}
            />

            <div className="mt-12 flex flex-col gap-4 border-t border-black/10 pt-8">
              <p className="font-bdo text-sm font-medium text-black">Bagikan {label.toLowerCase()} ini</p>
              <ul className="flex flex-wrap gap-2">
                {shareLinks.map((share) => (
                  <li key={share.label}>
                    <a href={share.href} target="_blank" rel="noopener noreferrer" className={SHARE_BUTTON_CLASS}>
                      {share.label}
                      <span className="sr-only"> (tab baru)</span>
                    </a>
                  </li>
                ))}
                <li>
                  <CopyLinkButton url={url} className={SHARE_BUTTON_CLASS} />
                </li>
              </ul>
            </div>
          </div>
        </article>

        <section aria-labelledby="related-heading" className="bg-[#F5F7F9] py-14 xl:py-20">
          <div className="mx-auto max-w-[1440px] px-6 sm:px-10 xl:px-[clamp(2.75rem,4.65vw,5.5rem)]">
            <h2
              id="related-heading"
              className="font-bdo text-[clamp(1.75rem,2.7vw,3.25rem)] leading-[1.1] font-medium tracking-[-0.021em] text-black"
            >
              {detail.related.length > 0 ? `${label} terkait` : `${label} lainnya`}
            </h2>

            {detail.related.length > 0 && (
              <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:mt-12">
                {detail.related.map((item, idx) => (
                  <NewsCard key={item.id} {...item} index={idx} layoutOverride={item.section} variant="news-page" className="aspect-413/529 w-full" />
                ))}
              </div>
            )}

            <div className="mt-10 xl:mt-12">
              <ReservasiButton href={routes.news()} label={`Lihat ${label} Lainnya`} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
