'use client'

import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { authModal, routes } from '@/config/routes'
import { useAuth } from '@/context/AuthContext'
import axiosInstance from '@/lib/axios'
import type { ApiSuccess, BookingHistoryItemDto, BookingStatus, PaymentStatus } from '@/types/contracts/contracts'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// ===== /riwayat-booking (client penuh) =====
// Padanan Pages/Bookings/History.tsx Laravel. Di Laravel prop `bookings` datang dari
// PublicBookingController::history lewat Inertia; di sini datanya milik-sendiri pengguna, jadi
// TIDAK ADA fetch RSC sama sekali — seluruh halaman dirender di klien setelah sesi diketahui
// (addendum Fase 6). Route shell src/app/riwayat-booking/page.tsx sengaja tanpa `revalidate`.
//
// Rename snake -> camel mengikuti BookingHistoryItemDto: facility_name -> facilityName,
// unit_name -> unitName, start_time/end_time -> startTime/endTime, payment_status -> paymentStatus,
// verification_status -> verificationStatus, transfer_total -> transferTotal, has_ticket -> hasTicket,
// checked_in_at -> checkedInAt, created_at -> createdAt.
//
// `payment_url` Laravel (= route('booking.payment', $b), null bila booking belum punya transaksi)
// TIDAK ada di DTO; penggantinya `hasPayment` sebagai penjaga kondisi + routes.bookingPayment(b.id)
// sebagai href. Nilainya identik dengan URL yang dikirim Laravel.
//
// <Head title="Riwayat Booking"> dihapus: metadata sudah ada di route shell.

const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

const statusLabel: Record<BookingStatus, string> = {
  pending: 'Menunggu',
  confirmed: 'Terkonfirmasi',
  cancelled: 'Dibatalkan',
  completed: 'Selesai'
}

const statusClass: Record<BookingStatus, string> = {
  pending: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
  confirmed: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30',
  cancelled: 'bg-rose-500/15 text-rose-300 ring-rose-400/30',
  completed: 'bg-sky-400/15 text-sky-300 ring-sky-400/30'
}

const payClass: Record<PaymentStatus, string> = {
  UNPAID: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
  PAID: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30',
  EXPIRED: 'bg-neutral-500/15 text-neutral-300 ring-neutral-400/30',
  FAILED: 'bg-rose-500/15 text-rose-300 ring-rose-400/30'
}

/** What the customer still has to do, if anything. */
function payLabel(b: BookingHistoryItemDto): string {
  if (b.paymentStatus === 'PAID') return 'LUNAS'
  if (b.paymentStatus === 'EXPIRED') return 'KEDALUWARSA'
  if (b.verificationStatus === 'awaiting') return 'MENUNGGU VERIFIKASI'
  if (b.verificationStatus === 'rejected') return 'BUKTI DITOLAK'
  return 'BELUM BAYAR'
}

