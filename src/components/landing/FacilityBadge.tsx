import { MapPin } from 'lucide-react'

type BadgeVariant = 'blue' | 'red' | 'blue-red'

interface FacilityBadgeProps {
  location: string
  category: string
  variant?: BadgeVariant
}

const gradientMap: Record<BadgeVariant, string> = {
  blue: 'from-[#15678D] to-[#153359]',
  red: 'from-[#FF462E] to-[#790A0A]',
  'blue-red': 'from-[#FF0000] to-[#153359]'
}

/**
 * Port dari resources/js/Components/Landing/FacilityBadge.tsx.
 *
 * Server component — tidak ada state, efek, maupun handler.
 *
 * Tiga string class berubah di migrasi v3->v4 (reference/class-migration.json, cari
 * 'Components/Landing/FacilityBadge.tsx'):
 *   bg-gradient-to-r -> bg-linear-to-r
 *   backdrop-blur-sm -> backdrop-blur-xs
 *   flex-shrink-0    -> shrink-0
 * Nilai gradientMap TIDAK berubah dan sengaja tetap hex arbitrer: palet v3 sudah dipasang
 * sebagai hex di @theme (src/styles/tailwind-v3-compat.css), jadi tidak ada pergeseran OKLCH.
 */
export function FacilityBadge({ location, category, variant = 'blue' }: FacilityBadgeProps) {
  return (
    <div className="inline-flex w-fit max-w-full items-stretch overflow-hidden rounded-md border-2 border-black font-medium">
      <div className="font-regular flex shrink-0 items-center gap-1.5 rounded-l-sm bg-black px-2 py-1 font-bdo text-[clamp(0.7rem,0.7vw+0.5rem,1rem)] whitespace-nowrap text-white backdrop-blur-xs lg:px-3 lg:py-1.5">
        <MapPin size={12} className="shrink-0 opacity-70" />
        <span>{location}</span>
      </div>
      <div
        className={`flex shrink-0 items-center bg-linear-to-r font-clash font-semibold ${gradientMap[variant]} px-2 py-1 text-[clamp(0.7rem,0.7vw+0.5rem,1rem)] whitespace-nowrap text-white ring-1 ring-white/10 ring-inset lg:px-3 lg:py-1.5`}
      >
        <span>{category}</span>
      </div>
    </div>
  )
}
