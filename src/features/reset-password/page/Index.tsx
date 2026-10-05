'use client'

import { Eye, EyeOff } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { AuthNotice, AuthPageShell, authButtonCls, authInputCls, authLabelCls } from '@/components/auth/AuthPageShell'
import { AUTH_ENDPOINTS } from '@/config/api'
import { authModal, routes } from '@/config/routes'
import { extractApiError } from '@/lib/applyApiErrors'
import axiosInstance from '@/lib/axios'

// ===== /reset-password?token= — tautan dari email lupa password =====
// URL-nya dibangun ubsc-api (resetUrl di registration-services.ts). Berhasil = semua sesi lama dicabut
// server, jadi pelanggan diarahkan masuk ulang dengan password baru.

export function ResetPasswordPage({ token }: { token: string | null }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  if (!token) {
    return (
      <AuthPageShell title="Tautan tidak lengkap">
        <AuthNotice tone="bad">Buka tautan dari email reset password terbaru Anda, atau minta tautan baru.</AuthNotice>
        <a href={routes.forgotPassword()} className={`${authButtonCls} mt-5`}>
          Minta tautan baru
        </a>
      </AuthPageShell>
    )
  }

  if (done) {
    return (
      <AuthPageShell title="Password diperbarui">
        <AuthNotice tone="ok">Silakan masuk dengan password baru. Semua sesi lama sudah dikeluarkan demi keamanan.</AuthNotice>
        <a href={authModal('login')} className={`${authButtonCls} mt-5`}>
          Masuk
        </a>
      </AuthPageShell>
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setErrors({})
    setFailure(null)
    if (password !== confirmation) {
      setErrors({ passwordConfirmation: 'Konfirmasi password tidak sama.' })
      return
    }
    setPending(true)
    try {
      await axiosInstance.post(AUTH_ENDPOINTS.resetPassword, { token, password, passwordConfirmation: confirmation })
      setDone(true)
    } catch (err) {
      const { message, fieldErrors } = extractApiError(err, 'Gagal memperbarui password. Coba lagi.')
      // Token tidak valid/kedaluwarsa bukan salah isian — tampilkan sebagai kegagalan tautan.
      if (fieldErrors.token || Object.keys(fieldErrors).length === 0) setFailure(fieldErrors.token ?? message)
      else setErrors(fieldErrors)
    } finally {
      setPending(false)
    }
  }

  const type = show ? 'text' : 'password'

  return (
    <AuthPageShell title="Buat password baru" description="Minimal 8 karakter. Setelah disimpan, masuk kembali dengan password ini.">
      {failure && (
        <AuthNotice tone="bad">
          {failure}{' '}
          <a href={routes.forgotPassword()} className="font-semibold underline underline-offset-2">
            Minta tautan baru
          </a>
        </AuthNotice>
      )}

      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="reset_password" className={authLabelCls}>
            Password baru
          </label>
          <div className="relative">
            <input
              id="reset_password"
              type={type}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${authInputCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 font-bdo text-xs text-rose-600">{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="reset_confirmation" className={authLabelCls}>
            Ulangi password baru
          </label>
          <input
            id="reset_confirmation"
            type={type}
            required
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className={authInputCls}
          />
          {errors.passwordConfirmation && <p className="mt-1.5 font-bdo text-xs text-rose-600">{errors.passwordConfirmation}</p>}
        </div>
        <button type="submit" disabled={pending} className={authButtonCls}>
          {pending ? 'Menyimpan…' : 'Simpan password baru'}
        </button>
      </form>
    </AuthPageShell>
  )
}
