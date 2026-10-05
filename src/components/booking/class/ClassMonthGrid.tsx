'use client'

/**
 * Port dari UBSC-LARAVEL/resources/js/Components/Booking/Class/ClassMonthGrid.tsx.
 *
 * Perubahan terhadap sumber:
 *   - `export default function` -> named export `ClassMonthGrid` (konvensi repo).
 *   - `'use client'`: tiap sel bertanggal adalah tombol dengan onClick (onOpenDay).
 *   - Rename snake -> camel mengikuti DTO kontrak: `already_booked` -> `alreadyBooked`,
 *     `start_time` -> `startTime`.
 *   - Spec ClassMonthGrid: classPairs kosong, deadTokens kosong — tidak ada class yang diubah.
 *
 * Helper `Legend` tetap lokal (tidak diekspor), persis seperti di sumber.
 */

import { DAY_LABELS, buildCalendarWeeks, dayNumber, parseMonthKey, todayStr } from '@/lib/calendar'
import type { ClassDay, SessionKey } from './types'
import { sessionKey } from './types'

interface Props {
  month: string
  days: Record<string, ClassDay>
  selected: Set<SessionKey>
  openDate: string | null
  onOpenDay: (date: string) => void
}

/**
 * The month at a glance.
 *
 * Each cell carries a dot per session rather than the times themselves —
 * fitting "09:00" inside a 40px square is what makes month grids unusable on a
 * phone. Picking happens in the day panel; this is the map that gets you there.
 */
export function ClassMonthGrid({ month, days, selected, openDate, onOpenDay }: Props) {
  const { month: m, year } = parseMonthKey(month)
  const weeks = buildCalendarWeeks(m, year)
  const today = todayStr()

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((label) => (
          <div key={label} className="flex h-7 items-center justify-center font-bdo text-[10px] font-bold tracking-wide text-gray-400 uppercase">
            {label}
          </div>
        ))}
      </div>

      <div className="grid gap-1.5">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1.5">
            {week.map((date, dayIndex) => {
              if (!date) {
                return <div key={`${weekIndex}-${dayIndex}`} className="aspect-square" />
              }

              const day = days[date]
              const sessions = day?.sessions ?? []
              const isToday = date === today

              if (sessions.length === 0) {
                return (
                  <div
                    key={date}
                    className={`flex aspect-square min-h-[42px] items-center justify-center rounded-[15px] font-clash text-[13px] text-gray-300 ${
                      isToday ? 'ring-1 ring-gray-200' : ''
                    }`}
                  >
                    {dayNumber(date)}
                  </div>
                )
              }

              const bookable = sessions.filter((s) => s.status === 'available' && !s.alreadyBooked)
              const chosen = sessions.filter((s) => selected.has(sessionKey(s)))
              const enrolled = sessions.some((s) => s.alreadyBooked)
              const allDead = bookable.length === 0
              const isOpen = openDate === date

              const tone =
                chosen.length > 0 && chosen.length === bookable.length
                  ? 'border-accent-red bg-accent-red text-white'
                  : chosen.length > 0
                    ? 'border-accent-red text-accent-red bg-[#FFF7F5]'
                    : enrolled
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : allDead
                        ? 'border-rose-100 bg-rose-50 text-rose-300'
                        : 'border-gray-200 bg-white text-gray-800 hover:border-[#F8B5A8] hover:bg-[#FFF7F5]'

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => onOpenDay(date)}
                  aria-label={`${dayNumber(date)}, ${sessions.length} sesi`}
                  className={`flex aspect-square min-h-[42px] flex-col items-center justify-center gap-1 rounded-[15px] border font-clash text-[13px] font-semibold transition ${tone} ${
                    isOpen ? 'ring-2 ring-accent-red ring-offset-1' : ''
                  } ${isToday ? 'ring-1 ring-gray-300' : ''}`}
                >
                  <span>{dayNumber(date)}</span>
                  <span className="flex gap-0.5">
                    {sessions.map((session) => {
                      const picked = selected.has(sessionKey(session))
                      const dead = session.status !== 'available' || session.alreadyBooked

                      return (
                        <span
                          key={session.startTime}
                          className={`h-1.5 w-1.5 rounded-full ${
                            picked
                              ? chosen.length === bookable.length
                                ? 'bg-white'
                                : 'bg-accent-red'
                              : dead
                                ? 'bg-current opacity-40'
                                : 'bg-[#E35336]'
                          }`}
                        />
                      )
                    })}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-bdo text-[11px] text-gray-400">
        <Legend className="bg-[#E35336]" label="Ada kelas" />
        <Legend className="bg-accent-red" label="Dipilih" />
        <Legend className="bg-emerald-500" label="Sudah terdaftar" />
        <Legend className="bg-rose-300" label="Penuh / lewat / tutup" />
      </div>
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${className}`} />
      {label}
    </span>
  )
}
