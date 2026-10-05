import { NewsPage } from '@/features/news/page/Index'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Berita & Artikel — UB Sport Center',
  description: 'Kabar terbaru, program, dan artikel seputar UB Sport Center.'
}

// ISR 120s — paling sering berubah di antara halaman publik (Rewrite.md).
export const revalidate = 120

export default NewsPage
