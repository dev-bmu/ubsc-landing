import type { NextConfig } from 'next'

// ===== Basis URL ubsc-api =====
// Di dev, Next yang mem-proxy /api dan /uploads lewat rewrites() supaya browser selalu bicara same-origin —
// itu syarat cookie httpOnly bekerja tanpa CORS dan tanpa subdomain api.
// Di produksi kedua path ini diterminasi nginx, bukan diteruskan Next, jadi rewrites() hanya jalur dev.
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4020'

const apiUrl = new URL(API_BASE_URL)
const apiProtocol = apiUrl.protocol === 'https:' ? 'https' : 'http'

const nextConfig: NextConfig = {
  // R10: seluruh URL halaman wajib dibangun lewat src/config/routes.ts, dan typedRoutes yang menegakkannya
  // di level tipe (Link href jadi union route yang benar-benar ada, bukan string bebas).
  // Catatan: di Next < 15.5 opsi ini bernama `experimental.typedRoutes` dan tidak kompatibel dengan Turbopack.
  // Sejak 15.5 opsinya stabil, pindah ke level atas seperti di bawah, dan sudah aman dipakai bersama
  // `next dev --turbopack`. Repo ini mem-pin Next ^15.5.18, jadi bentuk inilah yang benar.
  typedRoutes: true,

  images: {
    // Gambar CMS (thumbnail news, slide promo, logo sponsor, galeri) dilayani dari /uploads dan ukurannya
    // tidak terkendali karena hasil upload user — persis kasus yang optimizer next/image dibuat untuk itu.
    //
    // Hero dan aset statis desain SENGAJA tidak lewat next/image: state machine Hero bergantung pada
    // onLoad/onError elemen <img> asli, dan wrapper next/image mengubah box model padahal elemen itu
    // membawa transform scale(1.4 -> 1) dengan transform-origin 50% 30%.
    //
    // localPatterns dipersempit ke /uploads/** dengan sengaja. Begitu localPatterns diisi, Next menolak
    // path lokal lain, sehingga percobaan memasukkan hero atau aset /images ke next/image langsung gagal
    // saat dev alih-alih diam-diam lolos lalu menggeser layout. Kalau suatu saat ada aset lokal lain yang
    // memang harus dioptimasi, tambahkan polanya di sini secara eksplisit — jangan hapus batasannya.
    localPatterns: [
      {
        pathname: '/uploads/**'
      }
    ],

    // Cadangan untuk kasus API mengembalikan URL absolut ke /uploads (mis. landing dan API beda origin,
    // atau saat menunjuk langsung ke http://localhost:4020 tanpa lewat proxy).
    // TODO Fase 2: tambahkan host CDN/produksi di sini bila upload dipindah keluar dari server aplikasi.
    remotePatterns: [
      {
        protocol: apiProtocol,
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: '/uploads/**'
      }
    ]
  },

  // Alias webpack `canvas: false` dan `encoding: false` dari boilerplate DIHAPUS: stub itu hanya dibutuhkan
  // pdfjs-dist dan node-fetch, dan landing tidak memakai keduanya. Menyisakan blok `webpack` juga akan
  // memunculkan peringatan "Webpack is configured while Turbopack is not" setiap `next dev --turbopack`.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BASE_URL}/api/:path*`
      },
      {
        source: '/uploads/:path*',
        destination: `${API_BASE_URL}/uploads/:path*`
      }
    ]
  }
}

export default nextConfig
