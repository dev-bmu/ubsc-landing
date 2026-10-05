// ===== Media berat di luar git (ubsc-media, R9) =====
// Produksi: NEXT_PUBLIC_MEDIA_URL=https://cdn.ubsportcenter.co.id — nginx menyajikan /var/www/ubsc/media
// langsung, tanpa lewat Node. Kosong (dev): '/assets', yang di-rewrite next.config ke API /media.
// NEXT_PUBLIC_* dibekukan saat build.
const MEDIA_URL = (process.env.NEXT_PUBLIC_MEDIA_URL || '/assets').replace(/\/$/, '')

/** URL berkas media; `path` relatif terhadap root ubsc-media, mis. 'reels/hero.mp4'. */
export const mediaUrl = (path: string): string => `${MEDIA_URL}/${path}`
