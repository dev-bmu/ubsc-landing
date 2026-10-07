'use client'

import { useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Camera, Clock, FileUp, XCircle, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type ChangeEvent } from 'react'
import { extractApiError } from '@/lib/applyApiErrors'
import axiosInstance from '@/lib/axios'
import { cn } from '@/lib/utils'
import type { MemberPhotoStatus } from '@/types/contracts/contracts'

/** Check-in tidak perlu menunggu antrean: petugas bisa menyetujui foto di meja gym (ubsc-api gym-services). */
export const PHOTO_CHECKIN_NOTE = 'Bila belum disetujui saat Anda datang, petugas mencocokkan wajah Anda lalu menyetujuinya di meja gym.'

/**
 * Foto wajah untuk validasi saat masuk gym — BUKAN avatar. Berlaku setelah disetujui staff; mengunggah
 * ulang selalu kembali ke antrean tinjauan (PRD tambahan 2026-09, tahap B). Dipakai modal profil dan
 * halaman checkout membership, dan modal kartu member (foto belum ada / ditolak).
 */
export function MemberPhotoSection({
  url,
  status,
  onUploaded,
  compact = false
}: {
  url: string | null
  status: MemberPhotoStatus | null
  onUploaded?: () => void
  /** Tanpa judul + penjelasan sendiri — pemanggil (langkah checkout) sudah menuliskannya. */
  compact?: boolean
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const choose = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null
    setFile(picked)
    setError(null)
    setSuccess(false)
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return picked ? URL.createObjectURL(picked) : null
    })
  }

  const upload = async () => {
    if (!file) return
    setSubmitting(true)
    setError(null)
    const formData = new FormData()
    formData.append('photo', file)
    try {
      await axiosInstance.post('/customer/member-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSuccess(true)
      // Pratinjau lokal dibiarkan: itu gambar yang sama, dan mencegah kotak foto kosong selama data dimuat ulang.
      setFile(null)
      // Semua tampilan yang membaca foto/status ini (kartu, profil, checkout) — jangan tampilkan cache lama.
      for (const queryKey of [['membership-card'], ['customer-profile'], ['membership-checkout']]) void queryClient.invalidateQueries({ queryKey })
      onUploaded?.()
    } catch (err) {
      const { message, fieldErrors } = extractApiError(err, 'Gagal mengunggah foto. Silakan coba lagi.')
      setError(fieldErrors.photo ?? message)
    } finally {
      setSubmitting(false)
    }
  }

  const badge = (
    {
      approved: {
        icon: BadgeCheck,
        cls: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
        label: 'Disetujui — foto dipakai saat masuk gym'
      },
      pending: {
        icon: Clock,
        cls: 'border-sky-400/25 bg-sky-400/10 text-sky-300',
        label: `Menunggu verifikasi staff. ${PHOTO_CHECKIN_NOTE}`
      },
      rejected: { icon: XCircle, cls: 'border-rose-400/25 bg-rose-400/10 text-rose-300', label: 'Ditolak — unggah foto wajah yang jelas' }
    } as Record<MemberPhotoStatus, { icon: LucideIcon; cls: string; label: string }>
  )[status ?? 'pending']
  const BadgeIcon = badge.icon
  const shown = preview ?? url

  return (
    <div className="space-y-4">
      <div className={compact ? 'hidden' : undefined}>
        <p className="font-bdo text-[10px] font-medium tracking-[0.18em] text-white/40 uppercase">Foto Member</p>
        <p className="mt-1 font-bdo text-[12px] leading-relaxed text-white/50">
          Foto wajah terbaru, tanpa masker atau kacamata hitam. Petugas mencocokkannya dengan Anda saat masuk gym.
        </p>
      </div>

      {status && (
        <div className={cn('flex items-start gap-2 rounded-xl border px-3 py-2 font-bdo text-[12px] leading-relaxed', badge.cls)}>
          <BadgeIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {badge.label}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white/4 ring-1 ring-white/10">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- foto unggahan pelanggan (/uploads atau object URL), bukan aset statis
            <img src={shown} alt="Foto member" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Camera className="h-6 w-6 text-white/25" />
            </div>
          )}
        </div>
        <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/2 px-4 py-3 transition hover:border-orange-500/40">
          <FileUp className="h-4 w-4 text-white/40" />
          <span className="font-bdo text-[12px] text-white/60">
            {file ? file.name : url ? 'Ganti foto (JPG, PNG · maks 10 MB)' : 'Pilih foto (JPG, PNG · maks 10 MB)'}
          </span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={choose} />
        </label>
      </div>

      {error && <p className="font-bdo text-[12px] text-rose-400">{error}</p>}
      {success && <p className="font-bdo text-[12px] text-emerald-400">Foto terkirim dan menunggu verifikasi staff.</p>}

      <button
        type="button"
        onClick={upload}
        disabled={submitting || !file}
        className="w-full rounded-xl bg-orange-500 py-2.5 font-clash text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? 'Mengunggah...' : 'Kirim Foto'}
      </button>
    </div>
  )
}
