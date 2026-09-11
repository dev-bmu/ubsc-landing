import './globals.css'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'
import { Providers } from './providers'
import { runContractCheck } from '@/lib/contract-check'

// ===== Pemeriksaan kontrak (dev saja) =====
// Dipanggil di lingkup modul, bukan di dalam komponen: jalan sekali per proses server,
// di luar siklus render, sehingga tidak bisa menyeret route mana pun menjadi dinamis —
// syarat mutlak karena landing bergantung pada ISR per halaman.
runContractCheck()

// ===== Font =====
// TODO Fase 2: font UBSC WAJIB dideklarasikan sebagai @font-face mentah di globals.css,
// JANGAN next/font/local. next/font menghasilkan nama family ter-obfuscate (mis. __bdo_a1b2c3),
// sementara 21 file men-hardcode font-family 'Clash Display' / 'BDO Grotesk' di CSS yang mereka
// inject saat runtime. Deklarasi itu akan diam-diam berhenti cocok dan teksnya jatuh ke system
// sans — regresi yang lolos review. Plus Jakarta di bawah hanya penyangga sementara boilerplate.
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin']
})

const jakartaDisplay = Plus_Jakarta_Sans({
  variable: '--font-display',
  weight: ['600', '700', '800'],
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'UBS Port Center',
  description: 'Pusat olahraga Universitas Brawijaya — booking lapangan, kelas, dan keanggotaan.',
  icons: {
    // TODO Fase 9: ganti dengan favicon UBSC hasil diet aset.
    icon: '/img/favicon.svg',
    shortcut: '/img/favicon.svg',
    apple: '/img/favicon.svg'
  },
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
      <body className={`${jakarta.variable} ${jakartaDisplay.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        {/* TODO Fase 4: FlashToast bespoke (pill #0d1422, bottom-center) dipasang di sini,
            plus pembacaan ?flash=<code> untuk redirect dari API. Sonner SENGAJA tidak dipakai
            di landing — tampilan defaultnya salah untuk desain ini; sonner hanya untuk admin. */}
      </body>
    </html>
  )
}
