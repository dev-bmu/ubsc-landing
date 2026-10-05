// ===== Data cabang (statis) =====
// Di Laravel array ini di-hardcode di dalam closure route `/branches/{slug}` (routes/web.php:94-146)
// dengan komentar "replace with Branch model when available". Tidak ada tabel Branch, jadi ia pindah
// ke sini apa adanya — API tidak perlu model untuk data yang tidak pernah berubah lewat panel.
// Dipakai `generateStaticParams` supaya /branches/[slug] ter-render statis (Rewrite.md).
//
// Isi field DISALIN VERBATIM dari Laravel, termasuk teks deskripsi dan URL embed peta.

export interface BranchItem {
  id: number
  title: string
  slug: string
  categoryBadge: string
  description: string
  gmapsEmbedUrl: string
  address: string
  contact: string
  operatingHours: string
  imagesArray: string[]
}

export interface OtherBranch {
  id: number
  title: string
  slug: string
  address: string
  image: string
}

/** Fallback gambar saat sebuah cabang belum punya foto — sama dengan Laravel. */
const BRANCH_FALLBACK_IMAGE = '/assets/images/comingsoon.avif'

export const BRANCHES: Record<string, BranchItem> = {
  'ubsc-veteran': {
    id: 1,
    title: 'UB Sport Center Veteran',
    slug: 'ubsc-veteran',
    categoryBadge: 'Pusat Kebugaran Utama',
    description:
      'UB Sport Center Veteran merupakan pusat kebugaran utama yang berlokasi strategis di kawasan Veteran, Malang. Fasilitas ini menyediakan berbagai jenis peralatan gym modern, studio kelas kelompok, dan area latihan fungsional yang dirancang untuk memenuhi kebutuhan olahraga seluruh kalangan.\n\nDengan suasana yang nyaman dan dukungan pelatih profesional, UB Sport Center Veteran menjadi pilihan utama bagi mahasiswa dan masyarakat umum yang ingin menjalani gaya hidup sehat dan aktif. Tersedia berbagai program latihan mulai dari yoga, zumba, hingga kelas kekuatan dan ketahanan.',
    gmapsEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3947.8!2d112.615!3d-7.965!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sUB+Sport+Center!5e0!3m2!1sen!2sid!4v1',
    address: 'Jl. Veteran, Ketawanggede, Kec. Lowokwaru, Kota Malang, Jawa Timur 65145',
    contact: '+62 341 123 4567',
    operatingHours: 'Senin – Minggu, 06.00 – 21.00 WIB',
    imagesArray: ['/assets/images/ub-sport-center-kantor-pusat-malang.avif', '/assets/images/fasilitas-bulutangkis-ub-sport-center.avif']
  },
  'ubsc-dieng': {
    id: 2,
    title: 'UB Sport Center Dieng',
    slug: 'ubsc-dieng',
    categoryBadge: 'Cabang Arena Terbuka',
    description:
      'UB Sport Center Dieng merupakan cabang arena terbuka yang menawarkan fasilitas olahraga outdoor berkualitas di kawasan Dieng, Malang. Dengan lapangan luas dan pemandangan yang asri, cabang ini cocok untuk berbagai aktivitas olahraga mulai dari sepak bola, voli, hingga lari.\n\nFasilitas ini dilengkapi dengan tribun, area parkir luas, dan musholla. Cocok untuk kegiatan komunitas, turnamen, maupun latihan rutin.',
    gmapsEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3947.5!2d112.61!3d-7.97!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sUB+Sport+Center+Dieng!5e0!3m2!1sen!2sid!4v1',
    address: 'Jl. Dieng, Kota Malang, Jawa Timur',
    contact: '+62 341 765 4321',
    operatingHours: 'Senin – Minggu, 06.00 – 18.00 WIB',
    imagesArray: ['/assets/images/fasilitas-arena-terbuka-dieng-ub-sport-center-malang.avif']
  }
}

export const BRANCH_SLUGS = Object.keys(BRANCHES)

/** Cabang selain `slug`, dalam bentuk ringkas — padanan `$otherBranches` di closure Laravel. */
export function otherBranches(slug: string): OtherBranch[] {
  return Object.values(BRANCHES)
    .filter((branch) => branch.slug !== slug)
    .map((branch) => ({
      id: branch.id,
      title: branch.title,
      slug: branch.slug,
      address: branch.address,
      image: branch.imagesArray[0] ?? BRANCH_FALLBACK_IMAGE
    }))
}
