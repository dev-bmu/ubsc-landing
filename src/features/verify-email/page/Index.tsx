'use client'

import { useEffect, useRef, useState } from 'react'
import { AuthNotice, AuthPageShell, authButtonCls } from '@/components/auth/AuthPageShell'
import { ResendVerificationButton } from '@/components/auth/EmailVerification'
import { AUTH_ENDPOINTS } from '@/config/api'
import { authModal, routes } from '@/config/routes'
import { useAuth } from '@/context/AuthContext'
import { extractApiError } from '@/lib/applyApiErrors'
import axiosInstance from '@/lib/axios'
import type { ApiSuccess } from '@/types/contracts/contracts'

// ===== /verifikasi-email?token= — tautan dari email verifikasi =====
// URL-nya dibangun ubsc-api (verifyUrl di registration-services.ts). Token dikirim lewat BODY, bukan
// path API, supaya tidak tercatat di log akses. Satu POST per muat halaman: ref menahan efek ganda
// StrictMode, karena token sekali pakai.

type State = { status: 'loading' } | { status: 'ok'; email: string } | { status: 'error'; message: string }

export function VerifyEmailPage({ token }: { token: string | null }) {
  const { user, isLoading } = useAuth()
  const [state, setState] = useState<State>(
    token ? { status: 'loading' } : { status: 'error', message: 'Tautan verifikasi tidak lengkap. Buka tautan dari email terbaru Anda.' }
  )
  const posted = useRef(false)

  useEffect(() => {
    if (!token || posted.current) return
    posted.current = true
    axiosInstance
      .post<ApiSuccess<{ verified: boolean; email: string }>>(AUTH_ENDPOINTS.verifyEmail, { token })
      .then((res) => setState({ status: 'ok', email: res.data.data.email }))
      .catch((error) => setState({ status: 'error', message: extractApiError(error, 'Verifikasi gagal. Coba lagi sebentar lagi.').message }))
  }, [token])

  if (state.status === 'loading') {
    return <AuthPageShell title="Memverifikasi email…" description="Sebentar, tautan Anda sedang diperiksa." />
  }

  if (state.status === 'ok') {
    return (
      <AuthPageShell title="Email terverifikasi">
        <AuthNotice tone="ok">
          Email <strong className="break-all">{state.email}</strong> sudah terverifikasi. Anda sekarang bisa membayar reservasi dan membeli
          membership.
        </AuthNotice>
        {/* Anchor biasa, bukan navigasi klien: muat penuh supaya sesi membawa status terverifikasi yang baru. */}
        <a href={routes.home()} className={`${authButtonCls} mt-5`}>
          Ke Beranda
        </a>
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell title="Verifikasi gagal">
      <AuthNotice tone="bad">{state.message}</AuthNotice>
      <div className="mt-5 font-bdo text-sm text-slate-600">
        {isLoading ? null : user && user.emailVerifiedAt === null ? (
          <p>
            Minta tautan baru: <ResendVerificationButton className="text-[#15678D]" />
          </p>
        ) : user ? (
          <a href={routes.home()} className="font-semibold text-[#15678D] hover:underline">
            Ke Beranda
          </a>
        ) : (
          <p>
            <a href={authModal('login')} className="font-semibold text-[#15678D] hover:underline">
              Masuk
            </a>{' '}
            lalu kirim ulang email verifikasi dari menu Profil Saya.
          </p>
        )}
      </div>
    </AuthPageShell>
  )
}
