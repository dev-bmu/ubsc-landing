import { NotFoundPage } from '@/features/not-found/page/Index'
import type { Metadata } from 'next'

// ===== 404 =====
// Laravel merendernya lewat Inertia (Pages/Errors/NotFound.tsx); di sini 404 adalah route Next sungguhan.
// Judul & deskripsi disalin dari <Head> halaman itu (NotFound.tsx:80-85).

export const metadata: Metadata = {
  title: '404 | UB Sport Center',
  description: 'Halaman 404 UB Sport Center.'
}

export default NotFoundPage
