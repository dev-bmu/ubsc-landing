import { LegalRefundPage } from '@/features/legal/refund/page/Index'
import type { Metadata } from 'next'

// Halaman legal: statis, tanpa data. Wajib ada untuk verifikasi payment gateway.
export const metadata: Metadata = {
  title: 'Kebijakan Pengembalian — UB Sport Center'
}

export default LegalRefundPage
