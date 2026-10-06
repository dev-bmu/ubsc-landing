import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/config/site'

// Situs publik: boleh dirayapi, kecuali halaman per-user, alur auth/token, utilitas, dan proxy API.
// Halaman-halaman itu juga membawa meta robots noindex sendiri.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/riwayat-booking',
        '/booking/*/pembayaran',
        '/membership/',
        '/reset-password',
        '/forgot-password',
        '/verifikasi-email',
        '/unauthorized',
        '/styleguide',
        '/revalidate',
        '/api/'
      ]
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  }
}
