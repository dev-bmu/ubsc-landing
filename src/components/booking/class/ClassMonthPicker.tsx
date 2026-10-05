'use client'

/**
 * Port dari UBSC-LARAVEL/resources/js/Components/Booking/Class/ClassMonthPicker.tsx.
 *
 * Perubahan terhadap sumber:
 *   - `export default function` -> named export `ClassMonthPicker` (konvensi repo).
 *   - `'use client'`: useState/useEffect/useMemo + seluruh handler pilih sesi ada di sini. Ini
 *     client leaf terbesar Fase 6; halaman /booking tetap Server Component dan hanya mengoper prop.
 *   - Inertia `useForm<{notes}>` + `form.post(route('booking.store'))` -> `react-hook-form`
 *     + `axiosInstance.post('/customer/booking')` (baseURL '/api'), payload camelCase sesuai
 *     `CreateBookingRequest`. Envelope `{ success, data }` di-unwrap (`res.data.data`).
 *   - `form.processing` -> `formState.isSubmitting`; `Object.values(form.errors)[0]` ->
 *     satu pesan error dari `extractApiError` (envelope { code, message, fields }).
 *   - Laravel membalas `redirect()->route('booking.payment', $lead)`. Padanannya di sini:
 *     `router.push(routes.bookingPayment(bookingId))` setelah `onBooked?.()`. Tanda tangan prop
 *     `onBooked?: () => void` SENGAJA tidak diubah supaya pemanggilnya tetap sama seperti Laravel.
 *   - `next.has(key) ? next.delete(key) : next.add(key)` (expression statement) ditulis ulang
 *     sebagai if/else — perilaku identik, hanya menghindari no-unused-expressions.
 *   - Rename snake -> camel mengikuti DTO kontrak: `month_label` -> `monthLabel`,
 *     `requires_unit` -> `requiresUnit`, `session_note` -> `sessionNote`, `start_time` -> `startTime`,
 *     `end_time` -> `endTime`, `already_booked` -> `alreadyBooked`. `facilityId`/`selectedUnitId`
 *     kini uuid string (Laravel int).
 *   - Tailwind v3 -> v4 (1 pasang dari spec): `outline-none` -> `outline-hidden` pada textarea.
 *
 * Catatan: pesan flash sukses Laravel ("Reservasi dibuat. Selesaikan transfer sebelum batas waktu.")
 * BELUM punya kode di FLASH_MESSAGES milik `@/components/landing/FlashToast`, jadi di sini hanya
 * terjadi perpindahan halaman — tanpa toast. Lihat laporan Fase 6.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { AuthGate } from '@/components/booking/AuthGate'
import { UnitPicker, type UnitOption } from '@/components/booking/UnitPicker'
import { currentMonthKey, parseMonthKey, shiftMonth } from '@/lib/calendar'
import axiosInstance from '@/lib/axios'
import { extractApiError } from '@/lib/applyApiErrors'
import { routes } from '@/config/routes'
import type { BookingCreatedDto, CreateBookingRequest } from '@/types/contracts/contracts'
import { ClassDayPanel } from './ClassDayPanel'
import { ClassMonthGrid } from './ClassMonthGrid'
import { ClassPatternChips, patternKey } from './ClassPatternChips'
import type { BookingFees } from '../FeeNote'
import { ClassSummary } from './ClassSummary'
import type { ClassMonthData, ClassPattern, ClassSession, SessionKey } from './types'
import { sessionKey } from './types'

interface Props {
  facilityId: string
  units: UnitOption[]
  selectedUnitId: string | null
  onUnitChange: (id: string) => void
  month: string
  fees: BookingFees
  onMonthChange: (month: string) => void
  data: ClassMonthData | null
  loading: boolean
  error: string | null
  onRetry: () => void
  onBooked?: () => void
}

interface NotesFormValues {
  notes: string
}

/**
 * A class, booked by the month.
 *
 * There are not three booking modes here — there is one set of selected
 * sessions plus two shortcuts into it. Tapping a chip picks one session;
 * tapping several picks several; the pattern chips and the "whole month"
 * button are bulk selections over the same set. One state, one cart, one POST.
 */
