import { FacilityClassSection } from '@/components/facility/FacilityClassSection'
import { toArenaItems, toClassItems } from '@/components/facility/facilityItems'
import { FacilityListSection } from '@/components/facility/FacilityListSection'
import type { FacilityDto } from '@/types/contracts/contracts'

/**
 * Port dari UBSC-LARAVEL/resources/js/Components/Booking/BookingFacilitiesSection.tsx.
 *
 * Perubahan terhadap sumber: HANYA `export default function` -> named export, dan impor named
 * untuk kedua section. Tidak ada 'use client': berkas ini murni komposisi, keduanya sudah client
 * leaf sendiri.
 *
 * Catatan: `sectionNumber` / `sectionTitle` / `sectionSubtitle` yang dioper di bawah adalah PROP
 * MATI di kedua section — dideklarasikan di interface-nya tapi tidak pernah didestrukturisasi,
 * baik di Laravel (FacilityListSection.tsx:176-187, FacilityClassSection.tsx:349-357) maupun di
 * port Next-nya. Tetap dioper apa adanya supaya pemanggilnya identik dengan sumber; menghapusnya
 * tidak mengubah satu piksel pun, tapi juga bukan bagian dari port ini.
 *
 * Spec BookingFacilitiesSection: classPairs kosong, deadTokens kosong.
 *
 * Catatan client 2026-09-28: dulu kedua section tanpa data sehingga selalu menampilkan daftar contoh
 * statis — fasilitas yang dinonaktifkan tetap terlihat di /booking. Sekarang diisi fasilitas aktif
 * yang sama dengan grid booking di atasnya.
 */
export function BookingFacilitiesSection({ facilities }: { facilities: FacilityDto[] }) {
  return (
    <>
      <FacilityListSection sectionNumber="02" sectionTitle="Fasilitas Indoor" sectionSubtitle="02 booking" facilities={toArenaItems(facilities)} />
      <FacilityClassSection sectionNumber="03" sectionTitle="Kelas Indoor" sectionSubtitle="02 booking" classes={toClassItems(facilities)} />
    </>
  )
}
