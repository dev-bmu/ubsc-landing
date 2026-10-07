import TopBg from '@/assets/hero/Top.avif'
import RightBg from '@/assets/images/bg-heropricing.avif'
import { HeroBottomBar } from '@/components/landing/HeroBottomBar'
import { ScrollTextReveal } from '@/components/landing/ScrollTextReveal'
import { MEMBERSHIP_ENABLED } from '@/config/features'

/**
 * Port dari resources/js/Components/Pricing/PricingHero.tsx.
 *
 * Server component: tidak ada state, efek, maupun handler. Yang interaktif justru anaknya
 * (ScrollTextReveal dan HeroBottomBar), dan keduanya sudah 'use client' di berkasnya sendiri.
 *
 * Aset: `@/../assets/hero/Top.avif` dan `@/../assets/images/bg-heropricing.avif` Laravel menjadi impor
 * modul dari `@/assets/**` -> dipakai lewat `.src` (StaticImageData). `/assets/hero/star.png` tetap path
 * string karena di Laravel pun ia dibaca dari public/, bukan diimpor.
 *
 * Semua gambar SENGAJA tetap `<img>` polos (bukan next/image): kotak modelnya diatur utilitas
 * absolute/inset-0/object-cover milik hero dan next/image akan menggeser layout itu.
 *
 * classPairs v4 (3):
 *   - `flex flex-[1] items-center px-6 max-w-72`              -> `flex flex-1 ...`
 *   - `flex flex-[3] flex-col justify-end px-6 pb-8 max-w-72` -> `flex flex-3 ...`
 *   - `h-[63vh] flex-shrink-0`                                -> `h-[63vh] shrink-0`
 */
export function PricingHero() {
  return (
    <div className="relative overflow-hidden">
      {/* === ABSOLUTE BACKGROUNDS === */}

      {/* Top blue gradient: 75vh on mobile, 63vh on desktop */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[75vh] overflow-hidden bg-black xl:h-[63vh]">
        {/* eslint-disable-next-line @next/next/no-img-element -- Top.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
        <img src={TopBg.src} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-top" />
      </div>

      {/* Bottom photo: from 75vh on mobile, from 63vh on desktop */}
      <div className="pointer-events-none absolute inset-x-0 top-[75vh] bottom-0 xl:top-[63vh]">
        <div className="absolute inset-0 bg-black" />
        {/* eslint-disable-next-line @next/next/no-img-element -- bg-heropricing.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
        <img src={RightBg.src} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-center xl:hidden" />
        {/* Desktop: right 2/3 photo panel only */}
        <div className="absolute inset-y-0 right-0 hidden w-2/3 xl:block">
          {/* eslint-disable-next-line @next/next/no-img-element -- bg-heropricing.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
          <img src={RightBg.src} alt="" aria-hidden className="h-full w-full object-cover object-center" />
        </div>
      </div>

      {/* === RELATIVE CONTENT === */}
      <section className="relative flex h-screen flex-col" id="pricing-hero">
        {/* ---- MOBILE LAYOUT: hidden on xl+ ---- */}
        <div className="flex flex-1 flex-col xl:hidden">
          {/* Top 75% — blue block — star + heading anchored to bottom */}
          <div className="flex max-w-72 flex-3 flex-col justify-end px-6 pb-8">
            {/* eslint-disable-next-line @next/next/no-img-element -- star.png aset desain dari public/assets, bukan gambar CMS /uploads */}
            <img src="/assets/hero/star.png" alt="" aria-hidden className="mb-3 h-12 w-12 object-contain opacity-90" />
            <ScrollTextReveal as="h1" split="words" className="font-bdo text-[clamp(2.5rem,8vw,4rem)] leading-tight font-medium text-white">
              Jadwal &amp; Paket Harga
            </ScrollTextReveal>
          </div>

          {/* Bottom 25% — photo block — description centered */}
          <div className="flex max-w-72 flex-1 items-center px-6">
            <p className="font-bdo text-sm leading-relaxed font-light text-white/80">
              Welcome to the UB Sport where people work on <span className="font-medium text-white">strength body where people on </span>
              <span className="font-medium text-white">strengthening body</span>.
            </p>
          </div>
        </div>

        {/* ---- DESKTOP LAYOUT: hidden on mobile, shown on xl+ ---- */}
        <div className="hidden xl:flex xl:flex-1 xl:flex-col">
          {/* Spacer fills the blue section */}
          <div className="h-[63vh] shrink-0" />

          {/* Two-column content row in the black/photo section */}
          <div className="relative flex flex-1 flex-row">
            {/* Left 1/3: star + title */}
            <div className="flex flex-col justify-center px-14 xl:basis-1/3">
              <div className="pointer-events-none mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element -- star.png aset desain dari public/assets, bukan gambar CMS /uploads */}
                <img src="/assets/hero/star.png" alt="" aria-hidden className="h-20 w-20 object-contain opacity-90" />
              </div>
              <ScrollTextReveal
                as="h1"
                split="words"
                className="font-bdo text-[clamp(2rem,2.7vw,52px)] leading-[1.1] font-medium tracking-[-0.017em] text-white"
              >
                Jadwal &amp; Paket Harga
              </ScrollTextReveal>
            </div>

            {/* Right 2/3: description */}
            <div className="flex flex-1 items-center xl:basis-2/3">
              <p className="relative z-10 ml-auto w-full text-left font-bdo text-[clamp(0.9rem,1.5vw,1.3rem)] leading-relaxed font-light text-white/80 xl:max-w-md xl:pr-16">
                Pilih jadwal dan paket terbaik Anda, lalu{' '}
                <span className="font-medium text-white">mulai perjalanan menuju tubuh yang lebih kuat dan bugar.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 left-0 z-20 border-t border-white/10" />
      </section>

      <HeroBottomBar
        variant="transparent"
        sectionNumber="01/"
        sectionLabel="homepage"
        description="UB Sport Center – Temukan fasilitas olahraga modern untuk berlatih, berprestasi, dan berkembang bersama."
        targetId={MEMBERSHIP_ENABLED ? 'pricing-info' : 'pricing-facilities'}
        showVideo={false}
      />
    </div>
  )
}
