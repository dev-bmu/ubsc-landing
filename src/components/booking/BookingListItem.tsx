'use client'

/**
 * Port dari UBSC-LARAVEL/resources/js/Components/Booking/BookingListItem.tsx.
 *
 * ===== Batas RSC/client =====
 * Client leaf penuh: useState/useEffect, AnimatePresence, seluruh handler pemilihan slot, dan POST
 * booking. Dipanggil dari BookingSection (juga client); halaman /booking tetap Server Component.
 *
 * ===== Perubahan terhadap sumber =====
 *   - `export default function` -> named export `BookingListItem`. Tipe `BookingFacility` sudah
 *     named export di Laravel dan tetap diekspor dengan nama yang sama (BookingSection memakainya).
 *   - `framer-motion` -> `motion/react`.
 *   - `usePage().props.auth.user` -> `useAuth().user`. Gate tiga-cabang di dalam ringkasan slot
 *     SENGAJA TETAP DITULIS INLINE, tidak diganti `<AuthGate>`: di Laravel pun BookingListItem
 *     punya salinannya sendiri dan tidak mengimpor AuthGate (AuthGate hanya dipakai alur kelas).
 *     Menggantinya akan mengubah pohon DOM — AuthGate membungkus children dalam fragment yang
 *     berbeda urutannya dari cabang inline ini.
 *   - `router.post(route('verification.send'))` -> ResendVerificationButton, sama seperti AuthGate.tsx.
 *   - Inertia `useForm({facility_id, facility_unit_id, booking_date, start_time, end_time, notes})`
 *     + `form.post(route('booking.store'))` -> `useState` untuk `notes` (sumbernya memang textarea
 *     TERKENDALI) + `axiosInstance.post('/customer/booking')` dengan payload camelCase
 *     `CreateBookingRequest`. Envelope `{ success, data }` di-unwrap (`res.data.data`).
 *   - `form.processing` -> state `submitting`; `form.errors.start_time || booking_date ||
 *     facility_unit_id || end_time` -> satu state `submitError` yang diisi dari `extractApiError`
 *     DENGAN URUTAN PRIORITAS YANG SAMA (startTime, bookingDate, facilityUnitId, endTime), lalu
 *     pesan umum sebagai cadangan. Slot DOM paragraf error (kelas mt-3 dst) tidak berubah.
 *   - Laravel membalas `redirect()->route('booking.payment', $lead)`. Padanannya
 *     `router.push(routes.bookingPayment(created.bookingId))` sesudah `onBooked?.()` — persis pola
 *     yang sudah dipakai ClassMonthPicker. `successMsg` dan blok DOM-nya tetap ada apa adanya.
 *   - Semua id `number` -> `string` (uuid): `facilityId`, `selectedUnitId`, `onUnitChange(id)`,
 *     `TimeSlot.facilityUnitId`. `FacilityUnitOption` dialiaskan ke `UnitOption` milik UnitPicker
 *     supaya tidak ada dua definisi unit yang bisa melenceng.
 *   - Helper lokal `rupiah` dan `today` dihapus, diganti `rupiah`/`todayStr` dari '@/lib/calendar'
 *     (R13: satu implementasi format untuk seluruh sistem; `todayStr` juga mengunci zona ke WIB,
 *     bukan zona browser, supaya nilai yang dirender server dan klien sama).
 *   - `const EASE = [...] as const` -> anotasi tuple `[number, number, number, number]`; readonly
 *     tuple tidak assignable ke tipe `ease` milik motion. Nilainya tidak berubah.
 *   - `route('login')` -> `authModal('login')` ('/?auth=login'); GET /login di Laravel pun hanya
 *     `redirect('/?auth=login')`, jadi tujuan akhirnya identik.
 *   - `<img>` fasilitas dipertahankan polos (bukan next/image) dengan eslint-disable — sama seperti
 *     UnitPicker/FacilityCard; gambar CMS dengan fallback aset dan box model tidak boleh berubah.
 *
 * ===== classPairs (spec-BookingListItem.json), 5 buah =====
 *   1. judul baris:      `flex-grow` -> `grow`
 *   2. tombol chevron:   `flex-shrink-0` -> `shrink-0`
 *   3. bingkai gambar:   `aspect-[16/9]` -> `aspect-video`
 *   4. input tanggal:    `focus:outline-none` -> `focus:outline-hidden`
 *   5. textarea catatan: `focus:outline-none` -> `focus:outline-hidden`
 * deadTokens: tidak ada.
 *
 * CATATAN emailVerifiedAt: aturannya sama dengan AuthGate.tsx — hanya `null` yang berarti belum
 * terverifikasi; kirim ulangnya lewat ResendVerificationButton (jeda + batas harian dari server).
 */

