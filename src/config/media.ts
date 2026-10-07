// ===== Media berat di luar git (ubsc-media, R9) =====
// Produksi: NEXT_PUBLIC_MEDIA_URL=https://cdn.ubsportcenter.co.id — bucket R2 publik (reels/), tanpa
// lewat VPS. Kosong (dev): '/assets', yang di-rewrite next.config ke API /media.
// NEXT_PUBLIC_* dibekukan saat build.
const MEDIA_URL = (process.env.NEXT_PUBLIC_MEDIA_URL || '/assets').replace(/\/$/, '')

/** URL berkas media; `path` relatif terhadap root ubsc-media, mis. 'reels/hero.mp4'. */
export const mediaUrl = (path: string): string => `${MEDIA_URL}/${path}`

// ===== Gambar CDN untuk <canvas> / fetch blob =====
// Bucket R2 tidak mengirim Access-Control-Allow-Origin, jadi gambar CDN gagal dimuat dengan mode CORS
// (kartu member di canvas) maupun fetch() (unduh QRIS). Rewrite '/cdn-media/:path*' di next.config
// memproksikannya lewat origin landing sendiri. <img> biasa tidak butuh ini.
const CDN_URL = process.env.NEXT_PUBLIC_MEDIA_URL?.replace(/\/$/, '')

/** URL absolut CDN -> '/cdn-media/...' (same-origin). URL lain (relatif /uploads di dev) dikembalikan apa adanya. */
export const sameOriginMedia = (url: string): string => (CDN_URL && url.startsWith(`${CDN_URL}/`) ? `/cdn-media${url.slice(CDN_URL.length)}` : url)
