import { FacilityClassSection, type ClassItem } from '@/components/facility/FacilityClassSection'
import { FacilityHero } from '@/components/facility/FacilityHero'
import type { FacilityItem } from '@/components/facility/FacilityListItem'
import { FacilityListSection } from '@/components/facility/FacilityListSection'
import { FacilityMembership } from '@/components/facility/FacilityMembership'
import { FacilityOutdoorSection } from '@/components/facility/FacilityOutdoorSection'
import { toOutdoorItems } from '@/components/facility/facilityItems'
import { AboutSectionContact } from '@/components/about/AboutSectionContact'
import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { SectionSeven } from '@/components/landing/SectionSeven'
import { getFacilities } from '@/services/server'
import type { FacilityDto } from '@/types/contracts/contracts'

// ===== Komposisi halaman /facilities (Server Component) =====
// Padanan PublicFacilityController@index + Pages/FacilityPage.tsx Laravel. Pohon DOM-nya persis
// FacilityPage.tsx:74-105, tanpa satu wrapper pun ditambah atau dikurangi:
//
//   <main class="relative">
//     <Navbar activeSection="Facilities"/>
//     <FacilityHero/>
//     <FacilityMembership/>
//     <FacilityListSection facilities={arenaFacilities}/>
//     <FacilityClassSection classes={classFacilities}/>
//     <FacilityOutdoorSection sectionNumber="04" sectionTitle="Fasilitas Outdoor"/>
//     <SectionSeven .../>
//     <AboutSectionContact .../>
//   </main>
//   <Footer/>   (DI LUAR <main>)
//
// Catatan port:
//   - <Head> Inertia DIHAPUS — metadata sudah ada di src/app/facilities/page.tsx.
//   - `usePage().props.facilities` -> getFacilities() di server. Prop `categories` milik payload
//     Laravel TIDAK diambil: FacilityPage.tsx tidak pernah mendestrukturisasinya (data mati).
//   - `import AboutBranches` ada di Laravel tapi TIDAK dipakai di JSX-nya — tidak ikut diport.
//   - Blok komentar `// sectionSubtitle=... // facilities=...` di FacilityOutdoorSection Laravel
//     tidak ikut dibawa; prop yang benar-benar diberikan tetap sama persis (sectionNumber + sectionTitle).
//   - Rename snake->camel mengikuti FacilityDto: class_code->classCode, venue_type->venueType.
//     `String(idx + 1).padStart(2, '0')` dipertahankan verbatim (id DTO kini uuid, tidak dipakai di sini).
//   - Halaman HARUS tetap 200 walau ubsc-api mati: getFacilities() melempar, ditangkap, dan daftarnya
//     jatuh ke [] dan section fasilitas disembunyikan — daftar contoh statis dihapus 2026-09-28 karena
//     tidak ikut status aktif. Pola sama dengan features/home.
export async function FacilityPage() {
  let facilities: FacilityDto[] = []
  try {
    facilities = await getFacilities()
  } catch {
    facilities = []
  }

  const arenaFacilities: FacilityItem[] = facilities
    .filter((f) => f.category === 'Lapangan & Arena')
    .map((f, idx) => ({
      id: String(idx + 1).padStart(2, '0'),
      title: `/${f.name}.`,
      code: f.classCode ? `/${f.classCode}/` : `/Tertutup ${String(idx + 1).padStart(3, '0')}/`,
      image: f.image || '/assets/images/comingsoon.avif',
      badgeLocation: f.location ?? 'Veteran',
      badgeType: f.venueType ?? 'Indoor Facility'
    }))

  const classFacilities: ClassItem[] = facilities
    .filter((f) => f.category === 'Kelas & Kebugaran')
    .map((f, idx) => ({
      id: String(idx + 1).padStart(2, '0'),
      name: f.name,
      code: f.classCode ?? String(idx + 1).padStart(3, '0'),
      image: f.image || '/assets/images/comingsoon.avif',
      badgeLocation: f.location ?? 'Veteran',
      badgeCategory: 'Kebugaran'
    }))

  return (
    <>
      <main className="relative">
        <Navbar activeSection="Facilities" />
        <FacilityHero />
        <FacilityMembership />
        <FacilityListSection facilities={arenaFacilities} />
        <FacilityClassSection classes={classFacilities} />
        <FacilityOutdoorSection sectionNumber="04" sectionTitle="Fasilitas Outdoor" facilities={toOutdoorItems(facilities)} />
        <SectionSeven sectionNumber="05" sectionTitle="Testimoni" sectionSubtitle="05 facility page" />
        <AboutSectionContact sectionNumber="06" sectionTitle="Informasi" sectionSubtitle="06 facility page" />
      </main>
      <Footer />
    </>
  )
}
