'use client'

/**
 * Port dari UBSC-LARAVEL/resources/js/Components/Booking/Class/ClassPatternChips.tsx.
 *
 * Perubahan terhadap sumber:
 *   - `export default function` -> named export `ClassPatternChips`. `patternKey` sudah named
 *     export di Laravel dan tetap diekspor dengan nama yang sama (dipakai ClassMonthPicker).
 *   - `'use client'`: tiap chip adalah tombol dengan onClick (onToggle).
 *   - Rename snake -> camel mengikuti DTO kontrak: `start_time` -> `startTime`,
 *     `weekday_label` -> `weekdayLabel`, `session_count` -> `sessionCount`.
 *   - Spec ClassPatternChips: classPairs kosong, deadTokens kosong — tidak ada class yang diubah.
 *
 * `{'  '}` (dua spasi literal) di dalam chip DIPERTAHANKAN — itu jarak antara label jadwal dan
 * hitungan sesi di sumber.
 */

import type { ClassPattern } from './types'

interface Props {
  patterns: ClassPattern[]
  /** How many sessions of each pattern are currently selected. */
  selectedCounts: Record<string, number>
  onToggle: (pattern: ClassPattern) => void
  /** "60 menit per sesi" — the first thing people ask after seeing the days. */
  sessionNote?: string
}

export const patternKey = (p: Pick<ClassPattern, 'weekday' | 'startTime'>) => `${p.weekday}|${p.startTime}`

/**
 * The recurring schedule, spelled out.
 *
 * This is the direct answer to "show me which days of the month this class
 * runs" — the customer reads the pattern instead of inferring it from a grid
 * of dots. Each chip is also a bulk selector, because "I'll take the Monday
 * mornings for a month" is how people actually buy a class.
 */
export function ClassPatternChips({ patterns, selectedCounts, onToggle, sessionNote }: Props) {
  if (patterns.length === 0) return null

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-bdo text-[11px] font-bold tracking-wider text-gray-400 uppercase">Jadwal rutin bulan ini</p>
        {sessionNote && (
          <span className="rounded-full bg-[#FFF7F5] px-2.5 py-0.5 font-bdo text-[10px] font-bold text-accent-red ring-1 ring-[#F8B5A8]">
            {sessionNote}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {patterns.map((pattern) => {
          const key = patternKey(pattern)
          const picked = selectedCounts[key] ?? 0
          const all = picked >= pattern.sessionCount && picked > 0
          const some = picked > 0 && !all

          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(pattern)}
              className={`rounded-full border px-4 py-2 text-left font-bdo text-xs font-semibold transition ${
                all
                  ? 'border-accent-red bg-accent-red text-white'
                  : some
                    ? 'border-accent-red bg-[#FFF7F5] text-accent-red'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="font-clash font-semibold">
                {pattern.weekdayLabel} · {pattern.startTime}
              </span>
              <span className={all ? 'text-white/70' : 'text-gray-400'}>
                {'  '}
                {some ? `${picked}/${pattern.sessionCount}` : pattern.sessionCount} sesi
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
