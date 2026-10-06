import { JsonLd } from '@/components/seo/JsonLd'
import { HomePage } from '@/features/home/page/Index'
import { buildPageMetadata, homeJsonLd } from '@/lib/seo'
import type { Metadata } from 'next'

// ===== Beranda publik =====
// Shell rute: menahan metadata + strategi cache. Komposisi sebenarnya ada di
// src/features/home/page/Index.tsx (Server Component yang mengambil data publik dari ubsc-api).
// Halaman ini HARUS tetap 200 walau ubsc-api mati — HomePage menangani kegagalan fetch dan
// komponen punya fallback statis sendiri.

// Judul/deskripsi/OG bisa diatur admin (SEO halaman); default ada di SEO_PAGES (contracts/seo.ts).
export function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('home')
}

// ISR 300 detik, sesuai rencana cache per halaman di Rewrite.md ('/' 300s, '/news' 120s,
// '/pricing' + '/facilities' + '/booking' 600s, '/about' + legal statis).
// Angka ini yang membuat beranda tetap terlayani dari cache walau API sedang lambat, dan
// itu pula alasan JANGAN memakai useSearchParams() di subtree ini: hook itu memaksa route
// jadi dinamis dan mematikan ISR tanpa satu pun error yang kelihatan.
export const revalidate = 300

// JSON-LD di luar <main> supaya pohon DOM HomePage (yang diukur gate fidelity) tidak berubah.
export default function Page() {
  return (
    <>
      <JsonLd data={homeJsonLd()} />
      <HomePage />
    </>
  )
}