export function BookingHistoryPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Laravel menjaga route ini dengan middleware 'auth' (routes/web.php). Di Next penjaga utamanya
  // src/middleware.ts (cookie ubsc_c_role); ini cerminan sisi klien untuk kasus sesi yang sudah
  // kedaluwarsa tapi cookie penanda masih ada.
  useEffect(() => {
    if (!isLoading && !user) router.replace(authModal('login'))
  }, [isLoading, user, router])

  // Belum ada data = belum selesai memuat. Laravel selalu punya `bookings` saat render pertama,
  // jadi cabang kosong ("Belum ada reservasi") hanya boleh muncul setelah jawaban API tiba —
  // kalau tidak, pengguna melihat kedipan "belum ada reservasi" setiap kali membuka halaman.
  const { data: bookings } = useQuery({
    queryKey: ['customer-booking-history'],
    queryFn: async () => {
      const res = await axiosInstance.get<ApiSuccess<BookingHistoryItemDto[]>>('/customer/booking')
      return res.data.data
    },
    enabled: !!user,
    retry: false
  })

  return (
    <div className="min-h-screen bg-[#0B0E12]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 pt-32 pb-24 sm:px-10">
        <h1 className="font-bdo text-3xl font-semibold text-white sm:text-4xl">Riwayat Booking</h1>
        <p className="mt-2 font-bdo text-sm text-neutral-400">Semua reservasi dan status pembayaran Anda.</p>

        {bookings &&
          (bookings.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-dashed border-white/15 bg-white/3 py-20 text-center">
              <p className="font-bdo text-neutral-400">Belum ada reservasi. Yuk pesan lapangan pertama Anda.</p>
              <a
                href={routes.booking()}
                className="mt-4 inline-block rounded-full bg-accent-red px-6 py-3 font-bdo text-sm font-bold text-white hover:opacity-90"
              >
                Booking Sekarang
              </a>
            </div>
          ) : (
            <div className="mt-10 space-y-4">
              {bookings.map((b) => (
                <div key={b.id} className="rounded-2xl border border-white/10 bg-white/4 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.35)] sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bdo text-lg font-semibold text-white">
                        {b.facilityName}
                        {b.unitName ? <span className="text-neutral-500"> · {b.unitName}</span> : null}
                      </p>
                      <p className="mt-1 font-bdo text-sm text-neutral-300">
                        {b.sessions
                          ? `Paket ${b.sessions.length} sesi · ${b.sessions[0].date} – ${b.sessions[b.sessions.length - 1].date}`
                          : `${b.date} · ${b.startTime} – ${b.endTime}`}
                      </p>
                      <p className="mt-1 font-bdo text-xs text-neutral-500">
                        {b.receipt ?? `#${b.id}`} · dibuat {b.createdAt}
                      </p>
                      {b.sessions && (
                        <details className="group mt-3">
                          <summary className="cursor-pointer list-none font-bdo text-xs font-semibold text-white/60 transition hover:text-white/90">
                            Lihat {b.sessions.length} jadwal pertemuan
                            <span className="ml-1 inline-block transition group-open:rotate-90">›</span>
                          </summary>
                          <ul className="mt-2 space-y-1.5">
                            {b.sessions.map((s) => (
                              <li key={s.id} className="flex items-center gap-2 font-bdo text-xs text-white/70">
                                <span
                                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.status === 'cancelled' ? 'bg-rose-400' : 'bg-emerald-400'}`}
                                />
                                <span className={s.status === 'cancelled' ? 'line-through opacity-60' : ''}>
                                  {s.date} · {s.time}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                    <div className="text-right">
                      {/* Yang ditransfer (harga + biaya admin + kode unik) — angka yang sama dengan halaman pembayaran. */}
                      <p className="font-bdo text-lg font-bold text-white">{rupiah(b.hasPayment ? b.transferTotal : b.amount)}</p>
                      {b.hasPayment && b.transferTotal !== b.amount && (
                        <p className="font-bdo text-[11px] text-neutral-500">harga {rupiah(b.amount)} + biaya admin + kode unik</p>
                      )}
                      <div className="mt-2 flex flex-wrap justify-end gap-2">
                        <span className={`rounded-full px-3 py-1 font-bdo text-[11px] font-bold ring-1 ${statusClass[b.status]}`}>
                          {statusLabel[b.status]}
                        </span>
                        <span className={`rounded-full px-3 py-1 font-bdo text-[11px] font-bold ring-1 ${payClass[b.paymentStatus]}`}>
                          {payLabel(b)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {b.hasTicket && b.hasPayment && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                      <a
                        href={routes.bookingPayment(b.id)}
                        className="inline-block rounded-full bg-white px-5 py-2.5 font-bdo text-sm font-bold text-neutral-900 hover:bg-white/90"
                      >
                        Tampilkan Tiket QR
                      </a>
                      <span className="font-bdo text-xs text-neutral-400">
                        {b.checkedInAt ? `Check-in ${b.checkedInAt}` : 'Tunjukkan ke petugas saat datang'}
                      </span>
                    </div>
                  )}

                  {b.paymentStatus === 'UNPAID' && b.status !== 'cancelled' && b.hasPayment && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                      <a
                        href={routes.bookingPayment(b.id)}
                        className="inline-block rounded-full bg-accent-red px-5 py-2.5 font-bdo text-sm font-bold text-white hover:opacity-90"
                      >
                        {b.verificationStatus === 'awaiting'
                          ? 'Lihat Status Pembayaran'
                          : b.verificationStatus === 'rejected'
                            ? 'Unggah Ulang Bukti'
                            : 'Lanjutkan Pembayaran'}
                      </a>
                      {b.verificationStatus !== 'awaiting' && (
                        <span className="font-bdo text-xs text-neutral-400">Transfer tepat {rupiah(b.transferTotal)}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
      </main>

      <Footer />
    </div>
  )
}
