import { ResetPasswordPage } from '@/features/reset-password/page/Index'
import type { Metadata } from 'next'

// Tujuan tautan email lupa password (resetUrl di ubsc-api). Dinamis: token datang lewat query.
export const metadata: Metadata = {
  title: 'Reset Password | UB Sport Center',
  robots: { index: false, follow: false }
}

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams
  return <ResetPasswordPage token={typeof token === 'string' && token !== '' ? token : null} />
}
