import { notFound, permanentRedirect } from 'next/navigation'
import { routes } from '@/config/routes'
import { getNewsDetail } from '@/services/server'

// ===== /news/[slug] — URL lama, permanen dialihkan ke /berita/<slug> atau /artikel/<slug> =====

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const detail = await getNewsDetail(slug)
  if (!detail) notFound()
  permanentRedirect(routes.newsArticle(detail))
}
