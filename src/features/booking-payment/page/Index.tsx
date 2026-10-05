'use client'

import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { authModal, routes } from '@/config/routes'
import { useAuth } from '@/context/AuthContext'
import { Banner, ProofUploadForm, TransferInstructions, useCountdown } from '@/components/payment/TransferParts'
import axiosInstance from '@/lib/axios'
import type { ApiSuccess, PaymentDetailDto, PaymentRedirectDto } from '@/types/contracts/contracts'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
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

  return (
    <div className="min-h-screen bg-[#0B0E12]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24 sm:px-10">
        {data && (
          <>
            <p className="font-bdo text-xs font-semibold tracking-[0.2em] text-accent-red uppercase">{data.payment.receiptNumber}</p>
            <h1 className="mt-2 font-bdo text-3xl font-semibold text-white sm:text-4xl">Selesaikan Pembayaran</h1>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6">
              <p className="font-bdo text-lg font-semibold text-white">
                {data.booking.facilityName}
                {data.booking.unitName && <span className="text-neutral-500"> · {data.booking.unitName}</span>}
              </p>
              {data.sessions ? (
                <>
                  <p className="mt-1 font-bdo text-sm text-neutral-300">Paket {data.sessions.length} sesi · satu kali transfer untuk semuanya</p>
                  <ul className="mt-4 space-y-2">
                    {data.sessions.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/4 px-4 py-2.5">
                        <span className="min-w-0 font-bdo text-sm text-white/85">
                          {s.date}
                          <span className="text-neutral-500"> · {s.time}</span>
                        </span>
                        {s.status === 'cancelled' ? (
                          <span className="shrink-0 rounded-full bg-rose-400/15 px-2.5 py-0.5 font-bdo text-[11px] font-bold text-rose-300">
                            Dibatalkan
                          </span>
                        ) : s.checkedInAt ? (
                          <span className="shrink-0 rounded-full bg-emerald-400/15 px-2.5 py-0.5 font-bdo text-[11px] font-bold text-emerald-300">
                            Hadir {s.checkedInAt}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-1 font-bdo text-sm text-neutral-300">
                  {data.booking.date} · {data.booking.startTime} – {data.booking.endTime}
                </p>
              )}
            </div>

            {/* ── State banners ───────────────────────────────────────── */}
            {data.payment.paymentStatus === 'PAID' && (
              <Banner tone="ok" icon={<CheckCircle2 className="h-5 w-5" />}>
                Pembayaran terkonfirmasi. Reservasi Anda sudah aman — konfirmasi juga dikirim ke email Anda.
              </Banner>
            )}

            {data.sessions && data.ticket && (
              <section className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6">
                <h2 className="font-bdo text-sm font-bold tracking-wider text-white/50 uppercase">
                  Tiket masuk · {data.sessions.filter((s) => s.checkInUrl).length} sesi
                </h2>
                <p className="mt-2 font-bdo text-xs text-white/45">Setiap pertemuan punya QR sendiri. Tunjukkan QR sesi hari itu ke petugas.</p>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {data.sessions
                    .filter((s) => s.checkInUrl)
                    .map((s) => (
                      <div key={s.id} className="flex flex-col items-center rounded-xl bg-white/4 p-3">
                        <div className="rounded-lg bg-white p-2">
                          <QRCodeSVG value={s.checkInUrl as string} size={96} level="M" />
                        </div>
                        <p className="mt-2 text-center font-bdo text-[11px] font-semibold text-white/80">{s.date}</p>
                        <p className="text-center font-bdo text-[11px] text-white/45">{s.time}</p>
                        {s.checkedInAt && <p className="mt-1 font-bdo text-[10px] font-bold text-emerald-300">Hadir {s.checkedInAt}</p>}
                      </div>
                    ))}
                </div>
              </section>
            )}

            {!data.sessions && data.ticket && (
              <section className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6">
                <h2 className="font-bdo text-sm font-bold tracking-wider text-white/50 uppercase">Tiket masuk</h2>
                <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                  <div className="rounded-2xl bg-white p-3">
                    <QRCodeSVG value={data.ticket.checkInUrl} size={168} level="M" />
                  </div>
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <p className="font-bdo text-2xl font-bold tracking-wide text-white">{data.payment.receiptNumber}</p>
                    <p className="mt-2 font-bdo text-sm leading-relaxed text-white/70">
                      Tunjukkan QR ini ke petugas saat datang. Petugas memindainya untuk mencatat kehadiran — tidak perlu cetak, cukup dari layar HP.
                    </p>
                    {data.ticket.checkedInAt ? (
                      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 font-bdo text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Check-in {data.ticket.checkedInAt}
                      </p>
                    ) : (
                      <p className="mt-3 font-bdo text-xs text-white/45">
                        Kalau QR tidak bisa dipindai, sebutkan kode {data.payment.receiptNumber} ke petugas.
                      </p>
                    )}
                  </div>
                </div>
              </section>
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

            {/* ── Transfer instructions ───────────────────────────────── */}
            {data.payment.paymentStatus === 'UNPAID' && <TransferInstructions bank={data.bank} qris={data.qris} payment={data.payment} />}

            {/* ── Proof upload ────────────────────────────────────────── */}
            {data.payment.canUpload && (
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
