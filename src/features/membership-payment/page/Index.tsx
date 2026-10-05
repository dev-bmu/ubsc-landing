'use client'

import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { Banner, ProofUploadForm, TransferInstructions, useCountdown } from '@/components/payment/TransferParts'
import { authModal, routes } from '@/config/routes'
import { useAuth } from '@/context/AuthContext'
import axiosInstance from '@/lib/axios'
import type { ApiSuccess, MembershipPaymentDetailDto } from '@/types/contracts/contracts'
import { formatCalendarDateIntl } from '@/types/contracts/format'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// ===== /membership/{id}/pembayaran — transfer membership yang dibeli lewat web (tahap C) =====
// Kembaran halaman bayar booking: instruksi transfer, countdown hold, dan unggah bukti memakai
// komponen yang sama (components/payment/TransferParts). Setelah staff menyetujui, membership aktif
// dan masa aktifnya dihitung dari hari verifikasi.

const longDate = (key: string) => formatCalendarDateIntl(key, { day: 'numeric', month: 'long', year: 'numeric' })

export function MembershipPaymentPage({ membershipId }: { membershipId: string }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isLoading && !user) router.replace(authModal('login'))
  }, [isLoading, user, router])

  const queryKey = ['customer-membership-payment', membershipId]
  const { data } = useQuery({
    queryKey,
    queryFn: async () =>
      (await axiosInstance.get<ApiSuccess<MembershipPaymentDetailDto>>(`/customer/memberships/${membershipId}/pembayaran`)).data.data,
    enabled: !!user,
    retry: false
  })

  const secondsLeft = useCountdown(data?.membership.holdExpiresAt ?? null)
  const expired = secondsLeft !== null && secondsLeft <= 0
  const mmss = secondsLeft === null ? null : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-[#0B0E12]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24 sm:px-10">
        {data && (
          <>
            <p className="font-bdo text-xs font-semibold tracking-[0.2em] text-accent-red uppercase">{data.payment.receiptNumber}</p>
            <h1 className="mt-2 font-bdo text-3xl font-semibold text-white sm:text-4xl">Pembayaran Membership</h1>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6">
              <p className="font-bdo text-lg font-semibold text-white">{data.membership.planName}</p>
              <p className="mt-1 font-bdo text-sm text-neutral-300">
                {data.membership.status === 'active' || data.membership.status === 'expired'
                  ? `${longDate(data.membership.startDate)} – ${longDate(data.membership.endDate)}`
                  : 'Masa aktif dimulai saat pembayaran diverifikasi admin.'}
              </p>
            </div>

            {data.payment.paymentStatus === 'PAID' && (
              <Banner tone="ok" icon={<CheckCircle2 className="h-5 w-5" />}>
                Pembayaran terkonfirmasi. Membership Anda aktif {longDate(data.membership.startDate)} – {longDate(data.membership.endDate)}.
              </Banner>
            )}

            {data.payment.paymentStatus === 'EXPIRED' && (
              <Banner tone="bad" icon={<AlertCircle className="h-5 w-5" />}>
                Batas waktu transfer terlewat dan pendaftaran dibatalkan.{' '}
                <a href={routes.pricing()} className="font-semibold underline underline-offset-4">
                  Daftar ulang
                </a>
              </Banner>
            )}

            {data.payment.verificationStatus === 'awaiting' && (
              <Banner tone="info" icon={<Clock className="h-5 w-5" />}>
                Bukti pembayaran sedang diperiksa admin. Tidak perlu bayar ulang — membership aktif begitu pembayarannya disetujui.
              </Banner>
            )}

            {data.payment.verificationStatus === 'rejected' && (
              <Banner tone="bad" icon={<AlertCircle className="h-5 w-5" />}>
                <span className="block font-semibold">Bukti ditolak</span>
                <span className="block text-white/70">{data.payment.rejectionReason}</span>
                <span className="mt-1 block text-white/70">
                  Pendaftaran dibatalkan. Silakan daftar ulang, atau hubungi admin bila dana sudah terkirim.
                </span>
                <a
                  href={routes.pricing()}
                  className="mt-3 inline-block rounded-full bg-accent-red px-5 py-2 font-bdo text-xs font-bold text-white hover:opacity-90"
                >
                  Daftar Ulang
                </a>
              </Banner>
            )}

            {data.payment.paymentStatus === 'UNPAID' && !data.payment.hasProof && mmss && (
              <Banner tone={expired ? 'bad' : 'warn'} icon={<Clock className="h-5 w-5" />}>
                {expired ? (
                  <>Waktu habis. Muat ulang halaman untuk melihat status terbaru.</>
                ) : (
                  <>
                    Selesaikan transfer dalam <span className="font-bold tabular-nums">{mmss}</span>. Setelah itu pendaftaran dibatalkan otomatis.
                  </>
                )}
              </Banner>
            )}

            {data.payment.paymentStatus === 'UNPAID' && <TransferInstructions bank={data.bank} qris={data.qris} payment={data.payment} />}

            {data.payment.canUpload && (
              <ProofUploadForm<MembershipPaymentDetailDto>
                endpoint={`/customer/memberships/${membershipId}/pembayaran/bukti`}
                onUploaded={(fresh) => queryClient.setQueryData(queryKey, fresh)}
              />
            )}

            <button
              type="button"
              onClick={() => router.push(routes.home())}
              className="mt-6 font-bdo text-sm text-neutral-400 underline-offset-4 hover:text-white hover:underline"
            >
              Kembali ke beranda
            </button>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
