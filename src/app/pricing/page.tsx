import { PricingPage } from '@/features/pricing/page/Index'
import { buildPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('pricing')
}

// ISR 600s sesuai rencana cache Rewrite.md ('/pricing' + '/facilities' + '/booking').
export const revalidate = 600

export default PricingPage
