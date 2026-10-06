import { BookingHistoryPage } from '@/features/booking-history/page/Index'
import type { Metadata } from 'next'

// Per-user sepenuhnya: tanpa ISR, dirender di klien setelah sesi diketahui.
export const metadata: Metadata = {
  title: 'Riwayat Booking',
  robots: { index: false, follow: false }
}

export default BookingHistoryPage
