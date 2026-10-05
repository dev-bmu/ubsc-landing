import type { ApprovedReviewDto } from '@/types/contracts/contracts'

/**
 * Port dari UBSC-LARAVEL/resources/js/Components/Booking/BookingReviewCard.tsx.
 *
 * Perubahan terhadap sumber:
 *   - `export default function` -> named export `BookingReviewCard`.
 *   - TANPA 'use client': murni presentasional, tidak ada hook/handler. Kartunya ikut dirender di
 *     server saat dipanggil dari section publik.
 *   - `interface Review` yang dideklarasikan ulang di sumber diganti ALIAS ke `ApprovedReviewDto`.
 *     Bentuknya sudah identik field-per-field (id, rating, text, authorName, authorDate, avatar);
 *     menulis ulang interface-nya berarti dua sumber kebenaran yang bisa melenceng diam-diam —
 *     pola yang sama dipakai `components/booking/class/types.ts`. Nama `Review` DIPERTAHANKAN
 *     karena BookingReviewSection mengimpornya dengan nama itu, persis seperti di Laravel.
 *   - `<img>` avatar dipertahankan polos (bukan next/image) dengan eslint-disable, sama seperti
 *     UnitPicker: sumbernya campuran '/storage/<avatar>' dari CMS dan aset ikon default, dan
 *     next/image akan mengubah box model kartu.
 *
 * classPairs (spec-BookingReviewCard.json), 3 buah:
 *   1. kartu luar:   `flex-shrink-0` -> `shrink-0`, `shadow-sm` -> `shadow-xs`
 *   2. kotak bintang:`relative w-4 h-4 flex-shrink-0` -> `... shrink-0`
 *   3. avatar:       `w-12 h-12 rounded-lg object-cover flex-shrink-0` -> `... shrink-0`
 * deadTokens: tidak ada.
 */
export type Review = ApprovedReviewDto

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const isFull = i + 1 <= rating
        const isHalf = !isFull && i + 0.5 <= rating
        return (
          <div key={i} className="relative h-4 w-4 shrink-0">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className="absolute inset-0 fill-current text-gray-300">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {(isFull || isHalf) && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: isFull ? '100%' : '50%' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className="fill-current text-[#005B96]">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function BookingReviewCard({ review }: { review: Review }) {
  return (
    <div className="flex w-[300px] shrink-0 flex-col gap-4 rounded-2xl border border-gray-100 p-6 shadow-xs xl:w-[380px]">
      <div className="flex items-center gap-2">
        <StarDisplay rating={review.rating} />
        <span className="font-bdo text-sm text-gray-500">{review.rating} / 5</span>
      </div>

      <p className="font-bdo text-sm leading-relaxed font-light text-gray-800">{review.text}</p>

      <div className="mt-2 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- avatar dari CMS ('/storage/...') dengan fallback aset ikon; butuh <img> polos agar box model kartu tidak berubah */}
        <img src={review.avatar} alt={review.authorName} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
        <div className="flex flex-col">
          <span className="font-bdo text-sm font-medium text-black">{review.authorName}</span>
          <span className="font-bdo text-xs font-light text-gray-500">{review.authorDate}</span>
        </div>
      </div>
    </div>
  )
}
