import { VerifyEmailPage } from '@/features/verify-email/page/Index'
import type { Metadata } from 'next'

// Tujuan tautan email verifikasi (verifyUrl di ubsc-api). Dinamis: token datang lewat query.
export const metadata: Metadata = {
  title: 'Verifikasi Email',
  robots: { index: false, follow: false }
}

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams
  return <VerifyEmailPage token={typeof token === 'string' && token !== '' ? token : null} />
}
