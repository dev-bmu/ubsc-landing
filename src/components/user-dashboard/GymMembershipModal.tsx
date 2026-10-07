'use client'

import { useQuery } from '@tanstack/react-query'
import { Clock, Download, Dumbbell, X } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useEffect, useRef } from 'react'
import { MEMBERSHIP_ENABLED } from '@/config/features'
import { routes } from '@/config/routes'
import axiosInstance from '@/lib/axios'
import { cn } from '@/lib/utils'
import type { ApiSuccess, MembershipCardDto } from '@/types/contracts/contracts'
import { formatCalendarDateIntl } from '@/types/contracts/format'
import { MemberPhotoSection, PHOTO_CHECKIN_NOTE } from './MemberPhotoSection'
import { CARD_HEIGHT, CARD_WIDTH, drawMemberCard } from './memberCard'

/**
 * Kartu member (E-Card) — PRD tambahan 2026-09, tahap D. Menggantikan DUMMY_MEMBERSHIP port Laravel.
 *
 * QR meng-encode nomor member apa adanya (bukan token rahasia): pengaman sebenarnya adalah foto yang
 * dicocokkan petugas di meja check-in. Nomornya juga ditulis besar untuk diketik bila QR tidak terbaca.
 * Scanner di meja gym harus tipe 2D (imager) — scanner laser 1D tidak membaca QR maupun layar HP.
 *
 * Catatan client 2026-09-28: kartunya digambar di <canvas> (memberCard.ts) berbentuk kartu CR80 dan bisa
 * diunduh sebagai PNG — gambar yang diunduh sama persis dengan yang tampil.
 */

interface Props {
  onClose: () => void
}

const longDate = (key: string) => formatCalendarDateIntl(key, { day: 'numeric', month: 'long', year: 'numeric' })

const STATE_LABEL: Record<MembershipCardDto['state'], { label: string; cls: string }> = {
  active: { label: 'Aktif', cls: 'bg-emerald-500/15 text-emerald-300' },
  photo_required: { label: 'Foto belum disetujui', cls: 'bg-amber-500/15 text-amber-300' },
  upcoming: { label: 'Belum mulai', cls: 'bg-sky-500/15 text-sky-300' },
  pending_payment: { label: 'Menunggu pembayaran', cls: 'bg-amber-500/15 text-amber-300' },
  expired: { label: 'Tidak aktif', cls: 'bg-slate-500/15 text-slate-400' },
  none: { label: 'Tidak aktif', cls: 'bg-slate-500/15 text-slate-400' }
}

