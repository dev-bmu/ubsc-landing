'use client'

import { extractApiError } from '@/lib/applyApiErrors'
import axiosInstance from '@/lib/axios'
import type { ApiSuccess, PaymentBankDto, PaymentQrisDto, TransferPaymentDto } from '@/types/contracts/contracts'
import { useMutation } from '@tanstack/react-query'
import { Copy, Download, Info, Upload } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react'

// ===== Bagian halaman bayar transfer manual =====
// Dipakai halaman bayar booking (/booking/{id}/pembayaran) dan membership (/membership/{id}/pembayaran)
// supaya instruksi transfer, countdown, dan unggah bukti tidak pernah berbeda di antara keduanya.

/**
 * Must stay in step with the proof-upload endpoint's own limit, which has to sit ABOVE this
 * number. When the server is the lower of the two it silently discards the file and the rules
 * below never run.
 */
const PROOF_MAX_BYTES = 10 * 1024 * 1024
const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

/**
 * mm:ss left on the hold, or null when there is no clock running.
 *
 * Nilai awalnya null dan Date.now() TIDAK PERNAH dibaca saat render — hanya di dalam useEffect.
 * Itulah yang membuat render pertama di server dan di klien sama persis (tidak ada hydration
 * mismatch): banner countdown baru muncul setelah tick pertama di browser.
 */
