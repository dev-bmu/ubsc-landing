import { SITE_NAME } from '@/types/contracts/seo'

// ===== Identitas situs (metadata, sitemap, robots, JSON-LD) =====
// NEXT_PUBLIC_SITE_URL dibekukan saat build. Produksi: https://ubsportcenter.co.id, dev: http://localhost:3737.
// Dipakai metadataBase (canonical + OpenGraph), sitemap.xml, dan URL absolut di structured data.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3737').replace(/\/+$/, '')

export { SITE_NAME }

/** URL absolut: http(s) dikembalikan apa adanya (mis. CDN R2), path root-relatif ('/uploads/..') diberi prefiks SITE_URL. */
export const absoluteUrl = (pathOrUrl: string): string =>
  /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`

/** Akun sosial resmi — ditampilkan Footer dan dipakai `sameAs` JSON-LD. Satu daftar untuk keduanya. */
export const SOCIAL_URLS = {
  instagram: 'https://www.instagram.com/ubsportcenter/',
  x: 'https://x.com/ubsportcenter',
  tiktok: 'https://www.tiktok.com/@ubsportcenter',
  facebook: 'https://www.facebook.com/sportcenterub/'
} as const

/** Data organisasi untuk structured data — sama dengan yang tampil di Footer. */
export const ORGANIZATION = {
  name: SITE_NAME,
  logo: '/ubsc-blue.png',
  email: 'contact@ubsportcenter.co.id',
  telephone: '+62-341-579955',
  address: {
    streetAddress: 'Jl. Terusan Cibogo No.1, Penanggungan, Kec. Klojen',
    addressLocality: 'Kota Malang',
    addressRegion: 'Jawa Timur',
    postalCode: '65113',
    addressCountry: 'ID'
  },
  sameAs: Object.values(SOCIAL_URLS)
} as const