import { useState, useEffect, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import { FacilityBadge } from '@/components/landing/FacilityBadge'
import { UnitPicker, type UnitOption } from '@/components/booking/UnitPicker'
import { ResendVerificationButton } from '@/components/auth/EmailVerification'
import { authModal, routes } from '@/config/routes'
import { useAuth } from '@/context/AuthContext'
import { extractApiError } from '@/lib/applyApiErrors'
import axiosInstance from '@/lib/axios'
import { rupiah, todayStr } from '@/lib/calendar'
import { type BookingFees, FeeNote } from './FeeNote'
import type { ApiSuccess, BookingCreatedDto, CreateBookingRequest } from '@/types/contracts/contracts'

interface TimeSlot {
  time: string
  startTime: string
  endTime: string
  price: string
  priceRaw: number
  status: 'available' | 'selected' | 'booked' | 'past'
  past?: boolean
  /** Someone held this slot, even though it has since finished. */
  wasBooked?: boolean
  facilityUnitId?: string | null
}

/** A court reservation is capped at this many consecutive slots. */
const MAX_SLOTS = 6

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

type FacilityUnitOption = UnitOption

export interface BookingFacility {
  /** 'class' swaps the day picker for a month view; everything else is shared. */
  bookingMode?: 'court' | 'class'
  id: string
  facilityId: string
  title: string
  code: string
  image: string
  badgeLocation: string
  badgeType: string
  units: FacilityUnitOption[]
  selectedUnitId: string | null
  availableSlots: TimeSlot[]
}

interface Props {
  /** The class-mode body, supplied by BookingSection. */
  children?: React.ReactNode
  item: BookingFacility
  isOpen: boolean
  fees: BookingFees
  onToggle: () => void
  selectedDate: string
  onDateChange: (date: string) => void
  onUnitChange: (unitId: string) => void
  loadingSlots?: boolean
  slotError?: string | null
  onBooked?: () => void
}

const EASE: [number, number, number, number] = [0.76, 0, 0.24, 1]

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
)

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

