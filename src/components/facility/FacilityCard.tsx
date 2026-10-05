// ─────────────────────────────────────────────
// Port 1:1 dari resources/js/Components/Facility/FacilityCard.tsx.
//
// Server Component: tidak ada hook, state, maupun handler.
//
// Perubahan terhadap sumber (semua wajib, tidak satu pun mengubah DOM/tampilan):
//   - default export -> named export; `FacilityCardData` tetap diekspor seperti di Laravel.
//   - <img> aset/gambar fasilitas tetap elemen polos -> eslint-disable no-img-element.
//   - 3 classPairs v3->v4 (spec-FacilityCard.json): rounded-[2rem]->rounded-4xl,
//     flex-shrink-0->shrink-0 pada titik indikator, aspect-[16/9]->aspect-video +
//     lg:aspect-[4/3]->lg:aspect-4/3. Tidak ada deadToken.
//
// Catatan: komponen ini TIDAK dipakai FacilityPage (juga tidak di Laravel) — ia berdiri sendiri dan
// diport agar paritas berkas Components/Facility/ tetap utuh.
// ─────────────────────────────────────────────

interface FacilityTag {
  label: string
}

export interface FacilityCardData {
  id: string
  title: string
  year: string
  image: string
  tags: FacilityTag[]
  activeDotIndex: number
}

interface Props {
  item: FacilityCardData
}

export function FacilityCard({ item }: Props) {
  return (
    <div className="flex flex-col overflow-hidden rounded-4xl bg-white shadow-[0_2px_24px_rgba(0,0,0,0.06)]">
      <div className="relative aspect-video w-full lg:aspect-4/3">
        {/* eslint-disable-next-line @next/next/no-img-element -- gambar fasilitas dari FacilityCardData.image (bisa aset /assets maupun /uploads); butuh elemen polos, bukan next/image */}
        <img src={item.image} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
      </div>

      <div className="flex items-center justify-between p-6 lg:p-8">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((dotIdx) => (
              <span key={dotIdx} className={`h-2 w-2 shrink-0 rounded-full ${dotIdx <= item.activeDotIndex ? 'bg-[#E8190A]' : 'bg-gray-200'}`} />
            ))}
          </div>
          <div className="flex flex-col">
            <span className="font-bdo text-sm font-bold text-black">{item.title}</span>
            <span className="font-bdo text-xs font-medium text-gray-500">{item.year}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {item.tags.map((tag, i) => (
            <span key={i} className="rounded-full bg-gray-100 px-4 py-1.5 font-bdo text-xs font-medium whitespace-nowrap text-gray-600">
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
