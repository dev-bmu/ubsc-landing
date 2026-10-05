import { BookingPage } from '@/features/booking/page/Index'
import type { Metadata } from 'next'

// ===== /booking =====
// Data PUBLIK (fasilitas + ulasan disetujui) diambil RSC; yang per-user (canReview, existingReview,
// dan seluruh alur pemesanan) diambil klien lewat TanStack Query dengan enabled:!!user. Pemisahan itulah
// yang menjaga halaman ini tetap ISR 600s, bukan force-dynamic (Rewrite.md).

export const metadata: Metadata = {
  title: 'Booking | UB Sport Center',
  description: 'Booking fasilitas olahraga terbaik di UB Sport Center Malang — gym, lapangan futsal, yoga, dan banyak lagi.'
}

export const revalidate = 600

export default BookingPage