function CalendarUI({
  slots,
  selectedDate,
  onDateChange,
  units,
  selectedUnitId,
  onUnitChange,
  loading,
  slotError,
  selectedLo,
  selectedHi,
  anchorIndex,
  focusIndex,
  rangeNotice,
  onSelectSlot,
  onClearSelection
}: {
  slots: TimeSlot[]
  selectedDate: string
  onDateChange: (date: string) => void
  units: FacilityUnitOption[]
  selectedUnitId: string | null
  onUnitChange: (unitId: string) => void
  loading?: boolean
  slotError?: string | null
  selectedLo: number | null
  selectedHi: number | null
  anchorIndex: number | null
  focusIndex: number | null
  rangeNotice: string | null
  onSelectSlot: (index: number) => void
  onClearSelection: () => void
}) {
  const today = todayStr()

  return (
    <div className="rounded-2xl border border-gray-200 p-6 xl:p-8">
      {/* Date picker */}
      <div className="mb-6 flex items-center justify-between">
        <label className="font-bdo text-sm font-medium text-gray-600">Pilih Tanggal</label>
        <input
          type="date"
          value={selectedDate}
          min={today}
          onChange={(e) => {
            if (e.target.value) onDateChange(e.target.value)
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 font-bdo text-sm text-gray-700 transition-colors hover:bg-gray-50 focus:border-slate-400 focus:outline-hidden"
        />
      </div>

      <UnitPicker units={units} selectedUnitId={selectedUnitId} onUnitChange={onUnitChange} />

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <svg className="mr-3 h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-bdo text-sm">Memuat jadwal…</span>
        </div>
      )}

      {/* Error state */}
      {!loading && slotError && (
        <div className="flex items-center justify-center py-10">
          <p className="text-center font-bdo text-sm text-rose-500">{slotError}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !slotError && slots.length === 0 && (
        <div className="flex items-center justify-center py-10">
          <p className="text-center font-bdo text-sm text-gray-400">Tidak ada jadwal tersedia untuk tanggal ini.</p>
        </div>
      )}

      {/* Slot grid */}
      {!loading && !slotError && slots.length > 0 && (
        <>
          <p className="mb-2 font-bdo text-base font-medium text-gray-600">Waktu Yang Tersedia</p>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <p className="font-bdo text-xs text-gray-400">
              Klik satu jam untuk memilih, lalu klik jam di sebelahnya untuk menambah. Klik jam awal lagi untuk membatalkan. Maks. {MAX_SLOTS} jam.
            </p>
            {selectedLo !== null && (
              <button
                type="button"
                onClick={onClearSelection}
                className="shrink-0 rounded-full border border-gray-200 px-3 py-1 font-bdo text-[11px] font-semibold text-gray-500 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Hapus pilihan ✕
              </button>
            )}
          </div>

          {rangeNotice && <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 font-bdo text-xs text-amber-700">{rangeNotice}</p>}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {slots.map((slot, i) => {
              // Anything that is not on sale is equally unclickable.
              // 'past' used to be folded into 'booked', which made a
              // finished free hour claim someone had taken it.
              const isOpen = slot.status === 'available'
              const isSelected = selectedLo !== null && selectedHi !== null && i >= selectedLo && i <= selectedHi
              const isAnchor = i === anchorIndex
              const isEnd = i === focusIndex && focusIndex !== anchorIndex

              // Red is reserved for "you chose this". Blocked slots
              // are slate, so a five-card range no longer reads as
              // five blocked cards.
              const tone = !isOpen
                ? 'bg-slate-100 text-slate-400 border border-dashed border-slate-200 pointer-events-none cursor-not-allowed'
                : isSelected
                  ? isAnchor || isEnd
                    ? 'bg-accent-red text-white cursor-pointer ring-2 ring-accent-red ring-offset-1'
                    : 'bg-accent-red/80 text-white cursor-pointer'
                  : 'bg-gray-50 text-gray-700 cursor-pointer hover:bg-gray-100'

              const badge = !isOpen
                ? slot.status === 'past'
                  ? slot.wasBooked
                    ? 'Selesai'
                    : 'Lewat'
                  : slot.past
                    ? 'Selesai'
                    : 'Penuh'
                : isAnchor && selectedLo !== selectedHi
                  ? 'Mulai'
                  : isEnd
                    ? 'Selesai'
                    : null

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (isOpen) onSelectSlot(i)
                  }}
                  role={isOpen ? 'button' : undefined}
                  {...(isOpen ? { 'aria-pressed': isSelected } : {})}
                  title={!isOpen ? 'Jam ini tidak tersedia' : isAnchor ? 'Klik untuk membatalkan pilihan' : undefined}
                  className={`relative flex flex-col items-center rounded-xl px-2 py-4 text-sm transition-colors ${tone}`}
                >
                  {badge && (
                    <span
                      className={`absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase ${
                        !isOpen ? 'bg-slate-400' : 'bg-accent-red'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                  <span className="font-bdo text-xs font-medium xl:text-sm">{slot.time}</span>
                  {isOpen && <span className={`mt-1 font-bdo text-xs font-light ${isSelected ? 'opacity-90' : 'opacity-70'}`}>{slot.price}</span>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export function BookingListItem({
  item,
  isOpen,
  fees,
  onToggle,
  selectedDate,
  onDateChange,
  onUnitChange,
  loadingSlots,
  slotError,
  onBooked,
  children
}: Props) {
  // A class swaps only the inside of the panel; the row itself is identical.
  const isClassMode = item.bookingMode === 'class'
  const router = useRouter()
  const { user } = useAuth()
  const authUser = user ?? null
  const emailVerified = authUser?.emailVerifiedAt !== null

  // Contiguous slot range selection: [lo, hi] indices into availableSlots.
  const [anchor, setAnchor] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  // Why a click restarted the selection instead of extending it. Without
  // this the selection just teleports and the user is left guessing.
  const [rangeNotice, setRangeNotice] = useState<string | null>(null)

  // Padanan Inertia `form.data.notes` / `form.processing` / `form.errors`.
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const clearSelection = () => {
    setAnchor(null)
    setFocus(null)
    setRangeNotice(null)
  }

  // Reset when the schedule context changes.
  useEffect(() => {
    clearSelection()
    setSubmitError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, item.selectedUnitId, isOpen])

  const lo = anchor === null || focus === null ? null : Math.min(anchor, focus)
  const hi = anchor === null || focus === null ? null : Math.max(anchor, focus)

  const isOpenSlot = (i: number) => item.availableSlots[i]?.status === 'available'

  /**
   * Two slots may be joined only when the earlier one ENDS exactly where the
   * later one STARTS. Array adjacency is not enough: active_slots is an
   * arbitrary set per weekday, so index i and i+1 can be hours apart and a
   * naive range would sell a window the facility does not open.
   */
  const joins = (a: number, b: number) => {
    const earlier = item.availableSlots[Math.min(a, b)]
    const later = item.availableSlots[Math.max(a, b)]
    return Boolean(earlier && later && earlier.endTime === later.startTime)
  }

  /**
   * A click may grow the range by at most ONE slot, and only into a
   * time-adjacent one. Anything further away starts a fresh selection.
   *
   * The old handler extended to wherever you clicked, so picking 15:00 and
   * then 19:00 swallowed 15:00-19:00 — four hours nobody asked for — and
   * clicking the anchor again only collapsed the range instead of clearing
   * it, leaving no way out in one action.
   */
  const handleSelectSlot = (i: number) => {
    setSuccessMsg(null)

    // Blocked slot: never touches the current selection.
    if (!isOpenSlot(i)) return

    if (anchor === null || focus === null) {
      setAnchor(i)
      setFocus(i)
      setRangeNotice(null)
      return
    }

    const loI = Math.min(anchor, focus)
    const hiI = Math.max(anchor, focus)

    // The anchor always clears, in one click.
    if (i === anchor) {
      clearSelection()
      return
    }

    // The far end walks the range back toward the anchor.
    if (i === focus) {
      setFocus(anchor)
      setRangeNotice(null)
      return
    }

    // Inside the range: trim to here, anchor stays put.
    if (i > loI && i < hiI) {
      setFocus(i)
      setRangeNotice(null)
      return
    }

    // One step past either edge: extend, or restart with a reason.
    if (i === hiI + 1 || i === loI - 1) {
      const neighbour = i === hiI + 1 ? hiI : loI
      const wouldBe = hiI - loI + 2

      if (joins(neighbour, i) && wouldBe <= MAX_SLOTS && isOpenSlot(neighbour)) {
        setFocus(i)
        setRangeNotice(null)
        return
      }

      setAnchor(i)
      setFocus(i)
      setRangeNotice(
        wouldBe > MAX_SLOTS
          ? `Maksimal ${MAX_SLOTS} jam per reservasi. Pilihan dimulai ulang di jam ini.`
          : 'Jam ini tidak bersambung dengan pilihan sebelumnya. Pilihan dimulai ulang di jam ini.'
      )
      return
    }

    // Far away: move the selection here rather than sweeping everything in
    // between. This is the reported bug.
    setAnchor(i)
    setFocus(i)
    setRangeNotice(null)
  }

  const selectedStart = lo !== null ? item.availableSlots[lo] : null
  const selectedEnd = hi !== null ? item.availableSlots[hi] : null
  const totalPrice = lo !== null && hi !== null ? item.availableSlots.slice(lo, hi + 1).reduce((sum, s) => sum + (s.priceRaw ?? 0), 0) : 0
  // Clock time, not index distance: a range may span slots of any length.
  const hours = selectedStart && selectedEnd ? (toMinutes(selectedEnd.endTime) - toMinutes(selectedStart.startTime)) / 60 : 0

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedStart || !selectedEnd) return

    const payload: CreateBookingRequest = {
      facilityId: item.facilityId,
      facilityUnitId: item.selectedUnitId,
      bookingDate: selectedDate,
      startTime: selectedStart.startTime,
      endTime: selectedEnd.endTime,
      notes
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await axiosInstance.post<ApiSuccess<BookingCreatedDto>>('/customer/booking', payload)
      const created = res.data.data

      setSuccessMsg('Reservasi berhasil dibuat.')
      clearSelection()
      setNotes('')
      setSubmitError(null)
      onBooked?.()
      router.push(routes.bookingPayment(created.bookingId))
    } catch (err) {
      const { message, fieldErrors } = extractApiError(err, 'Reservasi gagal dibuat. Coba lagi.')
      setSubmitError(fieldErrors.startTime || fieldErrors.bookingDate || fieldErrors.facilityUnitId || fieldErrors.endTime || message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid w-full grid-cols-1 items-start gap-6 border-b border-gray-200 py-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] xl:gap-8">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- gambar fasilitas dari CMS dengan fallback aset /assets; butuh <img> polos agar box model kartu tidak berubah */}
        <img
          src={item.image}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        />
        {!isOpen && (
          <div className="absolute bottom-3 left-3">
            <FacilityBadge location={item.badgeLocation} category={item.badgeType} />
          </div>
        )}
      </div>

      <div className="flex w-full min-w-0 flex-col">
        <div onClick={onToggle} role="button" aria-expanded={isOpen} className="flex w-full cursor-pointer items-center justify-between gap-4 pb-2">
          <span className="grow font-bdo text-[clamp(1.25rem,1.67vw,32px)] leading-tight font-light text-black">{item.title}</span>
          <span className="hidden font-bdo text-sm font-medium whitespace-nowrap text-gray-400 sm:block">{item.code}</span>
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-colors xl:size-11 ${
              isOpen ? 'bg-accent-red text-white' : 'bg-black text-white'
            }`}
          >
            {isOpen ? <XIcon /> : <ChevronDown />}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="mt-6">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-bdo text-lg font-medium text-black">
                    {isClassMode ? 'Pilih jadwal kelas bulan ini' : 'Pilih slot waktu untuk reservasi'}
                  </span>
                  <FacilityBadge location={item.badgeLocation} category={item.badgeType} />
                </div>

                {/* A class swaps the day picker for the month view supplied by
                                    BookingSection. Everything around it — the image, title,
                                    toggle, badge — stays exactly as the courts have it. */}
                {isClassMode ? (
                  children
                ) : (
                  <>
                    {successMsg && (
                      <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                        <p className="font-bdo text-sm text-emerald-700">{successMsg}</p>
                      </div>
                    )}

                    <CalendarUI
                      slots={item.availableSlots}
                      selectedDate={selectedDate}
                      onDateChange={onDateChange}
                      units={item.units}
                      selectedUnitId={item.selectedUnitId}
                      onUnitChange={onUnitChange}
                      loading={loadingSlots}
                      slotError={slotError}
                      selectedLo={lo}
                      selectedHi={hi}
                      anchorIndex={anchor}
                      focusIndex={focus}
                      rangeNotice={rangeNotice}
                      onSelectSlot={handleSelectSlot}
                      onClearSelection={clearSelection}
                    />

                    {selectedStart && selectedEnd && (
                      <div className="mt-6 rounded-2xl border border-gray-200 p-6 xl:p-8">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-bdo text-sm text-gray-500">Slot dipilih · {hours} jam</p>
                            <p className="font-bdo text-lg font-semibold text-black">
                              {selectedDate} · {selectedStart.startTime} – {selectedEnd.endTime}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block rounded-full bg-accent-red/10 px-4 py-1.5 font-bdo text-sm font-bold text-accent-red">
                              {rupiah(totalPrice)}
                            </span>
                            <FeeNote fees={fees} className="mt-1.5 font-bdo text-xs text-gray-500" />
                          </div>
                        </div>

                        {!authUser ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-5 text-center">
                            <p className="mb-4 font-bdo text-sm text-amber-800">Masuk ke akun Anda untuk melanjutkan reservasi dan pembayaran.</p>
                            <a
                              href={authModal('login')}
                              className="inline-block rounded-full bg-accent-red px-6 py-3 font-bdo text-sm font-bold text-white transition-opacity hover:opacity-90"
                            >
                              Masuk / Daftar untuk Reservasi
                            </a>
                          </div>
                        ) : !emailVerified ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-5 text-center">
                            <p className="mb-2 font-bdo text-sm text-amber-800">
                              Email Anda belum diverifikasi. Verifikasi dulu untuk melanjutkan pembayaran, lalu muat ulang halaman.
                            </p>
                            <ResendVerificationButton className="justify-center font-bdo text-sm text-amber-900" />
                          </div>
                        ) : (
                          <form onSubmit={submit}>
                            <div>
                              <label className="mb-1 block font-bdo text-sm text-gray-600">Catatan (opsional)</label>
                              <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 font-bdo text-sm focus:border-slate-400 focus:outline-hidden"
                              />
                            </div>

                            {submitError && <p className="mt-3 font-bdo text-sm text-rose-500">{submitError}</p>}

                            <div className="mt-6 flex items-center gap-3">
                              <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-full bg-accent-red px-6 py-3 font-bdo text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                              >
                                {submitting ? 'Memproses…' : 'Lanjut ke Pembayaran'}
                              </button>
                              <button
                                type="button"
                                onClick={clearSelection}
                                className="rounded-full px-4 py-3 font-bdo text-sm text-gray-500 hover:text-gray-800"
                              >
                                Batal
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
