import { LocationMapLazy } from '@/components/landing/LocationMapLazy'
import person from '@/assets/images/person-map.avif'
import bg from '@/assets/images/bg-about.avif'

/**
 * Port dari resources/js/Components/About/AboutSectionMap.tsx.
 *
 * Server Component: tidak ada hook/handler di berkas ini. Peta memakai kembali
 * `@/components/landing/LocationMapLazy` yang SUDAH di-port (dynamic import maplibre + gate
 * useNearViewport) — tidak ada peta baru yang ditulis. Dipanggil tanpa prop, persis seperti
 * Laravel (SectionEight beranda memakai `cooperativeGestures scrollZoom`; di sini TIDAK).
 *
 * Aset `assets/images/person map.avif` -> `@/assets/images/person-map.avif` (berkas di repo Next
 * sudah di-rename tanpa spasi sejak Fase 2).
 *
 * classPairs (spec-AboutSectionMap.json), 1 buah: `flex-shrink-0` -> `shrink-0` pada judul.
 */
export function AboutSectionMap() {
  return (
    <section id="about-map" className="relative flex h-full w-full items-center overflow-hidden xl:h-[600px]">
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- bg-about.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
        <img src={bg.src} alt="" aria-hidden className="h-full w-full object-cover object-center" loading="lazy" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-8">
        <div className="grid w-full grid-cols-1 items-stretch gap-6 xl:h-[420px] xl:grid-cols-12 xl:gap-16">
          <div className="flex flex-col gap-3 xl:col-span-4 xl:h-full">
            <p className="shrink-0 font-bdo text-[clamp(1rem,1.5vw,1.25rem)] leading-snug font-medium text-white">Temukan Lokasi Kami</p>

            <div className="group relative min-h-[180px] flex-1 overflow-hidden rounded-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element -- person-map.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
              <img
                src={person.src}
                alt="Lokasi UB Sport Center"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                draggable={false}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
          </div>

          <div className="relative h-[280px] overflow-hidden rounded-3xl bg-gray-200 xl:col-span-8 xl:h-auto">
            <div className="absolute inset-0 h-full w-full">
              <LocationMapLazy />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
