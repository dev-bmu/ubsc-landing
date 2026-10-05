import { ForgotPasswordPage } from '@/features/forgot-password/page/Index'
import type { Metadata } from 'next'

// Tujuan tautan "Forgot Password ?" di modal login.
export const metadata: Metadata = {
  title: 'Lupa Password | UB Sport Center',
  robots: { index: false, follow: false }
}

export default function Page() {
  return <ForgotPasswordPage />
}
