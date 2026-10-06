import { AboutPage } from '@/features/about/page/Index'
import { buildPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

// ===== /about =====
// Tidak mengambil data halaman (Laravel: Inertia::render('AboutPage') tanpa prop). Satu-satunya fetch adalah
// SEO halaman dari admin di generateMetadata (ISR 600s, tag 'seo'). Lihat rencana cache per halaman di Rewrite.md.

export function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('about')
}

export default AboutPage
