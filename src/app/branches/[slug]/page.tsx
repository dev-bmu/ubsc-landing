import { BranchShowPage } from '@/features/branches/page/Index'
import { BRANCHES, BRANCH_SLUGS } from '@/config/branches'
import { routes } from '@/config/routes'
import { absoluteUrl, SITE_NAME } from '@/config/site'
import { generatedOgUrl } from '@/lib/seo'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

// ===== /branches/[slug] — statis penuh =====
// Datanya array hardcoded (src/config/branches.ts), jadi seluruh slug bisa di-prerender dan tidak ada
// fetch sama sekali. Slug di luar daftar -> 404, padanan `abort_unless($branchItem, 404)` Laravel.

export function generateStaticParams() {
  return BRANCH_SLUGS.map((slug) => ({ slug }))
}

/** Slug tak dikenal tetap 404, bukan di-render kosong. */
export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const branch = BRANCHES[slug]
  if (!branch) return {}

  const description = branch.description.split('\n')[0]
  const path = routes.branches(slug)
  // Foto cabang berformat .avif — tidak dirender pratinjau WhatsApp/Facebook, jadi OG memakai kartu PNG /og.
  const image = absoluteUrl(generatedOgUrl(branch.title, branch.categoryBadge))

  return {
    // branch.title sudah memuat merek, jadi template '%s | UB Sport Center' layout tidak dipakai.
    title: { absolute: branch.title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'id_ID',
      title: branch.title,
      description,
      url: path,
      images: [{ url: image, width: 1200, height: 630, alt: branch.title }]
    },
    twitter: { card: 'summary_large_image', title: branch.title, description, images: [image] }
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!BRANCHES[slug]) notFound()

  return <BranchShowPage slug={slug} />
}
