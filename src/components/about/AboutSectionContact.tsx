import { SectionDivider } from '@/components/landing/SectionDivider'
import { ReservasiButton } from '@/components/landing/ReservasiButton'
import { Plus } from 'lucide-react'
import fresh from '@/assets/images/fresh-water.avif'

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-red/10">
        <Plus size={10} className="text-accent-red" strokeWidth={2.5} />
      </div>
      <span className="font-bdo text-[clamp(1rem,1.04vw,20px)] leading-snug font-medium text-black">{text}</span>
    </div>
  )
}

interface AboutSectionContactProps {
  sectionNumber?: string
  sectionTitle?: string
  sectionSubtitle?: string
}

/**
 * Port dari resources/js/Components/About/AboutSectionContact.tsx.
 *
 * Server Component: tidak ada hook/handler; ReservasiButton pun server (hover murni CSS).
 *
 * Dipakai ulang oleh halaman Fase 5 lain lewat prop sectionNumber/Title/Subtitle — signature
 * default-nya dipertahankan persis seperti Laravel (termasuk `= {}` pada parameter).
 *
 * Aset `assets/images/fresh water.avif` -> `@/assets/images/fresh-water.avif` (berkas di repo Next
 * sudah di-rename tanpa spasi sejak Fase 2).
 *
 * classPairs (spec-AboutSectionContact.json), 3 buah — semuanya `flex-shrink-0` -> `shrink-0`:
 * bulatan ikon FeatureItem, kotak merah, dan kolom gambar kartu kontak.
 */
export function AboutSectionContact({
  sectionNumber = '07',
  sectionTitle = 'Informasi',
  sectionSubtitle = 'aboutpage /06'
}: AboutSectionContactProps = {}) {
  return (
    <section className="w-full bg-[#F5F7F9]" id="about-contact">
      <div className="max-w mx-auto px-6 py-8 sm:px-10 sm:py-12 lg:px-16 lg:py-16 xl:px-24 xl:py-24">
        <SectionDivider number={sectionNumber} title={sectionTitle} subtitle={sectionSubtitle} theme="light" />

        <div className="mt-10 grid grid-cols-1 gap-12 xl:grid-cols-12 xl:items-center">
          <div className="flex flex-col xl:col-span-5">
            <div className="mb-6 flex items-center gap-2">
              <div className="h-[17px] w-[17px] shrink-0 rounded bg-[#FF0000]" />
              <span className="font-bdo text-[clamp(1rem,1.25vw,24px)] font-normal text-black">Pusat Bantuan</span>
            </div>

            <h2 className="mb-8 font-bdo text-[clamp(2rem,2.7vw,52px)] leading-[1.1] font-medium tracking-[-0.017em] text-black">Hubungi Kami!</h2>

            <p className="mb-8 font-bdo text-[clamp(1rem,1.04vw,20px)] leading-relaxed font-normal text-black/50">
              Tim UB Sport Center siap membantu kebutuhan reservasi, informasi layanan, dan konsultasi fasilitas olahraga Anda.
            </p>

            <hr className="mb-8 border-black/10" />

            <div className="mb-10 flex flex-col gap-5">
              <FeatureItem text="Respon cepat dan profesional" />
              <FeatureItem text="Layanan reservasi mudah" />
            </div>

            {/* eslint-disable-next-line no-restricted-syntax -- jangkar placeholder '#' dari sumber Laravel, bukan URL halaman internal dari routes.* */}
            <ReservasiButton label="Hubungi Kami" href="#" />
          </div>

          <div className="xl:col-span-7">
            <div className="flex min-h-[320px] flex-col overflow-hidden rounded-[15px] xl:flex-row">
              <div className="relative h-52 shrink-0 xl:h-auto xl:w-[390px]">
                {/* eslint-disable-next-line @next/next/no-img-element -- fresh-water.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
                <img src={fresh.src} alt="UB Sport Center" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              </div>

              <div className="flex flex-1 flex-col justify-center bg-black p-8 xl:p-10">
                <p className="mb-4 font-bdo text-[clamp(1.25rem,1.67vw,32px)] leading-tight font-normal text-white">Hubungi Kami</p>
                <hr className="mb-8 border-white/20" />

                <div className="flex flex-col gap-7">
                  <div>
                    <p className="mb-2 font-bdo text-[clamp(0.875rem,0.83vw,16px)] font-medium text-white/80">Email</p>
                    <p className="font-bdo text-[clamp(0.875rem,0.94vw,18px)] font-normal text-white">contact@ubsportcenter.co.id</p>
                  </div>

                  <div>
                    <p className="mb-2 font-bdo text-[clamp(0.875rem,0.83vw,16px)] font-medium text-white/80">Pusat Panggilan</p>
                    <p className="font-bdo text-[clamp(0.875rem,0.94vw,18px)] font-normal text-white">(0341) 579955</p>
                    <p className="mt-1.5 font-bdo text-[clamp(0.875rem,0.94vw,18px)] font-normal text-white">+62 852-8080-9080</p>
                  </div>

                  <div>
                    <p className="mb-2 font-bdo text-[clamp(0.875rem,0.83vw,16px)] font-medium text-white/80">Lokasi Kami</p>
                    <p className="font-bdo text-[clamp(0.875rem,0.94vw,18px)] leading-relaxed font-normal text-white">
                      Jl. Terusan Cibogo No.1, Penanggungan,
                      <br />
                      Kec. Klojen, Kota Malang, Jawa Timur 65113
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
