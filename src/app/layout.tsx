import './globals.css'
import type { Metadata } from 'next'
import { Providers } from './providers'
import { runContractCheck } from '@/lib/contract-check'

// ===== Pemeriksaan kontrak (dev saja) =====
// Dipanggil di lingkup modul, bukan di dalam komponen: jalan sekali per proses server,
// di luar siklus render, sehingga tidak bisa menyeret route mana pun menjadi dinamis —
// syarat mutlak karena landing bergantung pada ISR per halaman.
runContractCheck()

// ===== Font =====
// Tidak ada next/font. Font UBSC (BDO Grotesk, Clash Display, Archivo Expanded) dideklarasikan
// sebagai @font-face mentah di src/styles/ubsc-base.css dengan nama family aslinya: 21 file
// men-hardcode font-family 'Clash Display' / 'BDO Grotesk' di CSS yang mereka inject saat runtime,
// dan nama ter-obfuscate next/font (mis. __bdo_a1b2c3) akan diam-diam berhenti cocok.
// Figtree dari fonts.bunny.net di app.blade.php Laravel SENGAJA tidak di-port: dimuat tetapi tidak
// pernah dipakai (font-sans Laravel = BDO Grotesk), jadi hanya menambah satu request lintas domain.

export const metadata: Metadata = {
  title: 'UB Sport Center',
  description: 'Pusat olahraga Universitas Brawijaya — booking lapangan, kelas, dan keanggotaan.',
  robots: {
    // Situs publik: boleh diindeks. TODO Fase 5: src/app/robots.ts masih warisan
    // boilerplate (Disallow: /) dan harus diperbaiki bersama sitemap.
    index: true,
    follow: true
  }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Tidak ada ThemeProvider/next-themes di sini. Boilerplate memasangnya dengan
  // defaultTheme="dark" yang menaruh class="dark" di <html>, mengaktifkan blok .dark
  // yang tidak terpakai dan membalik basemap peta.
  return (
    <html lang="id">
      {/* Sama persis dengan <body class="font-sans antialiased"> di app.blade.php Laravel. */}
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        {/* TODO Fase 4: FlashToast bespoke (pill #0d1422, bottom-center) dipasang di sini,
            plus pembacaan ?flash=<code> untuk redirect dari API. Sonner SENGAJA tidak dipakai
            di landing — tampilan defaultnya salah untuk desain ini; sonner hanya untuk admin. */}
      </body>
    </html>
  )
}
