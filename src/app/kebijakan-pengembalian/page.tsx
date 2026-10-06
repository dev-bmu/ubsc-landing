import { LegalRefundPage } from '@/features/legal/refund/page/Index'
import { buildPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

// Halaman legal: statis, tanpa data. Wajib ada untuk verifikasi payment gateway.
export function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('refund')
}

export default LegalRefundPage
