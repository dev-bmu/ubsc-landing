'use client'

/**
 * Port dari UBSC-LARAVEL/resources/js/Components/Booking/BookingReviewSection.tsx.
 *
 * ===== Batas RSC/client =====
 * Berkas ini client leaf (useState/useEffect/useCallback, embla, motion, form). Yang PUBLIK —
 * daftar ulasan yang sudah disetujui — TIDAK diambil di sini: halaman mengambilnya lewat
 * `getApprovedReviews()` di Server Component dan menurunkannya sebagai prop `approvedReviews`,
 * supaya /booking tetap ISR 600s. Yang PER-USER (canReview + existingReview) diambil di sini
 * lewat TanStack Query dengan `enabled: !!user`; guest tidak pernah menembak endpoint itu.
 * TIDAK ADA useSearchParams() di berkas ini (akan mematikan ISR seluruh subtree diam-diam).
 *
 * ===== Perubahan terhadap sumber =====
 *   - `export default function` -> named export `BookingReviewSection`.
 *   - `framer-motion` -> `motion/react` (API identik).
 *   - `usePage<BookingPageInertiaProps>().props`:
 *       `auth.user`        -> `useAuth().user`
 *       `approved_reviews` -> prop `approvedReviews` (data publik dari RSC)
 *       `can_review`       -> `eligibility.canReview`      (GET /api/customer/reviews/eligibility)
 *       `existing_review`  -> `eligibility.existingReview`  (endpoint yang sama)
 *   - `useForm` Inertia -> `react-hook-form` + `axiosInstance.post('/customer/reviews')` dengan
 *     payload `ReviewPayload` { rating, text }. `processing` -> `formState.isSubmitting`,
 *     `errors.rating`/`errors.text` -> slot error react-hook-form yang diisi dari `extractApiError`
 *     (envelope { code, message, fields }).
 *   - `recentlySuccessful` Inertia ditiru apa adanya: true sesaat setelah simpan, lalu kembali
 *     false setelah 2000 ms (durasi bawaan Inertia), dan di antaranya eligibility di-invalidate
 *     supaya `existingReview` yang baru ikut terbaca — sama seperti Inertia yang me-refresh prop.
 *   - `import type { UserExistingReview } from '@/Pages/BookingPage'` -> `MyReviewDto` dari kontrak
 *     (bentuknya identik: id, rating, text). Tipe `Review` tetap datang dari BookingReviewCard.
 *   - `href="/booking?auth=login"` -> `` `${routes.booking()}?auth=login` `` (ekspresi, bukan
 *     literal, jadi lolos no-restricted-syntax). Navbar-lah yang membaca ?auth= lewat useEffect.
 *
 * ===== classPairs (spec-BookingReviewSection.json), 15 buah =====
 *   flex-shrink-0 -> shrink-0 (8×: badge merah ×2, kartu mobile, tombol nav ×2, ikon Star amber,
 *     ikon CheckCircle, kotak ikon MessageSquareQuote, tombol StarSelector, kolom xl:w-56/xl:w-64 ×3)
 *   shadow-sm -> shadow-xs (2×: BadgePill, dan kartu ulasan lewat BookingReviewCard-nya sendiri)
 *   bg-gradient-to-tr -> bg-linear-to-tr (BadgePill)
 *   bg-[#0B1E3B] -> bg-navy-900, hover:bg-[#0E2444] -> hover:bg-navy-800, fill/text-[#0B1E3B]
 *     -> fill-navy-900/text-navy-900, bg-[#0B1E3B]/5 -> bg-navy-900/5 (alias murni; --color-navy-900
 *     = #0b1e3b dan --color-navy-800 = #0e2444 di src/styles/ubsc-base.css)
 * deadTokens: tidak ada.
 *
 * CATATAN FIDELITAS: `sm   :px-10` pada pembungkus SectionDivider adalah SALAH TULIS DI SUMBER —
 * spasi ganda memecahnya jadi dua token mati (`sm` dan `:px-10`), sehingga di breakpoint sm tidak
 * ada padding 10 sama sekali. Dipertahankan apa adanya; "memperbaikinya" jadi `sm:px-10` akan
 * MENGUBAH tampilan, dan aturan Batch C melarang membetulkan bug tampilan Laravel.
 */

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import useEmblaCarousel from 'embla-carousel-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { CheckCircle, ChevronLeft, ChevronRight, MessageSquareQuote, Star } from 'lucide-react'
import { SectionDivider } from '@/components/landing/SectionDivider'
import { routes } from '@/config/routes'
import { useAuth } from '@/context/AuthContext'
import { extractApiError } from '@/lib/applyApiErrors'
import axiosInstance from '@/lib/axios'
import { cn } from '@/lib/utils'
import type { ApiSuccess, ApprovedReviewDto, MyReviewDto, ReviewEligibilityDto, ReviewPayload } from '@/types/contracts/contracts'
import { BookingReviewCard, type Review } from './BookingReviewCard'

