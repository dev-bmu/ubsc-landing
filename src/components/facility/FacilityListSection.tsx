'use client'

import person from '@/assets/images/person.avif'
import { FacilityListItem, type FacilityItem } from '@/components/facility/FacilityListItem'
import { ScrollTextReveal } from '@/components/landing/ScrollTextReveal'
import { routes } from '@/config/routes'
import { motion } from 'motion/react'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'

const MARQUEE_ITEMS = Array(40).fill(null)

function FacilityIntroArrow({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path d="M24 36H53" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 22L56 36L42 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ScrollObjectReveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    const node = rootRef.current
    if (!node || hasEntered) return

    if (!('IntersectionObserver' in window)) {
      setHasEntered(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setHasEntered(true)
        observer.disconnect()
      },
      {
        threshold: 0.22,
        rootMargin: '0px 0px -12% 0px'
      }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [hasEntered])

  return (
    <div
      ref={rootRef}
      className={`ubsc-object-reveal ${hasEntered ? 'is-visible' : ''} ${className}`}
      style={{ '--ubsc-object-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}

function FacilityIntroLink() {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={routes.facilities()}
      className="relative block w-full max-w-[410px] cursor-pointer overflow-hidden border-b border-white/70 pt-1 pb-3 select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bg-accent-red"
        style={{
          inset: '-50% -5%',
          transform: hovered ? 'skewY(-4deg) translateY(0%)' : 'skewY(-4deg) translateY(135%)',
          transition: 'transform 0.55s cubic-bezier(0.76, 0, 0.24, 1)'
        }}
      />
      <span className="pointer-events-none relative z-10 flex w-full items-center justify-between gap-5">
        <span className="font-bdo text-[clamp(1rem,1.25vw,1.5rem)] leading-tight font-medium tracking-[-0.035em] text-white">
          Lihat Fasilitas Lainnya
        </span>
        <span
          className="flex shrink-0 items-center justify-center text-white"
          style={{
            transform: hovered ? 'rotate(0deg)' : 'rotate(-45deg)',
            transition: 'transform 0.55s cubic-bezier(0.76, 0, 0.24, 1)'
          }}
        >
          <FacilityIntroArrow />
        </span>
      </span>
    </a>
  )
}

interface FacilityListSectionProps {
  sectionNumber?: string
  sectionTitle?: string
  sectionSubtitle?: string
  facilities?: FacilityItem[]
  isLandingPage?: boolean
}

export function FacilityListSection({ facilities, isLandingPage = false }: FacilityListSectionProps = {}) {
  // Hanya data DB (fasilitas aktif). Kosong = section disembunyikan, bukan diisi daftar contoh.
  const activeList = facilities ?? []
  if (activeList.length === 0) return null
  const renderedList = isLandingPage ? activeList.slice(0, 4) : activeList
  return (
    <section className="overflow-x-clip bg-[#242424]" id="facility-content">
      {/* --- MARQUEE STRIP --- */}
      <ScrollObjectReveal delay={20}>
        <div className="relative z-0 overflow-hidden border-b border-white/10 bg-black py-2">
          <motion.div
            className="flex items-center"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              repeat: Infinity,
              ease: 'linear',
              duration: 30
            }}
          >
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((_, i) => (
              <span key={i} className="shrink-0 pr-12 font-clash text-[12px] font-semibold tracking-widest text-white/70 uppercase lg:text-[16px]">
                UBSC
              </span>
            ))}
          </motion.div>
        </div>
      </ScrollObjectReveal>

      <div className="mx-auto px-[clamp(1.75rem,4.5vw,5.5rem)] py-6">
        {/* --- HERO INTRO EDITORIAL LAYOUT --- */}
        <div className="mt-12 mb-20 flex flex-col gap-11 xl:grid xl:grid-cols-[clamp(328px,21.4vw,410px)_minmax(0,1fr)] xl:gap-[clamp(4.1rem,4.75vw,5.7rem)] min-[1800px]:grid-cols-[390px_minmax(0,1fr)] min-[1800px]:gap-29">
          <div className="flex flex-col items-start justify-between gap-10 xl:pt-[3px] xl:pb-3">
            <div className="flex items-center gap-4 xl:gap-3">
              <span className="section-label-diamond" />
              <ScrollTextReveal delay={80} className="font-bdo text-[clamp(1.16rem,1.32vw,1.5rem)] font-medium tracking-[-0.035em] text-white">
                Arena Tertutup
              </ScrollTextReveal>
            </div>
            <ScrollObjectReveal delay={210} className="mt-auto hidden w-[328px] xl:block min-[1800px]:w-[410px]">
              <FacilityIntroLink />
            </ScrollObjectReveal>
          </div>

          <div className="block w-full min-w-0">
            <ScrollObjectReveal delay={130} className="max-w-[1240px]">
              <h2
                className="block text-left font-bdo text-[1.75rem] font-medium tracking-[-0.035em] text-white sm:text-[2rem] xl:text-[2.6rem] xl:tracking-[-0.055em]"
                style={{
                  lineHeight: 1.08
                }}
              >
                <span className="relative hidden min-h-[258px] overflow-visible pt-[148px] xl:block 2xl:hidden" aria-hidden>
                  <span className="absolute top-0 left-0 block aspect-187/244 w-[150px] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element -- person.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
                    <img src={person.src} alt="UB Sport Center" className="h-full w-full object-cover object-top" />
                  </span>
                  <span className="block overflow-visible pl-[174px] whitespace-nowrap">
                    <ScrollTextReveal delay={130} className="mb-[-0.14em] inline-block pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      Nikmati berbagai pilihan
                    </ScrollTextReveal>
                  </span>
                  <span className="block overflow-visible whitespace-nowrap">
                    <ScrollTextReveal delay={225} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      fasilitas indoor dengan suasana tertata,
                    </ScrollTextReveal>
                  </span>
                  <span className="block overflow-visible whitespace-nowrap">
                    <ScrollTextReveal delay={320} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      akses mudah, dan dukungan ruang yang
                    </ScrollTextReveal>
                  </span>
                  <span className="block overflow-visible whitespace-nowrap">
                    <ScrollTextReveal delay={415} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      sesuai untuk aktivitas olahraga harian.
                    </ScrollTextReveal>
                  </span>
                </span>
                <span
                  className="relative hidden min-h-[258px] overflow-visible pt-[148px] 2xl:block min-[1800px]:min-h-[318px] min-[1800px]:pt-[190px]"
                  aria-hidden
                >
                  <span className="absolute top-0 left-0 block aspect-187/244 w-[150px] overflow-hidden min-[1800px]:w-[187px]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- person.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
                    <img src={person.src} alt="UB Sport Center" className="h-full w-full object-cover object-top" />
                  </span>
                  <span className="block overflow-visible pl-[174px] whitespace-nowrap min-[1800px]:pl-[216px]">
                    <ScrollTextReveal delay={130} className="mb-[-0.14em] inline-block pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      Nikmati berbagai pilihan fasilitas indoor
                    </ScrollTextReveal>
                  </span>
                  <span className="block overflow-visible whitespace-nowrap">
                    <ScrollTextReveal delay={225} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      dengan suasana tertata, akses mudah, dan dukungan
                    </ScrollTextReveal>
                  </span>
                  <span className="block overflow-visible whitespace-nowrap">
                    <ScrollTextReveal delay={320} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      ruang yang sesuai untuk aktivitas olahraga harian.
                    </ScrollTextReveal>
                  </span>
                </span>
                <span className="relative block min-h-[212px] overflow-visible pt-[78px] sm:min-h-[236px] sm:pt-[102px] md:hidden" aria-hidden>
                  <span className="absolute top-0 left-0 block aspect-187/244 w-[88px] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element -- person.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
                    <img src={person.src} alt="UB Sport Center" className="h-full w-full object-cover object-top" />
                  </span>
                  <span className="block overflow-visible pl-[100px] whitespace-nowrap">
                    <ScrollTextReveal delay={130} className="mb-[-0.14em] inline-block pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      Nikmati berbagai
                    </ScrollTextReveal>
                  </span>
                  <span className="block overflow-visible whitespace-nowrap">
                    <ScrollTextReveal delay={225} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      pilihan fasilitas indoor
                    </ScrollTextReveal>
                  </span>
                  <span className="block overflow-visible whitespace-nowrap">
                    <ScrollTextReveal delay={320} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      dengan suasana tertata,
                    </ScrollTextReveal>
                  </span>
                  <span className="block overflow-visible whitespace-nowrap">
                    <ScrollTextReveal delay={415} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      akses mudah, dan
                    </ScrollTextReveal>
                  </span>
                  <span className="block overflow-visible whitespace-nowrap">
                    <ScrollTextReveal delay={510} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      dukungan ruang yang
                    </ScrollTextReveal>
                  </span>
                  <span className="block overflow-visible whitespace-nowrap">
                    <ScrollTextReveal delay={605} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      sesuai untuk aktivitas
                    </ScrollTextReveal>
                  </span>
                  <span className="block overflow-visible whitespace-nowrap">
                    <ScrollTextReveal delay={700} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      olahraga harian.
                    </ScrollTextReveal>
                  </span>
                </span>
                <span className="relative hidden min-h-[258px] overflow-visible pt-[122px] md:block xl:hidden" aria-hidden>
                  <span className="absolute top-0 left-0 block aspect-187/244 w-[120px] overflow-hidden lg:w-[138px]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- person.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
                    <img src={person.src} alt="UB Sport Center" className="h-full w-full object-cover object-top" />
                  </span>
                  <span className="block overflow-visible pl-[142px] whitespace-nowrap lg:hidden">
                    <ScrollTextReveal delay={130} className="mb-[-0.14em] inline-block pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      Nikmati berbagai pilihan fasilitas
                    </ScrollTextReveal>
                  </span>
                  <span className="block overflow-visible whitespace-nowrap lg:hidden">
                    <ScrollTextReveal delay={225} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      indoor dengan suasana tertata,
                    </ScrollTextReveal>
                  </span>
                  <span className="block overflow-visible whitespace-nowrap lg:hidden">
                    <ScrollTextReveal delay={320} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      akses mudah, dan dukungan ruang
                    </ScrollTextReveal>
                  </span>
                  <span className="block overflow-visible whitespace-nowrap lg:hidden">
                    <ScrollTextReveal delay={415} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      yang sesuai untuk aktivitas olahraga harian.
                    </ScrollTextReveal>
                  </span>
                  <span className="hidden overflow-visible pl-[162px] whitespace-nowrap lg:block">
                    <ScrollTextReveal delay={130} className="mb-[-0.14em] inline-block pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      Nikmati berbagai pilihan
                    </ScrollTextReveal>
                  </span>
                  <span className="hidden overflow-visible whitespace-nowrap lg:block">
                    <ScrollTextReveal delay={225} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      fasilitas indoor dengan suasana tertata,
                    </ScrollTextReveal>
                  </span>
                  <span className="hidden overflow-visible whitespace-nowrap lg:block">
                    <ScrollTextReveal delay={320} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      akses mudah, dan dukungan ruang yang
                    </ScrollTextReveal>
                  </span>
                  <span className="hidden overflow-visible whitespace-nowrap lg:block">
                    <ScrollTextReveal delay={415} className="mb-[-0.14em] pr-[0.08em] pb-[0.14em] whitespace-nowrap">
                      sesuai untuk aktivitas olahraga harian.
                    </ScrollTextReveal>
                  </span>
                </span>
              </h2>
            </ScrollObjectReveal>

            <ScrollObjectReveal delay={230} className="pt-14 xl:hidden">
              <FacilityIntroLink />
            </ScrollObjectReveal>
          </div>
        </div>

        {/* --- FACILITY LIST (NO GAP) --- */}
        <div className="mb-16 flex flex-col gap-0 border-t border-white/10 sm:mb-20 xl:mb-24">
          {renderedList.map((item, index) => (
            <ScrollObjectReveal key={item.id} delay={80 + index * 55}>
              <FacilityListItem item={item} revealDelay={index * 45} />
            </ScrollObjectReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
