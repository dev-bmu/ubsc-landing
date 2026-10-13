'use client'

import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { authModal, routes } from '@/config/routes'
import { useAuth } from '@/context/AuthContext'
import { showsQr, TicketList, type TicketSession } from '@/components/payment/TicketList'
import { Banner, paymentTitle, ProofUploadForm, TransferInstructions, useCountdown } from '@/components/payment/TransferParts'
import axiosInstance from '@/lib/axios'
import { todayStr } from '@/lib/calendar'
import type { ApiSuccess, PaymentDetailDto, PaymentRedirectDto } from '@/types/contracts/contracts'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// ===== /booking/{booking}/pembayaran (client penuh) =====
// Padanan Pages/Bookings/Payment.tsx Laravel. Di Laravel seluruh prop (booking, payment, bank,
// ticket, sessions) datang dari PaymentController::show lewat Inertia; di sini isinya milik-sendiri
// pengguna DAN peka waktu (countdown hold), jadi tidak ada fetch RSC sama sekali — route shell
// src/app/booking/[id]/pembayaran/page.tsx sengaja tanpa `revalidate` dan hanya meneruskan bookingId.
//
// Rename snake -> camel mengikuti PaymentDetailDto: facility_name -> facilityName,
// unit_name -> unitName, start_time/end_time -> startTime/endTime, hold_expires_at -> holdExpiresAt,
// receipt_number -> receiptNumber, unique_code -> uniqueCode, payment_status -> paymentStatus,
// verification_status -> verificationStatus, rejection_reason -> rejectionReason,
// has_proof -> hasProof, can_upload -> canUpload, account_number -> accountNumber,
// account_holder -> accountHolder, check_in_url -> checkInUrl, checked_in_at -> checkedInAt.
//
// Inertia useForm -> ProofUploadForm (components/payment/TransferParts, dipakai juga halaman bayar
// membership). POST bukti membalas PaymentDetailDto terbaru, jadi hasilnya ditulis langsung ke cache
// query — padanan Inertia yang me-render ulang halaman dengan prop baru.
//
// <Head title="Pembayaran"> dihapus: metadata sudah ada di route shell.

