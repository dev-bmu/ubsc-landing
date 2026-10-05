'use client'

import { useState } from 'react'
import type { BranchItem } from '@/config/branches'

// ===== MODULE 1 halaman /branches/[slug] — hero banner + carousel =====
// Client leaf: satu-satunya bagian halaman cabang yang butuh state (`currentSlide` dipakai bersama
// oleh opacity tiap slide DAN oleh tombol dot), jadi seluruh <section> ini harus berada di klien.
// Sisa halaman tetap Server Component. Potongan JSX di bawah disalin 1:1 dari
// resources/js/Pages/Branches/Show.tsx (blok "MODULE 1: Hero Banner").
export function BranchHero({ branch }: { branch: BranchItem }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = branch.imagesArray?.length > 0 ? branch.imagesArray : ['/assets/images/comingsoon.avif']

  return (
    <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden sm:h-[70vh] xl:h-[80vh] xl:min-h-[600px]">
      {slides.map((img, idx) => (
        <div
          key={idx}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: idx === currentSlide ? 1 : 0
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- foto cabang adalah aset statis di public/assets, bukan gambar CMS /uploads */}
          <img src={img} alt={`${branch.title} - ${idx + 1}`} className="h-full w-full object-cover object-center" />
        </div>
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.06)_40%,rgba(0,0,0,0.55)_100%)]" />
      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-12 sm:px-10 sm:pb-16 xl:px-[clamp(2.75rem,4.65vw,5.5rem)] xl:pb-20">
        <span className="mb-4 inline-flex w-fit rounded-full bg-accent-red px-3 py-1 font-bdo text-[10px] font-semibold tracking-wider text-white uppercase sm:px-4 sm:py-1.5 sm:text-xs">
          {branch.categoryBadge}
        </span>
        <h1 className="max-w-[800px] font-bdo text-[clamp(1.75rem,4vw,3.5rem)] leading-[1.08] font-semibold tracking-[-0.04em] text-white">
          {branch.title}
        </h1>
        {slides.length > 1 && (
          <div className="mt-6 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
