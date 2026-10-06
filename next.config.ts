import type { NextConfig } from 'next'

// ===== Basis URL ubsc-api =====
// Next mem-proxy /api dan /uploads lewat rewrites() supaya browser selalu bicara same-origin — itu syarat
// cookie httpOnly bekerja tanpa CORS dan tanpa subdomain api. Berlaku di dev dan produksi (nginx hanya
// meneruskan domain ke Next).
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4020'

const apiUrl = new URL(API_BASE_URL)
const apiProtocol = apiUrl.protocol === 'https:' ? 'https' : 'http'

// Domain bucket R2 publik. Di produksi API menyajikan URL unggahan sebagai
// https://cdn.ubsportcenter.co.id/uploads/... (R2_PUBLIC_URL API harus sama dengan nilai ini).
const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL

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
    // atau saat menunjuk langsung ke http://localhost:4020 tanpa lewat proxy), plus CDN R2 di produksi.
    remotePatterns: [
      {
        protocol: apiProtocol,
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: '/uploads/**'
      },
      ...(MEDIA_URL ? [{ protocol: 'https' as const, hostname: new URL(MEDIA_URL).hostname, pathname: '/uploads/**' }] : [])
    ]
  },

  // /berita dan /artikel hanya awalan URL detail (/berita/<slug>, /artikel/<slug>); daftar keduanya ada di /news.
  async redirects() {
    return [
      { source: '/berita', destination: '/news', permanent: true },
      { source: '/artikel', destination: '/news', permanent: true }
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
      },
      // Video TIDAK ikut git (R9): berkasnya tinggal di direktori media bersama dan dipindahkan dengan
      // ubsc-api/ops/scripts/sync-media.sh. Komponen memakai mediaUrl() (src/config/media.ts): di produksi
      // langsung ke CDN (NEXT_PUBLIC_MEDIA_URL), di dev '/assets/reels/...' yang ditangkap rewrite ini.
      //
      // Array rewrites polos berjalan SETELAH filesystem (afterFiles). Itu yang membuat prefiks ini boleh
      // dipakai bersama: thumbnail .avif ada di public/assets/reels/ dan dilayani Next lebih dulu, hanya
      // .mp4 yang tidak ada di sana dan jatuh ke rewrite. Jangan pindahkan ke beforeFiles — thumbnail akan
      // ikut diproksikan dan hilang.
      //
      // /api dan /uploads dipakai di dev DAN produksi: nginx hanya meneruskan domain ke Next
      // (ubsc-api/docs/fase-10.md §4). Tujuannya dibekukan saat build dari API_BASE_URL.
      {
        source: '/assets/reels/:path*',
        destination: `${API_BASE_URL}/media/reels/:path*`
      }
    ]
  }
}

export default nextConfig
