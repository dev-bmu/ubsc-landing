'use client'

/**
 * Port dari UBSC-LARAVEL/resources/js/Components/Booking/AuthGate.tsx.
 *
 * Perubahan terhadap sumber:
 *   - `export default function` -> named export `AuthGate` (konvensi repo). Path-nya dikunci di
 *     `@/components/booking/AuthGate` karena ClassMonthPicker sudah mengimpornya dari situ.
 *   - `'use client'`: useAuth() untuk tiga cabang gate.
 *   - `usePage<PageProps>().props.auth` -> `useAuth()` dari '@/context/AuthContext'.
 *   - `route('login')` -> `authModal('login')` ('/?auth=login'). Laravel pun tidak punya halaman
 *     login sungguhan: GET /login hanya `redirect('/?auth=login')` (routes/auth.php), jadi tujuan
 *     akhirnya identik. Navbar membaca ?auth= di halaman mana pun lewat useEffect, BUKAN
 *     useSearchParams() — ISR /booking tetap utuh.
 *   - `router.post(route('verification.send'))` -> ResendVerificationButton (POST
 *     /api/customer/profile/resend-verification): kirim ulang untuk akun yang login, dengan jeda dan
 *     batas harian per akun dari server (catatan client 2026-09-28).
 *
 * Spec AuthGate: classPairs kosong, deadTokens kosong — tidak ada satu class pun yang berubah.
 * Urutan DOM, copy, dan ketiga cabang gate (guest / belum verifikasi / lolos) apa adanya.
 *
 * CATATAN emailVerifiedAt: dikirim endpoint auth sejak 2026-09-28. Login pelanggan yang belum
 * verifikasi memang DIIZINKAN; yang digerbangi adalah pembayaran (requireVerifiedEmail di API). Hanya
 * `null` yang berarti belum terverifikasi — `undefined` (sesi lama) tidak dikunci, supaya gate ini tidak
 * pernah mematikan seluruh alur booking karena field yang hilang.
 */

import { ResendVerificationButton } from '@/components/auth/EmailVerification'
import { authModal } from '@/config/routes'
import { useAuth } from '@/context/AuthContext'

/**
 * The three-way gate before any booking can be paid for: signed out, signed in
 * but unverified, or good to go.
 *
 * Extracted from BookingListItem so the court flow and the class flow cannot
 * drift into two different sets of rules about who may pay.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const emailVerified = user?.emailVerifiedAt !== null

  if (!user) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-5 text-center">
        <p className="mb-4 font-bdo text-sm text-amber-800">Masuk ke akun Anda untuk melanjutkan reservasi dan pembayaran.</p>
        <a
          href={authModal('login')}
          className="inline-block rounded-full bg-accent-red px-6 py-3 font-bdo text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Masuk / Daftar untuk Reservasi
        </a>
      </div>
    )
  }

  if (!emailVerified) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-5 text-center">
        <p className="mb-2 font-bdo text-sm text-amber-800">
          Email Anda belum diverifikasi. Verifikasi dulu untuk melanjutkan pembayaran, lalu muat ulang halaman.
        </p>
        <ResendVerificationButton className="justify-center font-bdo text-sm text-amber-900" />
      </div>
    )
  }

  return <>{children}</>
}
