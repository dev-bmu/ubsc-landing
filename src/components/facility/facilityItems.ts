import type { ClassItem } from '@/components/facility/FacilityClassSection'
import type { FacilityItem } from '@/components/facility/FacilityListItem'
import type { OutdoorFacility } from '@/components/facility/FacilityOutdoorSection'
import type { FacilityDto } from '@/types/contracts/contracts'

// ===== Fasilitas DB → item kartu section fasilitas =====
// Satu pemetaan untuk beranda, /facilities, dan /booking. API publik sudah hanya mengirim fasilitas
// aktif; section yang listnya kosong disembunyikan — tidak ada lagi daftar contoh statis yang tampil
// menggantikan data (dulu fasilitas nonaktif tetap terlihat lewat daftar contoh itu).

type FacilityLike = Pick<FacilityDto, 'id' | 'name' | 'category' | 'classCode' | 'image' | 'location' | 'venueType'>

const ARENA = 'Lapangan & Arena'
const CLASSES = 'Kelas & Kebugaran'
const NO_IMAGE = '/assets/images/comingsoon.avif'

export function toArenaItems(facilities: FacilityLike[]): FacilityItem[] {
  return facilities
    .filter((f) => f.category === ARENA)
    .map((f, idx) => ({
      id: String(idx + 1).padStart(2, '0'),
      title: `/${f.name}.`,
      code: f.classCode || `/Tertutup ${String(idx + 1).padStart(3, '0')}/`,
      image: f.image || NO_IMAGE,
      badgeLocation: f.location || 'Veteran',
      badgeType: f.venueType || 'Indoor Facility'
    }))
}

export function toClassItems(facilities: FacilityLike[]): ClassItem[] {
  return facilities
    .filter((f) => f.category === CLASSES)
    .map((f, idx) => ({
      id: String(idx + 1).padStart(2, '0'),
      name: f.name,
      code: String(idx + 1).padStart(3, '0'),
      image: f.image || NO_IMAGE,
      badgeLocation: f.location || 'Veteran',
      badgeCategory: f.venueType || 'Kebugaran'
    }))
}

export function toOutdoorItems(facilities: FacilityLike[]): OutdoorFacility[] {
  return facilities
    .filter((f) => f.category === ARENA)
    .map((f) => ({
      id: String(f.id),
      name: f.name,
      category: f.venueType || 'Arena Luar',
      image: f.image || NO_IMAGE,
      location: f.location || 'Dieng',
      venueType: f.venueType || 'Outdoor Facility',
      mapLink: null
    }))
}
