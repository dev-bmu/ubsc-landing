'use client'

/**
 * Port dari UBSC-LARAVEL/resources/js/Components/Booking/UnitPicker.tsx.
 *
 * Perubahan terhadap sumber:
 *   - `export default function` -> named export `UnitPicker`. Tipe `UnitOption` sudah named export
 *     di Laravel dan tetap diekspor dengan nama yang sama.
 *   - `'use client'`: tiap kartu unit adalah tombol dengan onClick (onUnitChange).
 *   - `UnitOption.id` (dan `selectedUnitId`/`onUnitChange`) `number` -> `string`: id di API baru
 *     adalah uuid string (addendum Fase 5/6). Tidak ada perubahan lain pada bentuk propnya.
 *   - `<img>` dipertahankan polos (BUKAN next/image) dengan eslint-disable, sama seperti
 *     FacilityCard/FacilityOutdoorSection: sumbernya campuran gambar unit dari CMS dan aset
 *     statis `/assets/images/comingsoon.avif`, dan mengubahnya akan mengubah box model.
 *   - Spec UnitPicker: classPairs kosong, deadTokens kosong — tidak ada class yang diubah.
 *
 * Copy COPY.unit / COPY.class, urutan DOM, dan `aria-pressed` DIPERTAHANKAN apa adanya.
 */

export interface UnitOption {
  id: string
  name: string
  image?: string | null
  capacity?: number
}

interface Props {
  units: UnitOption[]
  selectedUnitId: string | null
  onUnitChange: (id: string) => void
  /** Class facilities call these groups, courts call them units. */
  variant?: 'unit' | 'class'
}

const COPY = {
  unit: {
    title: 'Pilih Unit',
    hint: 'Jadwal dihitung per lapangan/ruang yang dipilih.',
    count: (n: number) => `${n} unit`
  },
  class: {
    title: 'Pilih Kelas',
    hint: 'Setiap kelas punya jadwal dan kuota peserta sendiri.',
    count: (n: number) => `${n} kelas`
  }
} as const

/**
 * Lifted out of BookingListItem so the court flow and the class flow share one
 * picker. Parallel groups — Kelas A, Kelas B, Kelas C — are facility units, so
 * this component is the whole of that feature on the customer side.
 */
export function UnitPicker({ units, selectedUnitId, onUnitChange, variant = 'unit' }: Props) {
  if (units.length === 0) return null

  const copy = COPY[variant]

  return (
    <div className="mb-6 rounded-2xl border border-[#F8B5A8]/70 bg-[#FFF7F5]/70 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-bdo text-sm font-semibold text-slate-800">{copy.title}</p>
          <p className="font-bdo text-xs text-slate-500">{copy.hint}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 font-bdo text-[11px] font-bold text-[#B93D2A] ring-1 ring-[#F8B5A8]/70">
          {copy.count(units.length)}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {units.map((unit) => {
          const active = selectedUnitId === unit.id
          return (
            <button
              key={unit.id}
              type="button"
              onClick={() => onUnitChange(unit.id)}
              className={`group flex items-center gap-3 rounded-2xl border p-2 text-left transition-all ${
                active
                  ? 'border-[#E35336] bg-white shadow-[0_18px_30px_-24px_rgba(227,83,54,.8)]'
                  : 'border-white bg-white/70 hover:border-[#F8B5A8] hover:bg-white'
              }`}
              aria-pressed={active}
            >
              <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element -- gambar unit dari CMS dengan fallback aset /assets; butuh <img> polos agar box model kartu tidak berubah */}
                <img
                  src={unit.image || '/assets/images/comingsoon.avif'}
                  alt={unit.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bdo text-sm font-semibold text-slate-800">{unit.name}</span>
                {variant === 'class' && unit.capacity ? (
                  <span className="block font-bdo text-[11px] text-slate-400">Kuota {unit.capacity} peserta</span>
                ) : null}
                <span
                  className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-bdo text-[10px] font-bold ${
                    active ? 'bg-[#FFF7F5] text-[#B93D2A]' : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[#E35336]' : 'bg-slate-300'}`} />
                  {active ? 'Dipilih' : 'Pilih'}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
