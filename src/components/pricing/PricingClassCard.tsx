import { FacilityBadge } from '@/components/landing/FacilityBadge'

interface ClassPriceItem {
  label: string
}

export interface ClassPricing {
  id: string
  title: string
  classCode: string
  description: string
  image: string
  badgeLocation: string
  badgeType: string
  daftarHarga: { left: ClassPriceItem[]; right: ClassPriceItem[] }
  persewaan: { left: ClassPriceItem[]; right: ClassPriceItem[] }
}

interface Props {
  item: ClassPricing
}

/**
 * Port dari resources/js/Components/Pricing/PricingClassCard.tsx.
 *
 * Tanpa 'use client' sendiri: murni presentasional, nol state/efek/handler. Karena diimpor langsung
 * oleh PricingClassSection (klien, Embla), ia ikut masuk bundel klien sebagai bagian dari subtree itu —
 * direktif di sini tidak menambah apa pun dan sengaja tidak ditulis.
 *
 * Gambar kelas tetap `<img>` polos (bukan next/image): tingginya dikunci h-[134px]/xl:h-full di dalam
 * wrapper absolut, dan next/image akan menggeser box model itu.
 *
 * classPairs v4 (5):
 *   - kartu: `flex w-[85vw] flex-shrink-0 ...` -> `flex w-[85vw] shrink-0 ...`
 *   - blok Daftar Harga: `... pb-9 pt-[1.75rem] xl:px-6` -> `... pb-9 pt-7 xl:px-6`
 *   - kode kelas: `mt-1 flex-shrink-0 ...` -> `mt-1 shrink-0 ...`
 *   - entri persewaan: `... leading-[1.2] tracking-[-0.025em] ...` -> `... tracking-tight ...`
 *   - entri daftar harga: `... leading-none tracking-[-0.025em] ...` -> `... tracking-tight ...`
 */
export function PricingClassCard({ item }: Props) {
  const title = item.title.replace(/\.$/, '')
  const classCode = item.classCode.replace(/^\/+|\/+$/g, '')

  return (
    <div className="flex w-[85vw] shrink-0 flex-col overflow-hidden rounded-none border border-white/40 bg-black xl:w-[clamp(29.5rem,30.4vw,36.6rem)]">
      <div className="relative h-[134px] xl:h-[14.05rem]">
        {/* eslint-disable-next-line @next/next/no-img-element -- gambar fasilitas dari FacilityDto.image (media CMS); butuh elemen polos, bukan next/image */}
        <img src={item.image} alt={item.title} className="h-[134px] w-full object-cover xl:h-full" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex flex-col justify-between px-7 py-[2.05rem]">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bdo text-[clamp(2rem,2.12vw,2.6rem)] leading-none font-semibold tracking-[-0.07em] text-white">{title}</p>
            <span className="mt-1 shrink-0 font-bdo text-[0.875rem] font-normal tracking-[-0.02em] text-white/80">/{classCode}/</span>
          </div>
          <div>
            <FacilityBadge location={item.badgeLocation} category={item.badgeType} variant="blue-red" />
          </div>
        </div>
      </div>

      <div className="min-h-[12.85rem] px-6 pt-7 pb-9 xl:px-6">
        <p className="mb-[1.15rem] font-bdo text-[1.55rem] leading-none font-medium tracking-[-0.04em] text-white/70">Daftar Harga</p>
        <div className="grid grid-cols-2 gap-x-[4.2rem]">
          <div className="flex flex-col gap-[0.83rem]">
            {item.daftarHarga.left.map((entry, i) => (
              <span key={i} className="font-bdo text-[1rem] leading-none font-medium tracking-tight whitespace-pre-line text-white">
                + {entry.label}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-[0.83rem]">
            {item.daftarHarga.right.map((entry, i) => (
              <span key={i} className="font-bdo text-[1rem] leading-none font-medium tracking-tight whitespace-pre-line text-white">
                + {entry.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-[13.2rem] border-t border-white/20 px-6 pt-[1.95rem] pb-9 xl:px-6">
        <p className="mb-[1.35rem] font-bdo text-[1.55rem] leading-none font-medium tracking-[-0.04em] text-white/70">Persewaan</p>
        <div className="grid grid-cols-2 gap-x-[4.2rem]">
          <div className="flex flex-col gap-[0.83rem]">
            {item.persewaan.left.map((entry, i) => (
              <span key={i} className="font-bdo text-[1rem] leading-[1.2] font-medium tracking-tight whitespace-pre-line text-white">
                + {entry.label}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-[0.83rem]">
            {item.persewaan.right.map((entry, i) => (
              <span key={i} className="font-bdo text-[1rem] leading-[1.2] font-medium tracking-tight whitespace-pre-line text-white">
                + {entry.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
