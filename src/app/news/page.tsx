import { NewsPage } from '@/features/news/page/Index'
import { buildPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('news')
}

// ISR 120s — paling sering berubah di antara halaman publik (Rewrite.md).
export const revalidate = 120

export default NewsPage
