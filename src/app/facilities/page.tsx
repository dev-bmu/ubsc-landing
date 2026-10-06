import { FacilityPage } from '@/features/facilities/page/Index'
import { buildPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('facilities')
}

export const revalidate = 600

export default FacilityPage
