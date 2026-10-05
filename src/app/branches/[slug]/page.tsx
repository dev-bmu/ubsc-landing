import { BranchShowPage } from '@/features/branches/page/Index'
import { BRANCHES, BRANCH_SLUGS } from '@/config/branches'
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

  return {
    title: `${branch.title} — UB Sport Center`,
    description: branch.description.split('\n')[0]
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!BRANCHES[slug]) notFound()

  return <BranchShowPage slug={slug} />
}
