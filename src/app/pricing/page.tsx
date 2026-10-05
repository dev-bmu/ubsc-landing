import { PricingPage } from '@/features/pricing/page/Index'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Harga & Membership — UB Sport Center',
  description: 'Daftar harga sewa fasilitas, kelas, dan paket membership UB Sport Center.'
}

// ISR 600s sesuai rencana cache Rewrite.md ('/pricing' + '/facilities' + '/booking').
export const revalidate = 600

export default PricingPage
