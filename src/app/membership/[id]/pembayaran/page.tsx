import { MembershipPaymentPage } from '@/features/membership-payment/page/Index'
import type { Metadata } from 'next'

// Per-user dan sensitif waktu (countdown hold): tanpa cache sama sekali.
export const metadata: Metadata = {
  title: 'Pembayaran Membership | UB Sport Center'
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <MembershipPaymentPage membershipId={id} />
}
