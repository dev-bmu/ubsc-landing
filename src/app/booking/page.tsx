import { BookingPage } from '@/features/booking/page/Index'
import { buildPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

// ===== /booking =====
// Data PUBLIK (fasilitas + ulasan disetujui) diambil RSC; yang per-user (canReview, existingReview,
// dan seluruh alur pemesanan) diambil klien lewat TanStack Query dengan enabled:!!user. Pemisahan itulah
// yang menjaga halaman ini tetap ISR 600s, bukan force-dynamic (Rewrite.md).

export function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('booking')
}

export const revalidate = 600

export default BookingPage
