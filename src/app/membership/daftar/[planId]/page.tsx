import { MembershipCheckoutPage } from '@/features/membership-checkout/page/Index'
import type { Metadata } from 'next'

// Per-user (harga menurut identitas, status foto): tanpa cache sama sekali.
export const metadata: Metadata = {
  title: 'Daftar Membership',
  robots: { index: false, follow: false }
}

export default async function Page({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params
  return <MembershipCheckoutPage planId={planId} />
}
