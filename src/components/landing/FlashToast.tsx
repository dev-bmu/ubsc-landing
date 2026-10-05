'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Sumber flash: di Laravel (HomePage.tsx) dibaca dari usePage().props.flash (success/error) yang
// diisi server lewat session. Di landing Next.js ini tidak ada flash server-side, jadi sumbernya
// dibaca dari query string `?flash=<code>` saat mount — client-only via window.location.search
// (BUKAN useSearchParams, agar tidak memaksa Suspense boundary / kopling ke next/navigation).
// Dibaca di useEffect supaya tidak terjadi mismatch hidrasi (window hanya ada di klien).
//
// Peta kode -> pesan sengaja dibiarkan kosong sampai ada sumber flash nyata: tanpa entri yang cocok
// komponen tidak menampilkan toast (return null). Strukturnya sudah siap — cukup isi FLASH_MESSAGES
// begitu kode flash betulan didefinisikan (mis. dari redirect setelah booking/login).
type FlashMessage = { message: string; isError?: boolean }

const FLASH_MESSAGES: Record<string, FlashMessage> = {
  // Contoh bentuk (nonaktif sampai sumber flash nyata ada):
  // 'login-success': { message: 'Berhasil masuk.' },
  // 'booking-failed': { message: 'Pemesanan gagal, silakan coba lagi.', isError: true },
}

export function FlashToast() {
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('flash')
    if (!code) return
    const matched = FLASH_MESSAGES[code]
    if (!matched) return
    setMessage(matched.message)
    setIsError(!!matched.isError)
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(t)
  }, [])

  if (!visible || !message) return null

  return (
    <div
      className={cn(
        'animate-fade-in-up fixed bottom-6 left-1/2 z-500 flex -translate-x-1/2 items-center gap-3 rounded-2xl border bg-[#0d1422] px-5 py-3.5 shadow-2xl shadow-black/40',
        isError ? 'border-rose-500/25' : 'border-emerald-500/25'
      )}
    >
      {isError ? <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" /> : <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />}
      <p className="font-bdo text-sm font-medium text-white">{message}</p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/6 hover:text-white/70"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
