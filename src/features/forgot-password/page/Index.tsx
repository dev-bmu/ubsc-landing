'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { AuthNotice, AuthPageShell, authButtonCls, authInputCls, authLabelCls } from '@/components/auth/AuthPageShell'
import { AUTH_ENDPOINTS } from '@/config/api'
import { authModal } from '@/config/routes'
import { extractApiError } from '@/lib/applyApiErrors'
import axiosInstance from '@/lib/axios'

// ===== /forgot-password — minta tautan reset password =====
// Tujuan tautan "Forgot Password ?" di modal login. Balasan API selalu generik (anti-enumerasi) dan
// dibatasi jeda 60 detik per akun, jadi tombolnya ikut menunggu 60 detik setelah terkirim.

const RESEND_WAIT_SECONDS = 60

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [wait, setWait] = useState(0)

  useEffect(() => {
    if (wait <= 0) return
    const timer = setTimeout(() => setWait((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await axiosInstance.post(AUTH_ENDPOINTS.forgotPassword, { email })
      setSentTo(email)
      setWait(RESEND_WAIT_SECONDS)
    } catch (err) {
      const { message, fieldErrors } = extractApiError(err, 'Gagal mengirim tautan. Coba lagi sebentar lagi.')
      setError(fieldErrors.email ?? message)
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthPageShell title="Lupa password" description="Masukkan email akun Anda. Kami kirim tautan untuk membuat password baru.">
      {sentTo && (
        <AuthNotice tone="ok">
          Bila <strong className="break-all">{sentTo}</strong> terdaftar, tautan reset sudah dikirim dan berlaku 60 menit. Cek inbox dan folder spam.
        </AuthNotice>
      )}

      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="forgot_email" className={authLabelCls}>
            Email
          </label>
          <input
            id="forgot_email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputCls}
          />
          {error && <p className="mt-1.5 font-bdo text-xs text-rose-600">{error}</p>}
        </div>
        <button type="submit" disabled={pending || wait > 0} className={authButtonCls}>
          {pending ? 'Mengirim…' : wait > 0 ? `Kirim lagi dalam ${wait} detik` : sentTo ? 'Kirim ulang tautan' : 'Kirim tautan reset'}
        </button>
      </form>

      <p className="mt-5 text-center font-bdo text-sm text-slate-500">
        Ingat password?{' '}
        <a href={authModal('login')} className="font-semibold text-[#15678D] hover:underline">
          Masuk
        </a>
      </p>
    </AuthPageShell>
  )
}
