'use client'

import { EntranceLoader } from '@/components/landing/EntranceLoader'
import { GymTrafficBadge } from '@/components/landing/GymTrafficBadge'
import { HeroBottomBar } from '@/components/landing/HeroBottomBar'
import { HeroContent } from '@/components/landing/HeroContent'
import { HeroTitle } from '@/components/landing/HeroTitle'
import type { GymTrafficDto } from '@/types/contracts/contracts'
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { preload } from 'react-dom'

interface HeroProps {
  /** Status trafik gym dari RSC fetch beranda; diteruskan ke GymTrafficBadge (desktop + mobile). */
  gymTraffic?: GymTrafficDto
}

const revealStyle = (delay: string, x = '0px', y = '24px'): CSSProperties =>
  ({
    '--hero-delay': delay,
    '--hero-x': x,
    '--hero-y': y
  }) as CSSProperties

/**
 * Port dari resources/js/Components/Landing/Hero.tsx.
 *
 * Perubahan terhadap sumber:
 *   - `<Head>` Inertia dengan <link rel="preload"> -> ReactDOM `preload()` (React 19). Dua aset hero
 *     yang sama di-preload sebagai image; React men-dedupe dan menuliskannya ke <head> saat SSR.
 *   - Impor dari '@/components/landing/*' (named export).
 *   - `gym_traffic` via usePage -> prop `gymTraffic`, diturunkan ke kedua GymTrafficBadge.
 *   - Class v3->v4: z-[1..4] -> z-1..4 (veil/depth/sweep/frame), max-h-[100vh] -> max-h-screen,
 *     flex-shrink-0 -> shrink-0 (dua reveal mobile). Diambil dari reference/class-migration.json.
 *
 * Hero.avif SENGAJA tetap `<img>` polos, bukan next/image: state machine (isImageLoaded) bergantung
 * pada onLoad/onError elemen asli, dan elemen membawa transform scale(1.4->1) yang box model
 * next/image akan geser (fase-2 + next.config.ts).
 *
 * EntranceLoader dirender DI DALAM Hero (di-portal ke document.body oleh komponennya).
 */