export function BookingPaymentPage({ bookingId }: { bookingId: string }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Laravel menjaga route ini dengan middleware ['auth', 'verified'] (routes/web.php). Penjaga
  // utama di Next adalah src/middleware.ts (cookie ubsc_c_role); ini cerminan sisi klien untuk
  // sesi yang sudah kedaluwarsa padahal cookie penandanya masih ada.
  useEffect(() => {
    if (!isLoading && !user) router.replace(authModal('login'))
  }, [isLoading, user, router])

  const { data: detail } = useQuery({
    queryKey: ['customer-booking-payment', bookingId],
    queryFn: async () => {
      const res = await axiosInstance.get<ApiSuccess<PaymentDetailDto | PaymentRedirectDto>>(`/customer/booking/${bookingId}/pembayaran`)
      return res.data.data
    },
    enabled: !!user,
    retry: false
  })

  // Hanya booking lead yang memegang transfer. Bila id yang dibuka adalah ANGGOTA paket, API
  // membalas { redirectToBookingId } dan klien pindah ke URL lead (padanan redirect Laravel
  // PublicBookingController:556).
  const redirectToBookingId = detail && 'redirectToBookingId' in detail ? detail.redirectToBookingId : null
  const data = detail && !('redirectToBookingId' in detail) ? detail : undefined

  useEffect(() => {
    if (redirectToBookingId) router.replace(routes.bookingPayment(redirectToBookingId))
  }, [redirectToBookingId, router])

  const secondsLeft = useCountdown(data && data.payment.paymentStatus === 'UNPAID' && !data.payment.hasProof ? data.booking.holdExpiresAt : null)

  const expired = secondsLeft !== null && secondsLeft <= 0
  const mmss = secondsLeft === null ? null : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`

  // Booking tunggal dibentuk seperti satu sesi paket supaya keduanya memakai kartu tiket yang sama.
  const tickets: TicketSession[] = data
    ? (data.sessions ?? [
        {
          id: data.booking.id,
          dateKey: data.booking.date,
          time: `${data.booking.startTime} – ${data.booking.endTime}`,
          unitName: data.booking.unitName,
          status: data.booking.status,
          checkedInAt: data.ticket?.checkedInAt ?? null,
          checkInUrl: data.ticket?.checkInUrl || null
        }
      ])
    : []
  const allCancelled = tickets.length > 0 && tickets.every((s) => s.status === 'cancelled')
  // Banner "Tunjukkan QR di bawah" hanya bila memang ada QR di bawah (sesi hari ini / akan datang).
  const anyQr = tickets.some((s) => showsQr(s, todayStr()))
  // Admin bisa memindah satu sesi paket ke unit lain: unit lalu ditulis per kartu, bukan di judul.
  const mixedUnits = new Set(tickets.map((s) => s.unitName ?? null)).size > 1
  const title = data ? paymentTitle(data.payment, { paid: 'Reservasi Terkonfirmasi', cancelled: 'Reservasi Dibatalkan' }, allCancelled, expired) : ''

  return (
    <div className="min-h-screen bg-[#0B0E12]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24 sm:px-10">
        {data && (
          <>
            <p className="font-bdo text-xs font-semibold tracking-[0.2em] text-accent-red uppercase">Kode booking · {data.payment.receiptNumber}</p>
            <h1 className="mt-2 font-bdo text-3xl font-semibold text-white sm:text-4xl">{title}</h1>

            {/* ── State banners ───────────────────────────────────────── */}
            {data.payment.paymentStatus === 'PAID' && !allCancelled && (
              <Banner tone="ok" icon={<CheckCircle2 className="h-5 w-5" />}>
                {anyQr
                  ? 'Pembayaran lunas. Tunjukkan QR di bawah ke petugas saat datang — konfirmasi juga dikirim ke email Anda.'
                  : 'Pembayaran lunas. Semua sesi sudah check-in atau sudah lewat — tidak ada QR yang perlu ditunjukkan.'}
              </Banner>
            )}

            {data.payment.paymentStatus === 'EXPIRED' && (
              <Banner tone="bad" icon={<AlertCircle className="h-5 w-5" />}>
                Batas waktu transfer terlewat dan slot sudah dilepas. Silakan pesan ulang.
              </Banner>
            )}

            {data.payment.verificationStatus === 'awaiting' && (
              <Banner tone="info" icon={<Clock className="h-5 w-5" />}>
                Bukti pembayaran sedang diperiksa admin. Slot Anda tetap ditahan sampai ada keputusan — tidak perlu bayar ulang.
              </Banner>
            )}

            {data.payment.verificationStatus === 'rejected' && (
              <Banner tone="bad" icon={<AlertCircle className="h-5 w-5" />}>
                <span className="block font-semibold">Bukti ditolak</span>
                <span className="block text-white/70">{data.payment.rejectionReason}</span>
                <span className="mt-1 block text-white/70">
                  Slot sudah dilepas kembali. Silakan pesan ulang, atau hubungi admin bila dana sudah terkirim. Detailnya juga dikirim ke email Anda.
                </span>
                <a
                  href={routes.booking()}
                  className="mt-3 inline-block rounded-full bg-accent-red px-5 py-2 font-bdo text-xs font-bold text-white hover:opacity-90"
                >
                  Pesan Ulang
                </a>
              </Banner>
            )}

            {data.payment.paymentStatus === 'UNPAID' && !data.payment.hasProof && mmss && (
              <Banner tone={expired ? 'bad' : 'warn'} icon={<Clock className="h-5 w-5" />}>
                {expired ? (
                  <>Waktu habis. Muat ulang halaman untuk melihat status terbaru.</>
                ) : (
                  <>
                    Slot ditahan <span className="font-bold tabular-nums">{mmss}</span> lagi. Setelah itu slot dilepas untuk pengguna lain.
                  </>
                )}
              </Banner>
            )}

            {/* ── Jadwal + tiket QR: satu kartu per sesi, tunggal maupun paket ── */}
            <TicketList
              title={data.booking.unitName && !mixedUnits ? `${data.booking.facilityName} · ${data.booking.unitName}` : data.booking.facilityName}
              subtitle={data.sessions ? `Paket ${data.sessions.length} sesi · satu kali transfer untuk semuanya` : undefined}
              sessions={tickets}
              receiptNumber={data.payment.receiptNumber}
              showUnit={mixedUnits}
            />

            {/* ── Transfer instructions ───────────────────────────────── */}
            {data.payment.paymentStatus === 'UNPAID' && !expired && <TransferInstructions bank={data.bank} qris={data.qris} payment={data.payment} />}

            {/* ── Proof upload ────────────────────────────────────────── */}
            {data.payment.canUpload && !expired && (
              <ProofUploadForm<PaymentDetailDto>
                endpoint={`/customer/booking/${bookingId}/pembayaran/bukti`}
                onUploaded={(fresh) => queryClient.setQueryData(['customer-booking-payment', bookingId], fresh)}
              />
            )}

            <button
              type="button"
              onClick={() => router.push(routes.bookingHistory())}
              className="mt-6 font-bdo text-sm text-neutral-400 underline-offset-4 hover:text-white hover:underline"
            >
              Lihat semua reservasi
            </button>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
