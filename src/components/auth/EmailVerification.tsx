'use client'

import { MailWarning, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import axiosInstance from '@/lib/axios'
import { cn } from '@/lib/utils'
import type { ApiSuccess, ResendVerificationDto } from '@/types/contracts/contracts'

/**
 * Penanda email belum terverifikasi + kirim ulang (catatan client 2026-09-28). Endpoint-nya membatasi
 * per akun (jeda 60 detik, maks 5 per hari) dan membalas sisa waktu tunggu, jadi tombol di sini
 * menampilkan hitung mundur yang sama dengan yang ditegakkan server — tidak ada batas versi klien.
 */

type SendState = 'idle' | 'sending' | 'sent' | 'error'

export function useResendVerification() {
  const [state, setState] = useState<SendState>('idle')
  const [retryAfter, setRetryAfter] = useState(0)

  useEffect(() => {
    if (retryAfter <= 0) return
    const timer = setTimeout(() => setRetryAfter((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [retryAfter])

  const send = async () => {
    setState('sending')
    try {
      const { data } = await axiosInstance.post<ApiSuccess<ResendVerificationDto>>('/customer/profile/resend-verification')
      // Sudah terverifikasi di tab lain: muat ulang supaya sesi membawa status terbaru.
      if (data.data.alreadyVerified) return window.location.reload()
      setRetryAfter(data.data.retryAfterSeconds)
      setState(data.data.sent ? 'sent' : 'idle')
    } catch {
      setState('error')
    }
  }

  return { state, retryAfter, send }
}

function waitLabel(seconds: number): string {
  return seconds >= 3600 ? `${Math.ceil(seconds / 3600)} jam` : seconds >= 60 ? `${Math.ceil(seconds / 60)} menit` : `${seconds} detik`
}

export function ResendVerificationButton({ className }: { className?: string }) {
  const { state, retryAfter, send } = useResendVerification()
  const waiting = retryAfter > 0

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-2 gap-y-1', className)}>
      <button
        type="button"
        onClick={send}
        disabled={state === 'sending' || waiting}
        className="font-semibold underline underline-offset-2 hover:opacity-80 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
      >
        {state === 'sending' ? 'Mengirim…' : waiting ? `Kirim ulang dalam ${waitLabel(retryAfter)}` : 'Kirim ulang email verifikasi'}
      </button>
      {state === 'sent' && <span>Terkirim — cek inbox atau folder spam.</span>}
      {state === 'error' && <span>Gagal mengirim, coba lagi sebentar lagi.</span>}
    </span>
  )
}

const DISMISS_KEY = 'ubsc-verify-banner-hidden'

/** Pengingat kecil di bawah layar untuk pelanggan yang belum memverifikasi email. Bisa disembunyikan per sesi. */
export function UnverifiedEmailBanner() {
  const { user } = useAuth()
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    try {
      setHidden(sessionStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      setHidden(false)
    }
  }, [])

  // undefined = sesi lama tanpa field ini; hanya null yang berarti belum terverifikasi.
  if (!user || user.role || user.emailVerifiedAt !== null || hidden) return null

  const dismiss = () => {
    setHidden(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {}
  }

  return (
    <div role="status" className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex max-w-xl items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 font-bdo text-[13px] text-amber-900 shadow-lg">
        <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0">
          <p>
            Email <strong className="break-all">{user.email}</strong> belum diverifikasi. Pembayaran dan pembelian membership butuh email
            terverifikasi.
          </p>
          <ResendVerificationButton className="mt-1" />
        </div>
        <button type="button" onClick={dismiss} aria-label="Sembunyikan pengingat" className="shrink-0 text-amber-700/60 hover:text-amber-900">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
