import bg from '@/assets/images/bg-herobooking.avif'
import { GymTrafficBadge } from '@/components/landing/GymTrafficBadge'
import { HeroBottomBar } from '@/components/landing/HeroBottomBar'
import { AnimatedBookingLink } from '@/components/news/AnimatedBookingLink'
import { routes } from '@/config/routes'

/**
 * Port dari UBSC-LARAVEL/resources/js/Components/Booking/BookingHero.tsx.
 *
 * Perubahan terhadap sumber:
 *   - `export default function` -> named export `BookingHero`.
 *   - TANPA 'use client': tidak ada satu pun hook/handler di berkas ini. HeroBottomBar,
 *     GymTrafficBadge, dan AnimatedBookingLink adalah client leaf-nya sendiri, jadi hero ini
 *     tetap Server Component dan /booking tetap ISR 600s.
 *   - `@/../assets/images/bg-herobooking.avif` -> `@/assets/images/bg-herobooking.avif`; di Next
 *     impor aset menghasilkan StaticImageData, jadi dipakai sebagai `bg.src`.
 *   - `href="/coming-soon"` -> `routes.comingSoon()` (ESLint no-restricted-syntax melarang literal
 *     di prop href).
 *   - `<GymTrafficBadge />` dipanggil tanpa prop, persis seperti sumber. Di Laravel komponen itu
 *     membaca gym_traffic dari usePage; di Next nilainya prop, dan /booking memang TIDAK mengambil
 *     data itu (addendum Fase 6: halaman ini hanya getBookingFacilities + getApprovedReviews),
 *     jadi badge jatuh ke fallback internalnya — sama seperti Laravel saat share-nya kosong.
 *   - `<img>` dipertahankan polos (bukan next/image) karena ini aset desain dan mengganti box
 *     model-nya akan mengubah tampilan; diberi eslint-disable sesuai aturan Fase 5.
 *
 * Spec BookingHero: classPairs kosong, deadTokens kosong — tidak ada class yang berubah.
 */
export function BookingHero() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 right-0 left-0 h-[45vh] overflow-hidden xl:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
        <img src={bg.src} alt="" aria-hidden className="h-full w-full object-cover object-center" />
      </div>
      <div className="pointer-events-none absolute top-[45vh] right-0 bottom-0 left-0 bg-black xl:hidden" />
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 overflow-hidden xl:block">
        {/* eslint-disable-next-line @next/next/no-img-element -- aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
        <img src={bg.src} alt="" aria-hidden className="h-full w-full object-cover object-center" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-black xl:block" />

      <section className="relative grid h-screen min-h-[700px] w-full grid-rows-[45vh_1fr] xl:grid-cols-2 xl:grid-rows-1" id="booking-hero">
        <div className="relative flex flex-col justify-end">
          <div className="relative z-10 p-8 pb-12 xl:p-12 xl:pb-16">
            {/* eslint-disable-next-line @next/next/no-img-element -- aset desain statis di public/assets, bukan gambar CMS /uploads */}
            <img src="/assets/hero/star.png" alt="" aria-hidden className="mb-4 h-12 w-12 xl:h-16 xl:w-16" />
            <h1 className="font-bdo text-[clamp(2rem,2.7vw,52px)] leading-[1.1] font-medium tracking-[-0.017em] text-white">Booking Sekarang</h1>
          </div>
        </div>

        <div className="flex flex-col justify-center overflow-hidden px-8 py-12 xl:px-20 xl:py-20">
          <h2 className="font-archivo text-[clamp(2rem,2.7vw,52px)] leading-[1.1] font-extrabold tracking-[-0.017em] text-white">
            Fasilitas Terbaik Kami
          </h2>

          <p className="mt-6 max-w-lg font-bdo text-[clamp(0.875rem,0.94vw,18px)] leading-relaxed font-light text-white/70">
            Mengenal lebih dekat cerita, nilai, dan dedikasi kami{' '}
            <span className="font-medium text-white">dalam menghadirkan layanan olahraga terbaik untuk semua kalangan.</span>
          </p>

          <div className="mt-12 flex flex-col gap-4">
            <AnimatedBookingLink label="Booking sekarang juga!" href={routes.comingSoon()} />
            <GymTrafficBadge />
          </div>
        </div>
      </section>

      <HeroBottomBar
        variant="transparent"
        sectionNumber="06/"
        sectionLabel="bookingpage"
        description="Temukan fasilitas terbaik dan booking sesi latihan Anda dengan mudah."
        targetId="booking-content"
        showVideo={false}
      />
    </div>
  )
}
