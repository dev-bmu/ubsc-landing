import type { Metadata } from 'next'

// ===== Beranda publik =====
// Server Component murni: tidak ada 'use client', tidak ada cookies(), tidak ada fetch.
// Boilerplate mengisi halaman ini dengan pengalih cookie -> redirect('/dashboard' | '/login');
// keduanya tidak ada di landing dan /login memang sengaja tidak boleh dibuat
// (src/config/routes.ts). Halaman ini HARUS tetap 200 walau ubsc-api mati.

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

export default function HomePage() {
  // TODO Fase 4: ganti seluruh isi di bawah dengan koreografi beranda yang sebenarnya, berurutan:
  //   EntranceLoader -> Hero -> Navbar + AuthModal -> SectionTwo .. SectionEight -> Footer
  // Catatan yang mengikat saat mengerjakannya:
  //   - Data nyata dari ubsc-api lewat RSC fetch (announcements, gym_traffic, promo, news,
  //     sponsor, approved_reviews); yang per-user (pending_payment) lewat TanStack Query
  //     dengan enabled: !!user supaya halaman ini tidak jatuh ke force-dynamic.
  //   - Lenis dipasang lewat ReactLenis { lerp: 0.14, smoothWheel: true, syncTouch: false }
  //     plus ScrollReset on pathname change; JANGAN ikut mengimpor lenis/dist/lenis.css.
  //   - AuthModal membaca ?auth=login|register lewat useEffect + window.location.search,
  //     BUKAN useSearchParams(), dan bukan intercepting route.
  //   - Jangan menambah/menghapus satu pun elemen wrapper saat memindahkan section:
  //     .section-two-curtain-edge diposisikan bottom: 100% relatif ke .section-two-curtain.
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-24">
      <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">Universitas Brawijaya</p>

      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">UB Sport Center</h1>

      <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
        Pusat olahraga Universitas Brawijaya untuk umum dan sivitas akademika: sewa lapangan, kelas terjadwal, dan keanggotaan dalam satu tempat.
        Situs ini sedang dibangun ulang — halaman beranda lengkap beserta jadwal dan booking online menyusul.
      </p>
    </main>
  )
}
