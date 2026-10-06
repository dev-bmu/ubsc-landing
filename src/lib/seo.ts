import { createHmac } from 'node:crypto'
import type { Metadata } from 'next'
import { routes } from '@/config/routes'
import { absoluteUrl, ORGANIZATION, SITE_NAME, SITE_URL } from '@/config/site'
import { getPageSeo } from '@/services/server'
import type { NewsDetailDto, NewsSection } from '@/types/contracts/contracts'
import { SEO_PAGES, type SeoPageKey } from '@/types/contracts/seo'

// ===== Metadata SEO bersama (server saja — getPageSeo bertanda server-only) =====
// Judul halaman ditulis TANPA merek; template '%s | UB Sport Center' di layout.tsx yang menambahkannya.
// openGraph/twitter/robots milik anak MENGGANTI milik layout (merge Next dangkal per kunci), jadi
// siteName + locale diulang di sini lewat OG_BASE.

const OG_SIZE = { width: 1200, height: 630 } as const
const OG_BASE = { siteName: SITE_NAME, locale: 'id_ID' } as const
const NOINDEX = { robots: { index: false, follow: true } } as const

export const SECTION_LABEL: Record<NewsSection, string> = { berita: 'Berita', artikel: 'Artikel' }

/** Tanda tangan HMAC kartu /og: route menolak query yang tidak dibuat server ini (anti spoofing/DoS). */
export const ogSig = (title: string, label = '') =>
  createHmac('sha256', process.env.REVALIDATE_SECRET ?? '').update(`${title}
${label}`).digest('base64url')

/** OG image cadangan terakhir: kartu merek PNG yang digambar src/app/og/route.tsx. */
export function generatedOgUrl(title: string, label?: string): string {
  const params = new URLSearchParams({ title })
  if (label) params.set('label', label)
  params.set('sig', ogSig(title, label))
  return `/og?${params.toString()}`
}

/**
 * Metadata halaman statis: baris admin (GET /api/public/seo) menimpa default SEO_PAGES; kosong/null = default.
 * OG image: milik halaman -> milik beranda -> kartu /og hasil generate.
 */
export async function buildPageMetadata(key: SeoPageKey): Promise<Metadata> {
  const rows = await getPageSeo()
  const page = SEO_PAGES.find((item) => item.key === key) ?? SEO_PAGES[0]
  const row = rows.find((item) => item.key === key)
  const homeOg = rows.find((item) => item.key === 'home')?.ogImage

  const title = row?.title || page.defaultTitle
  const description = row?.description || page.defaultDescription
  const image = absoluteUrl(row?.ogImage || homeOg || generatedOgUrl(title))

  return {
    // Beranda: merek adalah judulnya sendiri, jadi template tidak dipasang.
    title: key === 'home' ? { absolute: title } : title,
    description,
    alternates: { canonical: page.path },
    openGraph: { ...OG_BASE, type: 'website', title, description, url: page.path, images: [{ url: image, alt: title, ...(row?.ogImage || homeOg ? {} : OG_SIZE) }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    ...(row?.noindex ? NOINDEX : {})
  }
}

/** Metadata detail artikel. seo.* sudah diresolusi API (metaTitle -> judul, metaDescription -> excerpt -> isi, og -> thumbnail). */
export function buildArticleMetadata(detail: NewsDetailDto): Metadata {
  const { seo } = detail
  const path = routes.newsArticle(detail)
  const image = articleImage(detail)

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: path },
    openGraph: {
      ...OG_BASE,
      type: 'article',
      title: seo.title,
      description: seo.description,
      url: path,
      publishedTime: detail.publishedAt ?? undefined,
      modifiedTime: detail.updatedAt,
      section: detail.category || SECTION_LABEL[detail.section],
      authors: detail.authorName ? [detail.authorName] : undefined,
      images: [{ url: image, alt: seo.title, ...(shareableImage(detail) ? {} : OG_SIZE) }]
    },
    twitter: { card: 'summary_large_image', title: seo.title, description: seo.description, images: [image] },
    ...(seo.noindex ? NOINDEX : {})
  }
}

// AVIF (thumbnail seed lama) tidak dirender preview WhatsApp/Facebook — diperlakukan seperti tidak ada gambar.
const shareableImage = (detail: NewsDetailDto): string => (/\.avif(\?|$)/i.test(detail.seo.ogImage) ? '' : detail.seo.ogImage)

/** URL absolut gambar share artikel: og/thumbnail dari API, kalau kosong (atau AVIF) kartu /og. */
export const articleImage = (detail: NewsDetailDto): string =>
  absoluteUrl(shareableImage(detail) || generatedOgUrl(detail.seo.title, SECTION_LABEL[detail.section]))

// ===== Structured data (JSON-LD) =====

const ORG_ID = `${SITE_URL}/#organization`

const publisher = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: absoluteUrl(ORGANIZATION.logo) }
}

/** Beranda: lokasi olahraga (subtipe LocalBusiness/Organization) + WebSite. */
export function homeJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SportsActivityLocation',
      '@id': ORG_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl(ORGANIZATION.logo),
      image: absoluteUrl('/assets/images/ub-sport-center-kantor-pusat-malang.avif'),
      address: { '@type': 'PostalAddress', ...ORGANIZATION.address },
      telephone: ORGANIZATION.telephone,
      email: ORGANIZATION.email,
      sameAs: ORGANIZATION.sameAs
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: 'id-ID',
      publisher: { '@id': ORG_ID }
    }
  ]
}

/** NewsArticle (berita) / BlogPosting (artikel) + BreadcrumbList untuk halaman detail. */
export function articleJsonLd(detail: NewsDetailDto) {
  const url = absoluteUrl(routes.newsArticle(detail))

  return [
    {
      '@context': 'https://schema.org',
      '@type': detail.section === 'artikel' ? 'BlogPosting' : 'NewsArticle',
      headline: detail.title,
      description: detail.seo.description,
      image: [articleImage(detail)],
      datePublished: detail.publishedAt ?? undefined,
      dateModified: detail.updatedAt,
      author: detail.authorName ? { '@type': 'Person', name: detail.authorName } : { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      inLanguage: 'id-ID'
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: absoluteUrl(routes.home()) },
        { '@type': 'ListItem', position: 2, name: 'Berita & Artikel', item: absoluteUrl(routes.news()) },
        { '@type': 'ListItem', position: 3, name: detail.title, item: url }
      ]
    }
  ]
}
