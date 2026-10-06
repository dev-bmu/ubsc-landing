import { NewsDetailPage, newsDetailMetadata } from '@/features/news-detail/page/Index'
import type { Metadata } from 'next'

// ===== /artikel/[slug] — detail artikel section 'artikel' (komposisi di features/news-detail) =====
// ISR 300s + tag 'news' (dibuang API setiap tulis berita).

export const revalidate = 300

export const dynamicParams = true

// SENGAJA kosong: seluruh artikel dirender saat pertama diminta lalu di-cache ISR, tidak di-prerender saat build.
// Prerender membuat build bergantung pada setiap GET /news/:slug — satu kegagalan (API mati, publicLimiter
// 60/menit/IP yang juga dipakai landing produksi di host yang sama, atau daftar dari fetch-cache lama)
// menggagalkan seluruh build. Crawler tetap menerima HTML lengkap dari server.
export function generateStaticParams() {
  return []
}

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  return newsDetailMetadata(slug)
}

export default async function Page({ params }: Params) {
  const { slug } = await params
  return <NewsDetailPage section="artikel" slug={slug} />
}
