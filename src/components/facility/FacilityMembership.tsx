import bg from '@/assets/images/bg-about.avif'
import person from '@/assets/images/person.avif'
import { CurvedLoop } from '@/components/landing/CurvedLoop'
import { LogoMarquee } from '@/components/landing/LogoMarquee'
import { ReservasiButton } from '@/components/landing/ReservasiButton'
import { ScrollTextReveal } from '@/components/landing/ScrollTextReveal'
import { SectionDivider } from '@/components/landing/SectionDivider'
import { MEMBERSHIP_ENABLED } from '@/config/features'

// ─────────────────────────────────────────────
// Port 1:1 dari resources/js/Components/Facility/FacilityMembership.tsx.
//
// Server Component: tidak ada hook maupun handler di berkas ini. Yang interaktif adalah anak-anaknya
// (SectionDivider, ScrollTextReveal, LogoMarquee, CurvedLoop) dan masing-masing sudah 'use client'
// di berkasnya sendiri.
//
// Perubahan terhadap sumber (semua wajib, tidak satu pun mengubah DOM/tampilan):
//   - default export -> named export; impor default Laravel -> impor named repo ini.
//   - `@/../assets/images/*` -> `@/assets/images/*`; keduanya StaticImageData di Next, jadi
//     `url(${bg})` -> `url(${bg.src})` dan `src={person}` -> `src={person.src}`.
//   - `href="#"` pada ReservasiButton dipertahankan verbatim (fidelity) dengan
//     eslint-disable no-restricted-syntax, karena '#' bukan URL halaman yang punya builder routes.*.
//   - 6 classPairs v3->v4 (spec-FacilityMembership.json); yang terakhir sekaligus menghapus deadToken
//     R1 `z-100` pada CurvedLoop (tidak menghasilkan CSS di v3, jadi menghapusnya = tetap setia).
//
// Catatan: `max-w-8xl` pada SECTION_CONTAINER_CLASS juga tidak terdefinisi (tailwind.config.js Laravel
// tidak punya 8xl), tapi spec TIDAK mencantumkannya di deadTokensToRemove — sesuai aturan, token di
// luar daftar tidak boleh dihapus, jadi dibiarkan apa adanya.
// ─────────────────────────────────────────────

const SECTION_CONTAINER_CLASS = 'mx-auto max-w-8xl px-[clamp(1.5rem,4.5vw,5.5rem)]'
const SECTION_HEADING_CLASS = 'font-bdo text-[clamp(1.75rem,2.5vw,3rem)] font-medium leading-[1.1] tracking-[-0.021em] text-black'
const BODY_TEXT_CLASS = 'font-bdo text-[clamp(0.75rem,0.8vw,0.875rem)] font-normal leading-relaxed text-gray-500'
const SECTION_DIVIDER_WRAP_CLASS = 'mx-auto px-[clamp(1.5rem,2.7vw,5.5rem)] pb-16 pt-12 sm:pb-20 md:pt-14 lg:pt-16 xl:pb-16 xl:pt-14'

