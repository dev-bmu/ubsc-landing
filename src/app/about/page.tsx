import { AboutPage } from '@/features/about/page/Index'
import type { Metadata } from 'next'

// ===== /about — statis =====
// Tidak mengambil data sama sekali (Laravel: Inertia::render('AboutPage') tanpa prop), jadi halaman ini
// sepenuhnya statis. Lihat rencana cache per halaman di Rewrite.md.

export const metadata: Metadata = {
  title: 'Tentang Kami — UB Sport Center',
  description:
    'Mengenal UB Sport Center: sejarah, visi misi, layanan, cabang, dan lokasi pusat olahraga Universitas Brawijaya di Malang.'
}

export default AboutPage
