'use client'

import { LocationMapLazy } from '@/components/landing/LocationMapLazy'
import { useEffect, useRef } from 'react'
import bg from '@/assets/images/bg-about.avif'
import person from '@/assets/images/person-map.avif'

export function SectionEight() {
  const sectionRef = useRef<HTMLElement>(null)
  const backgroundRef = useRef<HTMLImageElement>(null)
  const portraitRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const background = backgroundRef.current
    const portrait = portraitRef.current
    if (!section || !background || !portrait) return

    let frame = 0

    const updateParallax = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const progress = Math.max(-1, Math.min(1, (viewportHeight / 2 - (rect.top + rect.height / 2)) / viewportHeight))

        background.style.transform = `translate3d(0, ${progress * 48}px, 0) scale(1.14)`
        portrait.style.transform = `translate3d(0, ${progress * -68}px, 0) scale(1.16)`
      })
    }

    window.addEventListener('scroll', updateParallax, { passive: true })
    window.addEventListener('resize', updateParallax)
    updateParallax()

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateParallax)
      window.removeEventListener('resize', updateParallax)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="about-map"
      className="relative isolate flex min-h-[410px] w-full items-center overflow-hidden bg-black pt-4 pb-5 sm:min-h-[650px] sm:py-14 lg:min-h-[720px] xl:min-h-[606px] xl:py-0"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element -- bg-about.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
        <img
          ref={backgroundRef}
          src={bg.src}
          alt=""
          aria-hidden
          className="h-full w-full scale-[1.14] object-cover object-center will-change-transform"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/35 xl:bg-black/45" />
      </div>

      <div className="mx-auto w-full px-[14px] sm:px-8 lg:px-12 xl:px-[clamp(3.5rem,6.35vw,7.6rem)]">
        <div className="relative grid grid-cols-1 xl:grid-cols-[341px_minmax(0,1fr)] xl:items-start xl:gap-[50px]">
          <div className="relative z-10 flex flex-col xl:pt-[23px]">
            <p className="location-title-shimmer mb-0 text-center font-bdo text-[16px] leading-none font-medium sm:text-xl sm:leading-7 lg:text-2xl lg:leading-8 xl:mb-[29px] xl:pl-[40px] xl:text-left xl:text-[24px]">
              Temukan Lokasi Kami
            </p>

            <div className="relative mx-auto mt-[13px] h-[190px] w-[126px] overflow-hidden rounded-[2px] sm:mt-5 sm:h-[285px] sm:w-[190px] lg:h-[330px] lg:w-[220px] xl:mx-0 xl:mt-0 xl:h-[416px] xl:w-full xl:rounded-[5px]">
              {/* eslint-disable-next-line @next/next/no-img-element -- person-map.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
              <img
                ref={portraitRef}
                src={person.src}
                alt="Lokasi UB Sport Center"
                className="absolute inset-0 h-full w-full scale-[1.16] object-cover object-center will-change-transform"
                draggable={false}
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-black/10" />
            </div>
          </div>

          <div className="relative z-0 mt-5 h-[160px] overflow-hidden rounded-[2px] bg-gray-200 sm:mt-8 sm:h-[280px] lg:mt-10 lg:h-[340px] xl:mt-0 xl:h-[493px] xl:rounded-[5px]">
            <div className="absolute inset-0 h-full w-full">
              <LocationMapLazy cooperativeGestures scrollZoom />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
