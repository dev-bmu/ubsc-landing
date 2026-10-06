import { BookingPaymentPage } from '@/features/booking-payment/page/Index'
import type { Metadata } from 'next'

// Per-user dan sensitif waktu (countdown hold): tanpa cache sama sekali.
export const metadata: Metadata = {
  title: 'Pembayaran',
  robots: { index: false, follow: false }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BookingPaymentPage bookingId={id} />
}
