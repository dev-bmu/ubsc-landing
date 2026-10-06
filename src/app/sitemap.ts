import type { MetadataRoute } from 'next'
import { BRANCH_SLUGS } from '@/config/branches'
import { routes } from '@/config/routes'
import { absoluteUrl } from '@/config/site'
import { getNews, getPageSeo } from '@/services/server'
import type { NewsDto } from '@/types/contracts/contracts'
import { SEO_PAGES, type SeoPageKey } from '@/types/contracts/seo'

// ===== /sitemap.xml =====
// Halaman statis dari SEO_PAGES (kecuali yang ditandai noindex di admin), cabang, dan seluruh artikel terbit.
// API mati -> hanya entri statis; sitemap tidak boleh gagal dibangun.
export const revalidate = 3600

const PAGE_HINTS: Partial<Record<SeoPageKey, Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'>>> = {
  home: { changeFrequency: 'daily', priority: 1 },
  news: { changeFrequency: 'daily', priority: 0.8 },
  terms: { changeFrequency: 'yearly', priority: 0.3 },
  privacy: { changeFrequency: 'yearly', priority: 0.3 },
  refund: { changeFrequency: 'yearly', priority: 0.3 }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const noindex = new Set((await getPageSeo()).filter((row) => row.noindex).map((row) => row.key))

  let news: NewsDto[] = []
  try {
    news = await getNews(3600)
  } catch {
    news = []
  }

  return [
    ...SEO_PAGES.filter((page) => !noindex.has(page.key)).map((page) => ({
      url: absoluteUrl(page.path),
      ...(PAGE_HINTS[page.key] ?? { changeFrequency: 'weekly' as const, priority: 0.7 })
    })),
    ...BRANCH_SLUGS.map((slug) => ({ url: absoluteUrl(routes.branches(slug)), changeFrequency: 'monthly' as const, priority: 0.5 })),
    ...news
      .filter((item) => !item.noindex)
      .map((item) => ({
        url: absoluteUrl(routes.newsArticle(item)),
        lastModified: item.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7
      }))
  ]
}