export function FacilityMembership() {
  return (
    <section className="overflow-x-clip bg-white" id="facility-membership">
      <div className={SECTION_DIVIDER_WRAP_CLASS}>
        <SectionDivider number="01" title="Fasilitas Gym" subtitle="04 facility page" theme="light" />
      </div>

      <div className={`${SECTION_CONTAINER_CLASS} pb-16 xl:pb-20`}>
        {/* Blok penjualan membership ikut saklar NEXT_PUBLIC_MEMBERSHIP_ENABLED; logo sponsor & banner tetap tampil. */}
        {MEMBERSHIP_ENABLED && (
          <>
            <div className="flex flex-col gap-6 xl:hidden">
              <div className="flex items-center gap-4">
                <span className="section-label-diamond" />
                <ScrollTextReveal className="font-bdo text-[clamp(1.16rem,1.32vw,1.45rem)] font-medium tracking-tight">
                  Program Membership
                </ScrollTextReveal>
              </div>

              <ScrollTextReveal as="h2" split="block" delay={80} className={SECTION_HEADING_CLASS}>
                Bergabunglah dengan komunitas olahraga terbaik dan capai target Anda. Kami sedia program terstruktur - semua di satu tempat.
              </ScrollTextReveal>

              <div className="aspect-480/216 w-full overflow-hidden rounded-[5px] bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element -- aset desain statis dari public/assets/images, bukan gambar CMS /uploads */}
                <img
                  src="/assets/images/gym-konten-2-olahraga-ub-sport-center.avif"
                  alt="UB Sport Center membership"
                  className="h-full w-full object-cover"
                />
              </div>

              <ScrollTextReveal as="p" split="words" delay={150} className={BODY_TEXT_CLASS}>
                Daftarkan diri Anda sekarang dan rasakan pengalaman berolahraga yang sesungguhnya. Pilih paket membership yang sesuai dengan kebutuhan
                dan jadwal Anda di UB Sport Center.
              </ScrollTextReveal>

              {/* eslint-disable-next-line no-restricted-syntax -- '#' bukan URL halaman (tidak ada builder routes.* untuknya); dipertahankan verbatim dari Laravel */}
              <ReservasiButton label="Daftar Sekarang" href="#" />
            </div>

            <div className="hidden xl:grid xl:grid-cols-[minmax(28rem,30rem)_minmax(0,1fr)] xl:gap-x-[clamp(5rem,6.25vw,7.5rem)]">
              <div className="flex flex-col gap-[9.4rem]">
                <div className="flex items-center gap-4">
                  <span className="section-label-diamond" />
                  <ScrollTextReveal className="font-bdo text-[clamp(1.16rem,1.32vw,1.45rem)] font-medium tracking-tight">
                    Program Membership
                  </ScrollTextReveal>
                </div>

                <div className="ml-5 aspect-480/216 w-[82%] overflow-hidden rounded-[5px] bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element -- aset desain statis dari public/assets/images, bukan gambar CMS /uploads */}
                  <img
                    src="/assets/images/gym-konten-2-olahraga-ub-sport-center.avif"
                    alt="UB Sport Center membership"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="-ml-16 flex min-w-0 flex-col">
                <ScrollTextReveal as="h2" split="block" delay={80} className={`${SECTION_HEADING_CLASS} max-w-[62rem]`}>
                  Bergabunglah dengan komunitas olahraga terbaik dan capai target Anda. Kami sedia program terstruktur - semua di satu tempat.
                </ScrollTextReveal>

                <div className="mt-[8.85rem] grid grid-cols-[minmax(0,33rem)_auto] items-center gap-x-4">
                  <ScrollTextReveal
                    as="p"
                    split="words"
                    delay={150}
                    className="max-w-108 font-bdo text-[clamp(1rem,1.05vw,1.18rem)] leading-[1.35] font-normal tracking-[-0.03em] text-[#242424]"
                  >
                    Daftarkan diri Anda sekarang dan rasakan pengalaman berolahraga yang sesungguhnya. Pilih paket membership yang sesuai dengan
                    kebutuhan dan jadwal Anda di UB Sport Center.
                  </ScrollTextReveal>
                  {/* eslint-disable-next-line no-restricted-syntax -- '#' bukan URL halaman (tidak ada builder routes.* untuknya); dipertahankan verbatim dari Laravel */}
                  <ReservasiButton label="Daftar Sekarang" href="#" />
                </div>
              </div>
            </div>

            <hr className="my-[4.35rem] w-full border-gray-200" />
          </>
        )}
        <LogoMarquee density="compact" label="/WORKED WITH" />
      </div>

      <div
        className="relative mx-4 mb-10 overflow-hidden py-36 xl:mx-16 xl:mb-12 xl:py-52"
        style={{
          backgroundImage: `url(${bg.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <CurvedLoop
          marqueeText="UB   *   SPORT  *  CENTER   *   UBSC   *   "
          speed={1.5}
          curveAmount={200}
          direction="left"
          interactive
          className="absolute -top-12 h-full xl:-top-16"
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- person.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
          <img src={person.src} alt="UB Sport Center athlete" className="h-44 w-auto object-cover shadow-2xl md:h-64 xl:h-80" />
        </div>
      </div>
    </section>
  )
}
