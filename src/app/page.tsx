import { HomePage } from '@/features/home/page/Index'
import type { Metadata } from 'next'

// ===== Beranda publik =====
// Shell rute: menahan metadata + strategi cache. Komposisi sebenarnya ada di
// src/features/home/page/Index.tsx (Server Component yang mengambil data publik dari ubsc-api).
// Halaman ini HARUS tetap 200 walau ubsc-api mati — HomePage menangani kegagalan fetch dan
// komponen punya fallback statis sendiri.

export const metadata: Metadata = {
  title: 'UB Sport Center — Pusat Olahraga Universitas Brawijaya',
  description:
    'Sewa lapangan, ikuti kelas, dan kelola keanggotaan di UB Sport Center. Booking online untuk futsal, badminton, basket, kolam renang, dan fasilitas lainnya.'
}

// ISR 300 detik, sesuai rencana cache per halaman di Rewrite.md ('/' 300s, '/news' 120s,
// '/pricing' + '/facilities' + '/booking' 600s, '/about' + legal statis).
// Angka ini yang membuat beranda tetap terlayani dari cache walau API sedang lambat, dan
// itu pula alasan JANGAN memakai useSearchParams() di subtree ini: hook itu memaksa route
// jadi dinamis dan mematikan ISR tanpa satu pun error yang kelihatan.
export const revalidate = 300

export default HomePage