// ── Fallback data (shown when no approved reviews exist yet) ──────────────────

const DUMMY_REVIEWS: Review[] = []

// ── StarSelector (0.5 increment half-star support) ────────────────────────────

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  const resolveValue = (e: React.MouseEvent<HTMLButtonElement>, i: number): number => {
    const rect = e.currentTarget.getBoundingClientRect()
    return e.clientX - rect.left < rect.width / 2 ? i - 0.5 : i
  }

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const isFull = display >= i
        const isHalf = !isFull && display >= i - 0.5
        return (
          <button
            key={i}
            type="button"
            onMouseMove={(e) => setHovered(resolveValue(e, i))}
            onClick={(e) => onChange(resolveValue(e, i))}
            className="relative h-[26px] w-[26px] shrink-0 transition-transform hover:scale-110 active:scale-95"
            aria-label={`${i} bintang`}
          >
            <Star size={26} className="absolute inset-0 fill-transparent text-gray-300 transition-colors duration-150" />
            {(isFull || isHalf) && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: isFull ? '100%' : '50%' }}>
                <Star size={26} className="fill-navy-900 text-navy-900" />
              </div>
            )}
          </button>
        )
      })}
      {value > 0 && <span className="ml-2 font-bdo text-sm text-gray-500 tabular-nums">{value} / 5</span>}
    </div>
  )
}

// ── ReviewForm ────────────────────────────────────────────────────────────────

interface ReviewFormValues {
  rating: number
  text: string
}

function ReviewForm({ existingReview }: { existingReview: MyReviewDto | null }) {
  const isEditing = !!existingReview
  const queryClient = useQueryClient()

  // Padanan `recentlySuccessful` Inertia: menyala sesaat setelah simpan, padam sendiri setelah 2 detik.
  const [recentlySuccessful, setRecentlySuccessful] = useState(false)

  const { register, handleSubmit, watch, setValue, setError, clearErrors, formState } = useForm<ReviewFormValues>({
    defaultValues: {
      rating: existingReview?.rating ?? 0,
      text: existingReview?.text ?? ''
    }
  })
  const { errors, isSubmitting: processing } = formState
  const data = { rating: watch('rating'), text: watch('text') }

  const canSubmit = data.rating >= 0.5 && data.text.trim().length >= 10

  useEffect(() => {
    if (!recentlySuccessful) return
    const timer = window.setTimeout(() => setRecentlySuccessful(false), 2000)
    return () => window.clearTimeout(timer)
  }, [recentlySuccessful])

  const onSubmit = handleSubmit(async (values) => {
    clearErrors()
    const payload: ReviewPayload = { rating: values.rating, text: values.text }
    try {
      await axiosInstance.post<ApiSuccess<MyReviewDto>>('/customer/reviews', payload)
      setRecentlySuccessful(true)
      await queryClient.invalidateQueries({ queryKey: ['review-eligibility'] })
    } catch (err) {
      const { message, fieldErrors } = extractApiError(err, 'Ulasan gagal disimpan. Coba lagi.')
      if (fieldErrors.rating) setError('rating', { message: fieldErrors.rating })
      if (fieldErrors.text) setError('text', { message: fieldErrors.text })
      if (!fieldErrors.rating && !fieldErrors.text) setError('text', { message })
    }
  })

  if (recentlySuccessful) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4"
      >
        <CheckCircle size={18} className="mt-0.5 shrink-0 text-emerald-600" />
        <p className="font-bdo text-sm leading-relaxed text-emerald-700">Berhasil! Ulasan Anda sedang menunggu moderasi admin.</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Star rating */}
      <div className="flex flex-col gap-2">
        <label className="font-bdo text-[11px] font-medium tracking-widest text-gray-400 uppercase">Rating Anda</label>
        <StarSelector value={data.rating} onChange={(v) => setValue('rating', v)} />
        {errors.rating && <p className="font-bdo text-xs text-rose-500">{errors.rating.message}</p>}
      </div>

      {/* Textarea */}
      <div className="flex flex-col gap-2">
        <label className="font-bdo text-[11px] font-medium tracking-widest text-gray-400 uppercase">Ulasan</label>
        <textarea
          {...register('text')}
          rows={5}
          maxLength={1000}
          placeholder="Ceritakan pengalaman Anda menggunakan fasilitas UB Sport Center…"
          className={cn(
            'w-full resize-none rounded-xl border bg-[#F9F9F9] px-4 py-3',
            'font-bdo text-sm leading-relaxed text-gray-800 placeholder-gray-400',
            'transition-all duration-200 focus:bg-white focus:outline-none',
            'focus:border-[#0B1E3B] focus:ring-2 focus:ring-[#0B1E3B]/8',
            errors.text ? 'border-rose-300' : 'border-gray-200'
          )}
        />
        <div className="flex items-center justify-between">
          <p className="font-bdo text-xs text-gray-400">{errors.text?.message ?? 'Minimal 10 karakter'}</p>
          <span className="font-bdo text-xs text-gray-400 tabular-nums">{data.text.length}/1000</span>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit || processing}
        className={cn(
          'w-full rounded-xl py-3.5 font-clash text-sm font-semibold transition-all duration-200',
          canSubmit && !processing
            ? 'bg-[#0B1E3B] text-white hover:-translate-y-0.5 hover:bg-[#0E2444] hover:shadow-lg active:translate-y-0'
            : 'cursor-not-allowed bg-gray-100 text-gray-400'
        )}
      >
        {processing ? 'Menyimpan…' : isEditing ? 'Perbarui Ulasan' : 'Kirim Ulasan'}
      </button>

      {isEditing && (
        <p className="text-center font-bdo text-[11px] text-gray-400">Ulasan sebelumnya aktif — perubahan akan menunggu moderasi ulang.</p>
      )}
    </form>
  )
}

