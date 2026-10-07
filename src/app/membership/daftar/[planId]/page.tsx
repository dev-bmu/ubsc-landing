import { MEMBERSHIP_ENABLED } from '@/config/features'
import { MembershipCheckoutPage } from '@/features/membership-checkout/page/Index'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

// Per-user (harga menurut identitas, status foto): tanpa cache sama sekali.
export const metadata: Metadata = {
  title: 'Daftar Membership',
  robots: { index: false, follow: false }
}

export default async function Page({ params }: { params: Promise<{ planId: string }> }) {
  // Penjualan membership dimatikan (NEXT_PUBLIC_MEMBERSHIP_ENABLED=false): checkout baru 404.
  // /membership/{id}/pembayaran sengaja tetap hidup untuk pembelian yang sudah dibuat.
  if (!MEMBERSHIP_ENABLED) notFound()
  const { planId } = await params
  return <MembershipCheckoutPage planId={planId} />
}