export function GymMembershipModal({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const { data, isLoading } = useQuery({
    queryKey: ['membership-card'],
    queryFn: async () => (await axiosInstance.get<ApiSuccess<MembershipCardDto>>('/customer/memberships/card')).data.data,
    retry: false
  })

  const state = data ? STATE_LABEL[data.state] : null
  const showsCard = data && (data.state === 'active' || data.state === 'photo_required' || data.state === 'upcoming')

  const cardRef = useRef<HTMLCanvasElement>(null)
  const qrRef = useRef<HTMLCanvasElement>(null)
  const membership = showsCard ? data.membership : null

  // QRCodeCanvas anak komponen ini, jadi efeknya (menggambar QR) sudah jalan sebelum efek di bawah.
  useEffect(() => {
    if (!data || !membership || !cardRef.current) return
    const upcoming = data.state === 'upcoming'
    void drawMemberCard(
      cardRef.current,
      {
        name: data.name,
        customerNumber: data.customerNumber,
        planName: membership.planName,
        validityLabel: upcoming ? 'MULAI' : 'BERLAKU S.D.',
        validityValue: longDate(upcoming ? membership.startDate : membership.endDate),
        // Foto pending tetap digambar (dengan penanda) supaya pelanggan melihat foto yang ia kirim; foto
        // ditolak tidak — itu bukan foto yang dipakai petugas.
        photoUrl: data.photoStatus === 'rejected' ? null : data.photoUrl,
        photoPending: data.photoStatus !== 'approved'
      },
      qrRef.current
    )
  }, [data, membership])

  const download = () => {
    cardRef.current?.toBlob((blob) => {
      if (!blob || !data) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `kartu-member-${data.customerNumber}.png`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }

  return (
    <div data-lenis-prevent className="fixed inset-0 z-200 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0d1422] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
              <Dumbbell className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="font-bdo text-[10px] font-bold tracking-[0.18em] text-emerald-400 uppercase">Keanggotaan</p>
              <h2 className="font-clash text-[16px] font-semibold text-white">Membership Gym</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/30 transition-all hover:bg-white/6 hover:text-white/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
          {isLoading && <p className="py-8 text-center font-bdo text-sm text-white/40">Memuat kartu…</p>}

          {data && state && (
            <>
              <div className="mb-5 flex items-center justify-between">
                <p className="font-bdo text-[12px] text-white/50">Status Keanggotaan</p>
                <span className={cn('rounded-full px-3 py-1 font-bdo text-[11px] font-medium', state.cls)}>{state.label}</span>
              </div>

              {showsCard && membership ? (
                <>
                  <canvas
                    ref={cardRef}
                    width={CARD_WIDTH}
                    height={CARD_HEIGHT}
                    role="img"
                    aria-label={`Kartu member ${data.name}, nomor ${data.customerNumber}, paket ${membership.planName}`}
                    className="h-auto w-full rounded-2xl shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)]"
                  />
                  <QRCodeCanvas ref={qrRef} value={data.customerNumber} size={256} level="M" marginSize={0} className="hidden" />

                  <button
                    type="button"
                    onClick={download}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 font-bdo text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    <Download className="h-4 w-4" />
                    Unduh Kartu (PNG)
                  </button>
                  <p className="mt-2 text-center font-bdo text-[11px] text-white/45">
                    Tunjukkan kartu (layar HP atau hasil unduhan) ke petugas saat masuk gym.
                  </p>

                  {data.daysRemaining !== null && (
                    <p className="mt-4 flex items-center gap-2 font-bdo text-[13px] text-white/60">
                      <Clock className="h-4 w-4 text-emerald-400" />
                      {data.daysRemaining} hari tersisa
                    </p>
                  )}
                  {/* Check-in gym menolak member yang fotonya belum disetujui (ubsc-api gym-services evaluate). */}
                  {data.photoStatus === 'pending' && data.photoUrl && (
                    <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 font-bdo text-[12px] leading-relaxed text-amber-200">
                      Foto menunggu verifikasi staff. {PHOTO_CHECKIN_NOTE}
                    </p>
                  )}
                  {(data.photoStatus === 'rejected' || !data.photoUrl) && (
                    <div className="mt-5 space-y-3 border-t border-white/[0.07] pt-5">
                      <p className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 font-bdo text-[12px] leading-relaxed text-rose-200">
                        {data.photoStatus === 'rejected'
                          ? 'Foto Anda ditolak staff. Unggah foto wajah baru yang jelas di bawah ini — kartu bisa dipakai check-in setelah foto disetujui.'
                          : 'Anda belum mengunggah foto wajah. Unggah di bawah ini — kartu bisa dipakai check-in setelah foto disetujui staff.'}
                      </p>
                      <MemberPhotoSection url={null} status={null} />
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-8 text-center">
                  <Dumbbell className="mx-auto mb-3 h-8 w-8 text-white/15" />
                  {data.state === 'pending_payment' && data.membership ? (
                    <>
                      <p className="font-bdo text-sm text-white/60">Pembelian {data.membership.planName} menunggu pembayaran.</p>
                      <a
                        href={routes.membershipPayment(data.membership.id)}
                        className="mt-4 inline-block rounded-full bg-orange-500 px-5 py-2 font-bdo text-xs font-bold text-white hover:opacity-90"
                      >
                        Lanjutkan Pembayaran
                      </a>
                    </>
                  ) : (
                    <>
                      <p className="font-bdo text-sm text-white/40">
                        {data.state === 'expired' ? 'Membership Anda sudah tidak aktif.' : 'Anda belum memiliki membership gym aktif.'}
                      </p>
                      <p className="mt-1 font-mono text-[12px] text-white/40">Nomor member: {data.customerNumber}</p>
                      {MEMBERSHIP_ENABLED && (
                        <a
                          href={routes.pricing()}
                          className="mt-4 inline-block rounded-full bg-orange-500 px-5 py-2 font-bdo text-xs font-bold text-white hover:opacity-90"
                        >
                          Lihat Paket Membership
                        </a>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