// ── BadgePill ─────────────────────────────────────────────────────────────────

function BadgePill() {
  return (
    <div className="inline-flex w-fit items-center gap-3 overflow-hidden rounded-xl border border-gray-100 bg-white p-1 pr-5 shadow-xs">
      <div className="flex h-12 w-14 items-center justify-center rounded-lg bg-linear-to-tr from-[#002244] to-[#15678D]">
        <MessageSquareQuote size={18} className="text-white" />
      </div>
      <span className="font-bdo text-[14px] font-semibold text-black">Ulasan Member</span>
    </div>
  )
}

// ── Main section ──────────────────────────────────────────────────────────────

interface Props {
  /** Ulasan disetujui — data PUBLIK, diambil Server Component lewat getApprovedReviews(). */
  approvedReviews?: ApprovedReviewDto[]
}

export function BookingReviewSection({ approvedReviews = [] }: Props) {
  const { user } = useAuth()

  // PER-USER: hanya berjalan setelah sesi diketahui. Guest tidak pernah menembak endpoint ini,
  // jadi tidak ada satu pun permintaan ber-cookie yang bisa mengotori cache ISR halaman.
  const { data: eligibility } = useQuery({
    queryKey: ['review-eligibility'],
    queryFn: async () => {
      const res = await axiosInstance.get<ApiSuccess<ReviewEligibilityDto>>('/customer/reviews/eligibility')
      return res.data.data
    },
    enabled: !!user,
    retry: false
  })

  const canReview = eligibility?.canReview ?? false
  const existingReview = eligibility?.existingReview ?? null

  // Use real approved reviews; fall back to dummy data until reviews accumulate
  const reviews = approvedReviews.length > 0 ? approvedReviews : DUMMY_REVIEWS
  const duplicatedReviews = [...reviews, ...reviews]

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    containScroll: 'trimSnaps'
  })

  useEffect(() => {
    if (!emblaApi || reviews.length <= 1) return

    const autoplay = window.setInterval(() => {
      emblaApi.scrollNext()
    }, 7000)

    return () => window.clearInterval(autoplay)
  }, [emblaApi, reviews.length])

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  return (
    <section className="w-full overflow-hidden bg-[#F9F9F9] py-24">
      {/* Section divider */}
      <div className="max-w-8xl sm :px-10 mx-auto px-6 lg:px-16 xl:px-24">
        <SectionDivider number="03" title="Ulasan" subtitle="06 bookingpage" theme="light" />
      </div>

      {/* ── STEP 1: Three-column section header ──────────────────────── */}
      <div className="max-w-8xl mx-auto mt-12 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:gap-16">
          {/* LEFT: small label badge */}
          <div className="flex items-center gap-2 xl:w-64 xl:shrink-0">
            <span className="h-3 w-3 shrink-0 rounded-sm bg-red-600" />
            <span className="font-bdo font-medium tracking-wide text-gray-900" style={{ fontSize: 'clamp(1rem, 1rem, 1.5rem)' }}>
              Fasilitas Kami
            </span>
          </div>

          {/* CENTER: main heading */}
          <div className="min-w-0 flex-1">
            <h2
              className="text-left font-bdo leading-tight font-medium text-black md:text-center"
              style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}
            >
              Dukungan Penuh Untuk <br />
              Setiap Cabang Olahraga
            </h2>
          </div>

          {/* RIGHT: description */}
          <div className="xl:w-56 xl:shrink-0">
            <p className="font-bdo text-sm leading-relaxed text-gray-500">
              Kami menghadirkan berbagai pilihan fasilitas olahraga indoor dan fitness untuk kenyamanan latihan Anda.
            </p>
          </div>
        </div>
      </div>

      {/* ── Mobile: Embla swipe carousel ──────────────────────────────── */}
      <div className="mt-16 w-full xl:hidden">
        {/* Embla viewport */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 pl-6">
            {reviews.map((review, i) => (
              <div key={`${review.id}-${i}`} className="w-[85vw] shrink-0 sm:w-[45vw]">
                <BookingReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>
        {/* Nav buttons — bottom right */}
        <div className="mt-4 flex justify-end gap-2 px-6">
          <button
            onClick={scrollPrev}
            aria-label="Previous review"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={scrollNext}
            aria-label="Next review"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ── Desktop: infinite marquee animation ───────────────────────── */}
      <div className="relative mt-16 hidden w-full xl:flex">
        <motion.div
          className="pointer-events-none flex gap-8 pl-24"
          animate={{ x: ['-50%', '0%'] }}
          transition={{
            repeat: Infinity,
            ease: 'linear',
            duration: 35
          }}
        >
          {duplicatedReviews.map((review, i) => (
            <BookingReviewCard key={`${review.id}-${i}`} review={review} />
          ))}
        </motion.div>
      </div>

      {/* ── Three-column form layout ─────────────────────────────────── */}
      <div className="mx-auto mt-20 flex flex-col gap-8 px-6 sm:px-10 lg:px-16 xl:flex-row xl:items-start xl:gap-32 xl:px-24">
        {/* LEFT — label pinned top, badge centered in remaining height */}
        <div className="flex flex-col gap-6 xl:w-64 xl:shrink-0 xl:self-stretch">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-sm bg-red-600" />
            <span className="font-bdo font-medium tracking-wide text-gray-900" style={{ fontSize: 'clamp(1rem, 1rem, 1.5rem)' }}>
              Suara Member UBSC
            </span>
          </div>

          {/* Mobile-only heading */}
          <div className="font-bdo leading-tight font-medium text-black xl:hidden" style={{ fontSize: 'clamp(1.24rem, 4vw, 1.5rem)' }}>
            <h2>Bagikan Pengalaman</h2>
            <h2>&amp; Masukan Anda</h2>
          </div>

          {/* Desktop pill badge — flex-1 centers it in the space below the label */}
          <div className="hidden flex-1 items-center xl:flex">
            <BadgePill />
          </div>
        </div>

        {/* CENTER — review form states */}
        <div className="min-w-0 flex-1">
          {!user ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900/5">
                  <MessageSquareQuote size={16} className="text-[#0B1E3B]" />
                </div>
                <p className="font-bdo text-sm text-gray-700">Login untuk memberikan ulasan tentang fasilitas kami.</p>
              </div>
              <a
                href={`${routes.booking()}?auth=login`}
                className="w-full rounded-xl bg-navy-900 py-3 text-center font-clash text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-navy-800 hover:shadow-lg"
              >
                Login
              </a>
            </div>
          ) : !canReview ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <Star size={18} className="mt-0.5 shrink-0 fill-amber-400 text-amber-400" />
              <p className="font-bdo text-sm leading-relaxed text-amber-800">Selesaikan pesanan pertama Anda untuk dapat memberikan ulasan.</p>
            </div>
          ) : (
            <ReviewForm existingReview={existingReview} />
          )}
        </div>

        {/* RIGHT — mobile pill + desktop heading */}
        <div className="xl:hidden">
          <BadgePill />
        </div>
        <div className="hidden flex-col xl:flex xl:w-56 xl:shrink-0 xl:self-center">
          <h2 className="font-bdo text-[20px] leading-[1.4] font-medium text-black">
            Bagikan Pengalaman &amp; Masukan Anda untuk Layanan yang Lebih Baik
          </h2>
        </div>
      </div>
    </section>
  )
}
