import { FacilityPage } from '@/features/facilities/page/Index'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fasilitas — UB Sport Center',
  description: 'Lapangan, arena, kelas, dan fasilitas outdoor yang tersedia di UB Sport Center Malang.'
}

export const revalidate = 600

export default FacilityPage
