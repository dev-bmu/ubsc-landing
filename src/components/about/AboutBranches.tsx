import { FadeIn } from '@/components/landing/FadeIn'
import { SectionThree } from '@/components/landing/SectionThree'

/**
 * Port 1:1 dari resources/js/Components/About/AboutBranches.tsx — pembungkus tipis
 * `<FadeIn lightweight><SectionThree /></FadeIn>`, persis seperti di HomePage.
 *
 * Server Component: tidak ada hook maupun handler di berkas ini; FadeIn dan SectionThree
 * membawa 'use client'-nya sendiri.
 *
 * classPairs: tidak ada (spec-AboutBranches.json kosong) — berkas ini tidak punya satu pun class.
 */
export function AboutBranches() {
  return (
    <FadeIn lightweight>
      <SectionThree />
    </FadeIn>
  )
}
