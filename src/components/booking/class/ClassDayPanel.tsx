'use client'

/**
 * Port dari UBSC-LARAVEL/resources/js/Components/Booking/Class/ClassDayPanel.tsx.
 *
 * Perubahan terhadap sumber:
 *   - `export default function` -> named export `ClassDayPanel` (konvensi repo).
 *   - `'use client'`: seluruh isi berkas ini adalah tombol dengan onClick (onToggle/onClose),
 *     jadi ia client leaf; halaman yang memakainya tetap boleh Server Component.
 *   - Rename snake -> camel mengikuti DTO kontrak: `already_booked` -> `alreadyBooked`,
 *     `start_time` -> `startTime`.
 *   - Tailwind v3 -> v4 (1 pasang dari spec): `flex flex-shrink-0 items-center gap-2`
 *     -> `flex shrink-0 items-center gap-2`.
 *
 * Teks, urutan DOM, dan seluruh cabang kondisi (mine > dead > picked) DIPERTAHANKAN apa adanya.
 */

import { formatLongDate } from '@/lib/calendar'
import type { ClassDay, ClassSession, SessionKey } from './types'
import { sessionKey } from './types'

interface Props {
  date: string
  day: ClassDay
  selected: Set<SessionKey>
  onToggle: (session: ClassSession) => void
  onClose: () => void
}

const DEAD_COPY: Record<string, string> = {
  full: 'Kuota sesi ini sudah habis',
  past: 'Sesi ini sudah lewat',
  closed: 'Fasilitas tutup pada tanggal ini',
  cancelled: 'Sesi ini dibatalkan'
}

const DEAD_BADGE: Record<string, string> = {
  full: 'Penuh',
  past: 'Lewat',
  closed: 'Tutup',
  cancelled: 'Batal'
}

/**
 * The sessions of one day — where choosing actually happens.
 *
 * States reuse the court slot-tile palette so the two flows read as one
 * product, and `remaining` (which the server has always sent and the client
 * has always thrown away) finally becomes visible scarcity.
 */
export function ClassDayPanel({ date, day, selected, onToggle, onClose }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-clash text-sm font-semibold text-gray-900">{formatLongDate(date)}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup daftar sesi"
          className="-mt-1 -mr-1 rounded-lg p-1.5 text-gray-300 transition hover:bg-gray-50 hover:text-gray-600"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {day.sessions.map((session) => {
          const picked = selected.has(sessionKey(session))
          const dead = session.status !== 'available'
          const mine = session.alreadyBooked
          const almostFull = !dead && !mine && session.remaining > 0 && session.remaining <= 3

          return (
            <li key={session.startTime}>
              <button
                type="button"
                disabled={dead || mine}
                onClick={() => onToggle(session)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition ${
                  mine
                    ? 'cursor-default bg-emerald-50 text-emerald-800'
                    : dead
                      ? 'cursor-not-allowed bg-rose-50 text-rose-300'
                      : picked
                        ? 'bg-accent-red text-white ring-2 ring-accent-red ring-offset-1'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="min-w-0">
                  <span className="block font-clash text-sm font-semibold">{session.label}</span>
                  <span
                    className={`mt-0.5 block font-bdo text-xs ${picked ? 'text-white/75' : mine ? 'text-emerald-700' : dead ? '' : 'text-gray-500'}`}
                  >
                    {mine
                      ? 'Anda sudah terdaftar di sesi ini'
                      : dead
                        ? DEAD_COPY[session.status]
                        : `${session.price} · Sisa ${session.remaining} dari ${session.capacity}`}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2">
                  {almostFull && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bdo text-[10px] font-bold text-amber-700">Hampir penuh</span>
                  )}
                  {mine && <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bdo text-[10px] font-bold text-emerald-700">Terdaftar</span>}
                  {dead && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 font-bdo text-[10px] font-bold text-rose-500">
                      {DEAD_BADGE[session.status]}
                    </span>
                  )}
                  {picked && <span className="rounded-full bg-white/20 px-2 py-0.5 font-bdo text-[10px] font-bold">Dipilih</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