export function useCountdown(iso: string | null) {
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!iso) {
      setLeft(null)
      return
    }

    const target = new Date(iso).getTime()
    const tick = () => setLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)))

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [iso])

  return left
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>(0)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard is blocked in some embedded browsers; the number is
      // on screen either way.
    }
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Salin ${label}`}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white/6 px-2.5 py-1.5 font-bdo text-[11px] font-semibold text-white/70 transition hover:bg-white/12 hover:text-white"
    >
      <Copy className="h-3 w-3" />
      {copied ? 'Tersalin' : 'Salin'}
    </button>
  )
}

export function Banner({ tone, icon, children }: { tone: 'ok' | 'warn' | 'bad' | 'info'; icon: ReactNode; children: ReactNode }) {
  const toneClass = {
    ok: 'border-emerald-400/30 bg-emerald-400/8 text-emerald-200',
    warn: 'border-amber-400/30 bg-amber-400/8 text-amber-200',
    bad: 'border-rose-500/30 bg-rose-500/8 text-rose-200',
    info: 'border-sky-400/30 bg-sky-400/8 text-sky-200'
  }[tone]

  return (
    <div className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 font-bdo text-sm ${toneClass}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>{children}</div>
    </div>
  )
}

/**
 * Atribut `download` diabaikan browser untuk URL beda domain (gambar QRIS di CDN R2), jadi gambarnya
 * diambil sebagai blob dulu. Gagal (mis. CDN tanpa header CORS): buka gambarnya di tab baru.
 */
async function downloadQris(event: MouseEvent<HTMLAnchorElement>, url: string): Promise<void> {
  event.preventDefault()
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(String(res.status))
    const href = URL.createObjectURL(await res.blob())
    const link = document.createElement('a')
    link.href = href
    link.download = 'qris-ub-sport-center.png'
    link.click()
    setTimeout(() => URL.revokeObjectURL(href), 1000)
  } catch {
    window.open(url, '_blank', 'noopener')
  }
}

/**
 * Cara bayar + nominal yang harus dibayar persis. QRIS statis merchant (keputusan client 2026-10-01)
 * bila admin sudah mengunggahnya: pelanggan memindai lalu MENGETIK nominal sendiri. Rekening bank
 * hanya cadangan saat QRIS belum ada.
 */
export function TransferInstructions({ bank, qris, payment }: { bank: PaymentBankDto; qris: PaymentQrisDto | null; payment: TransferPaymentDto }) {
  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6">
      {qris ? (
        <>
          <h2 className="font-bdo text-sm font-bold tracking-wider text-white/50 uppercase">Bayar dengan QRIS</h2>
          <div className="mt-4 flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- gambar QRIS dari /uploads; harus tampil apa adanya agar tetap terbaca */}
            <img
              src={qris.imageUrl}
              alt={`QRIS ${qris.merchantName ?? 'UB Sport Center'}`}
              className="w-full max-w-[280px] rounded-xl bg-white p-3"
            />
            {qris.merchantName && <p className="font-bdo text-sm text-neutral-400">a.n. {qris.merchantName}</p>}
            <a
              href={qris.imageUrl}
              download="qris-ub-sport-center.png"
              onClick={(event) => void downloadQris(event, qris.imageUrl)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/8 px-3 py-1.5 font-bdo text-xs font-semibold text-white/80 transition hover:bg-white/15"
            >
              <Download className="h-3.5 w-3.5" />
              Unduh QRIS
            </a>
          </div>
          <ol className="mt-5 list-decimal space-y-1 pl-5 font-bdo text-xs leading-relaxed text-white/60">
            <li>Buka aplikasi m-banking atau e-wallet, pilih Scan QRIS. Membayar dari HP ini? Unduh QRIS lalu pilih dari galeri.</li>
            <li>Ketik nominal persis seperti di bawah, termasuk 3 digit terakhirnya.</li>
            <li>Setelah berhasil, unggah tangkapan layar bukti pembayaran.</li>
          </ol>
        </>
      ) : (
        <>
          <h2 className="font-bdo text-sm font-bold tracking-wider text-white/50 uppercase">Transfer ke</h2>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bdo text-2xl font-bold tracking-wide text-white">{bank.accountNumber}</p>
              <p className="mt-1 font-bdo text-sm text-neutral-400">
                {bank.bank} · a.n. {bank.accountHolder}
              </p>
            </div>
            <CopyButton value={bank.accountNumber} label="nomor rekening" />
          </div>
        </>
      )}

      <div className="mt-6 rounded-xl border border-accent-red/30 bg-accent-red/[0.07] p-4">
        <p className="font-bdo text-xs font-semibold tracking-wider text-white/60 uppercase">
          {qris ? 'Nominal bayar — ketik persis' : 'Nominal transfer — harus persis'}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="font-bdo text-3xl font-bold text-white tabular-nums">{rupiah(payment.total)}</p>
          <CopyButton value={String(payment.total)} label="nominal bayar" />
        </div>
        <p className="mt-3 flex items-start gap-2 font-bdo text-xs leading-relaxed text-white/60">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Harga {rupiah(payment.amount)}
            {payment.adminFee > 0 && <> + biaya admin {rupiah(payment.adminFee)}</>} + kode unik{' '}
            <span className="font-bold text-white">{rupiah(payment.uniqueCode)}</span> ={' '}
            <span className="font-bold text-white">{rupiah(payment.total)}</span>. Kode unik yang membuat pembayaran Anda bisa dikenali admin, jadi
            jangan dibulatkan.
          </span>
        </p>
      </div>
    </section>
  )
}

/**
 * Unggah bukti transfer ke `endpoint` (multipart, field `proof`). Balasan endpoint — keadaan halaman
 * terbaru — diteruskan ke onUploaded supaya pemanggil menulisnya ke cache query-nya sendiri.
 */
export function ProofUploadForm<T>({ endpoint, onUploaded }: { endpoint: string; onUploaded: (fresh: T) => void }) {
  const [proof, setProof] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  // Rejections the browser can make without a round trip. Without this the
  // only feedback for an oversized file was whatever survived the server
  // dropping it, which is a generic "failed to upload" with no size in it.
  const [localError, setLocalError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ percentage: number } | null>(null)

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData()
      body.append('proof', file)

      const res = await axiosInstance.post<ApiSuccess<T>>(endpoint, body, {
        onUploadProgress: (event) => setProgress({ percentage: event.total ? Math.round((event.loaded * 100) / event.total) : 0 })
      })
      return res.data.data
    },
    onSuccess: (fresh) => {
      onUploaded(fresh)
      setProof(null)
      setPreview(null)
      setProgress(null)
    },
    onError: (error) => {
      const { message, fieldErrors } = extractApiError(error, 'Bukti pembayaran gagal diunggah. Coba lagi.')
      setProgress(null)
      setServerError(fieldErrors.proof ?? message)
    }
  })

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview]
  )

  const pickFile = (file: File | null) => {
    setLocalError(null)

    if (file) {
      if (!PROOF_TYPES.includes(file.type)) {
        setLocalError('Format tidak didukung. Gunakan JPG, PNG, atau WEBP.')
        return
      }
      if (file.size > PROOF_MAX_BYTES) {
        const mb = (file.size / 1048576).toFixed(1)
        setLocalError(`Ukuran gambar ${mb} MB melebihi batas 10 MB. Kompres dulu lalu unggah lagi.`)
        return
      }
    }

    setProof(file)
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old)
      return file ? URL.createObjectURL(file) : null
    })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setServerError(null)
    if (!proof) return
    upload.mutate(proof)
  }

  const processing = upload.isPending

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6">
      <h2 className="font-bdo text-sm font-bold tracking-wider text-white/50 uppercase">Unggah bukti pembayaran</h2>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/2 px-4 py-10 text-center transition hover:border-white/35 hover:bg-white/5">
        <Upload className="h-6 w-6 text-white/40" />
        <span className="font-bdo text-sm text-white/70">Pilih gambar bukti pembayaran</span>
        <span className="font-bdo text-xs text-white/40">JPG, PNG, atau WEBP · maksimal 10 MB</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            pickFile(e.target.files?.[0] ?? null)
            // Let the same file be re-picked after a
            // rejection; without this the input keeps
            // the old value and fires no change event.
            e.target.value = ''
          }}
        />
      </label>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- pratinjau berkas lokal (blob object URL), bukan aset yang bisa dioptimalkan next/image
        <img src={preview} alt="Pratinjau bukti pembayaran" className="mt-4 max-h-72 w-auto rounded-xl border border-white/10" />
      )}

      {(localError ?? serverError) && <p className="mt-3 font-bdo text-sm text-rose-400">{localError ?? serverError}</p>}

      {progress && (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-accent-red transition-[width]" style={{ width: `${progress.percentage ?? 0}%` }} />
        </div>
      )}

      <button
        type="submit"
        disabled={processing || !preview}
        className="mt-5 w-full rounded-full bg-accent-red px-6 py-3 font-bdo text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {processing ? 'Mengirim…' : 'Kirim Bukti Pembayaran'}
      </button>
    </form>
  )
}