export function Hero({ gymTraffic }: HeroProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isIntroComplete, setIsIntroComplete] = useState(false)
  const [isSettled, setIsSettled] = useState(false)
  const [isConstrainedDevice, setIsConstrainedDevice] = useState(false)
  const bgRef = useRef<HTMLImageElement | null>(null)
  const isReady = isImageLoaded && isIntroComplete

  preload('/assets/hero/Hero.avif', { as: 'image' })
  preload('/assets/images/ub-sport-enterence.avif', { as: 'image' })

  // Guard SSR yang TIDAK ada di sumber Laravel, dan wajib di sini. Di Laravel (Inertia, CSR murni)
  // elemen <img> dibuat React sehingga onLoad selalu terpasang sebelum gambar selesai. Di Next gambar
  // ini ada di HTML awal dan di-preload fetchPriority="high", jadi ia bisa `complete` SEBELUM React
  // hydrate dan memasang onLoad — event itu lewat, isImageLoaded tak pernah true, dan hero terkunci di
  // .ubsc-hero-prep (bg opacity 0). Cek .complete sekali setelah mount menutup celah itu; perilakunya
  // identik dengan Laravel (gambar siap -> reveal), hanya menambal beda timing SSR vs CSR.
  useEffect(() => {
    if (bgRef.current?.complete) setIsImageLoaded(true)
  }, [])

  const heroClassName = useMemo(
    () =>
      [
        'ubsc-hero relative flex min-h-screen flex-col overflow-hidden bg-[#040812]',
        isReady ? 'ubsc-hero-ready' : '',
        isSettled ? 'ubsc-hero-settled' : 'ubsc-hero-prep',
        isConstrainedDevice ? 'ubsc-hero-lite' : ''
      ]
        .filter(Boolean)
        .join(' '),
    [isConstrainedDevice, isReady, isSettled]
  )

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    const cores = navigator.hardwareConcurrency

    setIsConstrainedDevice(
      Boolean(
        connection?.saveData ||
        connection?.effectiveType === '2g' ||
        connection?.effectiveType === 'slow-2g' ||
        (deviceMemory && deviceMemory <= 4) ||
        (cores && cores <= 4)
      )
    )
  }, [])

  useEffect(() => {
    if (!isReady) return

    const timer = window.setTimeout(() => setIsSettled(true), 2100)
    return () => window.clearTimeout(timer)
  }, [isReady])

  return (
    <>
      <EntranceLoader onExitStart={() => setIsIntroComplete(true)} onComplete={() => {}} />
      <section id="home" className={heroClassName}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Hero.avif sengaja <img> polos: state machine onLoad/onError + transform scale, bukan next/image */}
        <img
          ref={bgRef}
          src="/assets/hero/Hero.avif"
          alt="UBSC Hero Background"
          className="ubsc-hero-bg pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center select-none"
          onLoad={() => setIsImageLoaded(true)}
          onError={() => setIsImageLoaded(true)}
          draggable={false}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />

        <div className="ubsc-hero-veil absolute inset-0 z-1" />
        <div className="ubsc-hero-depth absolute inset-0 z-2" />
        <div className="ubsc-hero-sweep absolute inset-0 z-3" />
        <div className="ubsc-hero-frame pointer-events-none absolute inset-0 z-4">
          <span className="ubsc-hero-frame-line ubsc-hero-frame-line--v left-[24%]" />
          <span className="ubsc-hero-frame-line ubsc-hero-frame-line--v right-[17%]" />
          <span className="ubsc-hero-frame-line ubsc-hero-frame-line--h bottom-[25%]" />
        </div>

        <div className="relative z-10 hidden max-h-screen min-h-screen flex-col items-stretch overflow-y-auto xl:flex">
          <div className="flex min-h-0 flex-1 items-end justify-between px-6 pt-12 pb-12 xl:px-16 xl:pt-32 xl:pb-32">
            <div className="ubsc-hero-reveal" style={revealStyle('520ms', '-28px', '0px')}>
              <GymTrafficBadge gymTraffic={gymTraffic} />
            </div>
            <div className="ubsc-hero-reveal ubsc-hero-reveal--copy" style={revealStyle('650ms', '0px', '28px')}>
              <HeroContent />
            </div>
          </div>

          <div className="flex min-h-0 flex-col justify-end px-16">
            <div className="ubsc-hero-reveal ubsc-hero-reveal--title" style={revealStyle('760ms', '0px', '26px')}>
              <HeroTitle />
            </div>
          </div>

          <div className="ubsc-hero-reveal absolute right-16 bottom-6" style={revealStyle('980ms', '0px', '20px')}>
            <div className="ubsc-hero-orbit flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-white shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element -- logo mitra dari public/, sengaja bukan next/image */}
              <img src="/BMU.png" alt="Brawijaya Multi Usaha" className="h-full w-full object-contain" />
            </div>
          </div>
        </div>

        <div className="relative z-10 flex min-h-screen flex-col px-8 pt-28 xl:hidden">
          <div className="ubsc-hero-reveal shrink-0" style={revealStyle('520ms', '-24px', '0px')}>
            <GymTrafficBadge gymTraffic={gymTraffic} />
          </div>

          <div className="ubsc-hero-reveal ubsc-hero-reveal--copy mt-8 shrink-0" style={revealStyle('650ms', '0px', '26px')}>
            <HeroContent />
          </div>

          <div className="flex flex-1 flex-col justify-end pb-5">
            <div className="ubsc-hero-reveal mb-6" style={revealStyle('980ms', '0px', '18px')}>
              <div className="ubsc-hero-orbit mt-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element -- logo mitra dari public/, sengaja bukan next/image */}
                <img src="/BMU.png" alt="Brawijaya Multi Usaha" className="h-full w-full object-contain" />
              </div>
            </div>

            <div className="ubsc-hero-reveal ubsc-hero-reveal--title" style={revealStyle('760ms', '0px', '24px')}>
              <HeroTitle />
            </div>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 left-0 z-20 border-t border-white/10" />
      </section>

      <div className={`ubsc-hero-bottom-shell ${isReady ? 'ubsc-hero-bottom-shell--ready' : ''}`}>
        <HeroBottomBar showVideo />
      </div>
    </>
  )
}
