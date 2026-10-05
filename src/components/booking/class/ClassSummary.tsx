'use client'

/**
 * Port dari UBSC-LARAVEL/resources/js/Components/Booking/Class/ClassSummary.tsx.
 *
 * Perubahan terhadap sumber:
 *   - `export default function` -> named export `ClassSummary` (konvensi repo).
 *   - `'use client'`: tombol "Kosongkan" dan tombol hapus tiap baris memakai onClick.
 *   - Rename snake -> camel mengikuti DTO kontrak: `price_raw` -> `priceRaw`,
 *     `saving_raw` -> `savingRaw`, `start_time` -> `startTime`.
 *   - `React.ReactNode` -> `ReactNode` (impor tipe dari 'react'; repo ini tanpa React global).
 *   - Tailwind v3 -> v4 (1 pasang dari spec): `flex flex-shrink-0 items-center gap-2`
 *     -> `flex shrink-0 items-center gap-2`.
 *
 * `rupiah` dan `formatShortDate` diambil dari '@/lib/calendar' (di sana keduanya dialiaskan ke
 * satu-satunya implementasi format milik '@/lib/format').
 */

import type { ReactNode } from 'react'
import { formatShortDate, rupiah } from '@/lib/calendar'
import { type BookingFees, FeeNote } from '../FeeNote'
import type { ClassMonthSummary, ClassSession } from './types'

interface Props {
  sessions: ClassSession[]
  summary: ClassMonthSummary | null
  /** True when the selection is exactly the whole remaining month. */
  isWholeMonth: boolean
  unitName?: string | null
  fees: BookingFees
  onRemove: (session: ClassSession) => void
  onClear: () => void
  children: ReactNode
}

/**
 * What the customer is about to buy.
 *
 * Every row is removable, which is what makes "take the whole month" safe to
 * offer: nobody can attend all thirteen, and if the only way out were to clear
 * and start over, the button would never get used.
 */
export function ClassSummary({ sessions, summary, isWholeMonth, unitName, fees, onRemove, onClear, children }: Props) {
  const perSession = sessions.reduce((sum, s) => sum + (s.priceRaw ?? 0), 0)
  const pkg = isWholeMonth ? (summary?.package ?? null) : null
  const total = pkg ? pkg.priceRaw : perSession

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-clash text-sm font-semibold text-gray-900">
          {sessions.length === 0 ? 'Belum ada sesi dipilih' : `${sessions.length} sesi dipilih`}
        </p>
        {sessions.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="font-bdo text-xs text-gray-400 underline-offset-2 transition hover:text-gray-700 hover:underline"
          >
            Kosongkan
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="mt-2 font-bdo text-sm text-gray-500">
          Pilih tanggal di kalender, atau gunakan chip jadwal rutin untuk mengambil satu pola sekaligus.
        </p>
      ) : (
        <>
          {pkg && (
            <p className="mt-3 rounded-xl bg-[#FFF7F5] px-3.5 py-2.5 font-bdo text-xs text-[#B93D2A]">
              <span className="font-bold">Paket 1 Bulan</span> — harga paket dipakai karena Anda mengambil seluruh sesi bulan ini.
              {pkg.savingRaw > 0 && <> Hemat {rupiah(pkg.savingRaw)} dibanding harga satuan.</>}
            </p>
          )}

          <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto overscroll-contain pr-1">
            {sessions.map((session) => (
              <li key={`${session.date}|${session.startTime}`} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
                <span className="min-w-0 font-bdo text-xs text-gray-700">
                  <span className="font-semibold">{formatShortDate(session.date)}</span>
                  {' · '}
                  {session.startTime}
                  {unitName ? <span className="text-gray-400"> · {unitName}</span> : null}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-bdo text-xs text-gray-500">{rupiah(session.priceRaw)}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(session)}
                    aria-label={`Hapus sesi ${session.date} ${session.startTime}`}
                    className="rounded p-0.5 text-gray-300 transition hover:text-rose-500"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1 border-t border-gray-100 pt-3">
            {pkg && (
              <div className="flex justify-between font-bdo text-xs text-gray-400">
                <span>Harga satuan</span>
                <span className="line-through">{rupiah(perSession)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-bdo text-sm text-gray-600">Total</span>
              <span className="font-clash text-lg font-bold text-gray-900">{rupiah(total)}</span>
            </div>
            <FeeNote fees={fees} className="text-right font-bdo text-xs text-gray-500" />
          </div>
        </>
      )}

      <div className="mt-4">{children}</div>
    </div>
  )
}