export function ClassMonthPicker({
  facilityId,
  units,
  selectedUnitId,
  onUnitChange,
  month,
  fees,
  onMonthChange,
  data,
  loading,
  error,
  onRetry,
  onBooked
}: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<SessionKey>>(new Set())
  const [openDate, setOpenDate] = useState<string | null>(null)

  // A different class or a different month is a different set of sessions.
  useEffect(() => {
    setSelected(new Set())
    setOpenDate(null)
  }, [selectedUnitId, month])

  const form = useForm<NotesFormValues>({ defaultValues: { notes: '' } })
  const { errors, isSubmitting } = form.formState

  const allSessions = useMemo(() => Object.values(data?.days ?? {}).flatMap((day) => day.sessions), [data])

  const bookable = useMemo(() => allSessions.filter((s) => s.status === 'available' && !s.alreadyBooked), [allSessions])

  const chosen = useMemo(() => bookable.filter((s) => selected.has(sessionKey(s))), [bookable, selected])

  const selectedCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const session of chosen) {
      const day = data?.days[session.date]
      if (!day) continue
      const key = patternKey({ weekday: day.weekday, startTime: session.startTime })
      counts[key] = (counts[key] ?? 0) + 1
    }
    return counts
  }, [chosen, data])

  const isWholeMonth = bookable.length > 0 && chosen.length === bookable.length
  const atCurrentMonth = month <= currentMonthKey()

  const toggleSession = (session: ClassSession) => {
    setSelected((prev) => {
      const next = new Set(prev)
      const key = sessionKey(session)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const togglePattern = (pattern: ClassPattern) => {
    const matching = bookable.filter((s) => data?.days[s.date]?.weekday === pattern.weekday && s.startTime === pattern.startTime)
    const allPicked = matching.every((s) => selected.has(sessionKey(s)))

    setSelected((prev) => {
      const next = new Set(prev)
      for (const session of matching) {
        if (allPicked) next.delete(sessionKey(session))
        else next.add(sessionKey(session))
      }
      return next
    })
  }

  const submit = form.handleSubmit(async (values) => {
    if (chosen.length === 0) return

    const payload: CreateBookingRequest = {
      notes: values.notes,
      facilityId,
      facilityUnitId: selectedUnitId,
      sessions: chosen.map((s) => ({
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    }

    try {
      const res = await axiosInstance.post<{ success: boolean; data: BookingCreatedDto }>('/customer/booking', payload)
      const created = res.data.data

      setSelected(new Set())
      form.reset({ notes: '' })
      onBooked?.()
      router.push(routes.bookingPayment(created.bookingId))
    } catch (err) {
      const { message, fieldErrors } = extractApiError(err, 'Reservasi gagal dibuat. Coba lagi.')
      form.setError('root', { message: Object.values(fieldErrors)[0] ?? message })
    }
  })

  const unitName = units.find((u) => u.id === selectedUnitId)?.name ?? null
  const firstError = Object.values(errors).find((entry) => typeof entry?.message === 'string')?.message as string | undefined

  return (
    <div className="pb-2">
      <UnitPicker units={units} selectedUnitId={selectedUnitId} onUnitChange={onUnitChange} variant="class" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
          {/* Month navigation */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={atCurrentMonth}
              onClick={() => onMonthChange(shiftMonth(month, -1))}
              aria-label="Bulan sebelumnya"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Chevron dir="left" />
            </button>
            <p className="font-clash text-base font-semibold text-gray-900">{data?.monthLabel ?? monthFallback(month)}</p>
            <button
              type="button"
              onClick={() => onMonthChange(shiftMonth(month, 1))}
              aria-label="Bulan berikutnya"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-600 transition hover:bg-gray-100"
            >
              <Chevron dir="right" />
            </button>
          </div>

          {loading && <SkeletonGrid />}

          {!loading && error && (
            <div className="py-10 text-center">
              <p className="font-bdo text-sm text-rose-500">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 rounded-full border border-gray-200 px-5 py-2 font-bdo text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {!loading && !error && data?.closed && (
            <EmptyState title={`Reservasi ${data.monthLabel} belum dibuka.`} hint="Pendaftaran biasanya dibuka di akhir bulan sebelumnya." />
          )}

          {!loading && !error && data?.requiresUnit && <EmptyState title="Pilih kelas terlebih dahulu untuk melihat jadwal." />}

          {!loading && !error && data && !data.closed && !data.requiresUnit && (
            <>
              {allSessions.length === 0 ? (
                <EmptyState
                  title="Belum ada jadwal kelas di bulan ini."
                  action={
                    <button
                      type="button"
                      onClick={() => onMonthChange(shiftMonth(month, 1))}
                      className="mt-3 rounded-full border border-gray-200 px-5 py-2 font-bdo text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                      Lihat Bulan Berikutnya
                    </button>
                  }
                />
              ) : (
                <div className="space-y-5">
                  <ClassPatternChips
                    patterns={data.patterns}
                    selectedCounts={selectedCounts}
                    onToggle={togglePattern}
                    sessionNote={data.sessionNote}
                  />

                  {bookable.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <button
                        type="button"
                        onClick={() => setSelected(new Set(bookable.map(sessionKey)))}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-bdo text-xs font-semibold transition ${
                          data.summary.package
                            ? 'border-accent-red bg-[#FFF7F5] text-accent-red hover:bg-[#FFEDE8]'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <SelectAllIcon />
                        {data.summary.package
                          ? `Ambil paket 1 bulan · ${bookable.length} sesi · ${data.summary.package.price}`
                          : `Pilih semua sesi tersisa (${bookable.length})`}
                      </button>

                      {chosen.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelected(new Set())}
                          className="font-bdo text-xs text-gray-400 underline-offset-2 transition hover:text-gray-700 hover:underline"
                        >
                          Kosongkan pilihan
                        </button>
                      )}
                    </div>
                  )}

                  <ClassMonthGrid
                    month={month}
                    days={data.days}
                    selected={selected}
                    openDate={openDate}
                    onOpenDay={(date) => setOpenDate((prev) => (prev === date ? null : date))}
                  />

                  {openDate && data.days[openDate] && (
                    <ClassDayPanel
                      date={openDate}
                      day={data.days[openDate]}
                      selected={selected}
                      onToggle={toggleSession}
                      onClose={() => setOpenDate(null)}
                    />
                  )}

                  {bookable.length === 0 && allSessions.length > 0 && (
                    <p className="rounded-xl bg-gray-50 px-4 py-3 font-bdo text-sm text-gray-500">
                      Semua sesi bulan ini sudah penuh atau lewat. Coba kelas paralel lain atau bulan berikutnya.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <ClassSummary
            sessions={chosen}
            summary={data?.summary ?? null}
            isWholeMonth={isWholeMonth}
            unitName={unitName}
            fees={fees}
            onRemove={toggleSession}
            onClear={() => setSelected(new Set())}
          >
            <AuthGate>
              <form onSubmit={submit}>
                <label className="mb-1 block font-bdo text-sm text-gray-600">Catatan (opsional)</label>
                <textarea
                  rows={2}
                  {...form.register('notes')}
                  placeholder="Permintaan khusus…"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 font-bdo text-sm text-gray-700 outline-hidden transition focus:border-accent-red"
                />

                {firstError && <p className="mt-2 font-bdo text-sm text-rose-500">{firstError}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting || chosen.length === 0}
                  className="mt-3 w-full rounded-full bg-accent-red px-6 py-3 font-bdo text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses…' : 'Lanjut ke Pembayaran'}
                </button>
              </form>
            </AuthGate>
          </ClassSummary>
        </div>
      </div>
    </div>
  )
}

/** Stacked ticks: reads as "select these", which a plain label does not. */
function SelectAllIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8l3 3 6-6" />
      <path d="M3 17l3 3 6-6" />
      <path d="M15 5h6M15 14h6" />
    </svg>
  )
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SkeletonGrid() {
  // A grid of placeholders, not a spinner: a spinner makes a month view feel
  // slower than it is because nothing suggests the shape that is coming.
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="aspect-square animate-pulse rounded-[15px] bg-gray-100" />
      ))}
    </div>
  )
}

function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="py-12 text-center">
      <p className="font-bdo text-sm font-semibold text-gray-600">{title}</p>
      {hint && <p className="mt-1 font-bdo text-xs text-gray-400">{hint}</p>}
      {action}
    </div>
  )
}

function monthFallback(month: string): string {
  const { month: m, year } = parseMonthKey(month)
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(year, m - 1, 1))
}
