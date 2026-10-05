interface ServiceCardProps {
  index: number
  numberString: string
  title: string
  subtitle: string
  image: string
}

/**
 * Port dari resources/js/Components/About/ServiceCard.tsx.
 *
 * Server Component: tidak ada hook/handler — efek hover murni CSS (`group-hover:scale-105`).
 *
 * Inertia `<Link href="#">` -> `<a href="#">`. Inertia Link memang me-render `<a>`, jadi DOM-nya
 * identik; next/link tidak dipakai karena '#' bukan URL halaman dan akan ditolak typedRoutes.
 *
 * classPairs (spec-ServiceCard.json), 1 buah: `flex-shrink-0` -> `shrink-0` pada nomor kartu.
 */
export function ServiceCard({ index, numberString, title, subtitle, image }: ServiceCardProps) {
  const isTall = index % 2 === 0

  return (
    // eslint-disable-next-line no-restricted-syntax -- jangkar placeholder '#' dari sumber Laravel, bukan URL halaman internal dari routes.*
    <a href="#" className="group flex cursor-pointer flex-col items-start">
      <div className={`w-full overflow-hidden rounded-[15px] ${isTall ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- aboutcard*.avif aset desain dari src/assets (StaticImageData), bukan gambar CMS /uploads */}
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          draggable={false}
        />
      </div>

      <div className="mt-4 flex w-full items-start gap-4">
        <span className="w-8 shrink-0 font-bdo text-[clamp(0.875rem,0.83vw,16px)] font-medium text-black">{numberString}</span>
        <div className="flex flex-col gap-0.5">
          <span className="font-bdo text-[clamp(1rem,1.04vw,20px)] leading-tight font-medium text-black">{title}</span>
          <span className="font-bdo text-[clamp(0.875rem,0.83vw,16px)] font-light text-black/60">{subtitle}</span>
        </div>
      </div>
    </a>
  )
}
