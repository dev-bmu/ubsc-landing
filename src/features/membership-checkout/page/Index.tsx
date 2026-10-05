'use client'

import { AuthGate } from '@/components/booking/AuthGate'
import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { Banner, rupiah } from '@/components/payment/TransferParts'
import { MemberPhotoSection } from '@/components/user-dashboard/MemberPhotoSection'
import { authModal, routes } from '@/config/routes'
import { useAuth } from '@/context/AuthContext'
import { extractApiError } from '@/lib/applyApiErrors'
import axiosInstance from '@/lib/axios'
import { cn } from '@/lib/utils'
import type { ApiSuccess, MembershipCheckoutDto, MembershipCheckoutPreviewDto, MembershipPlanDto } from '@/types/contracts/contracts'
import { formatCalendarDateIntl } from '@/types/contracts/format'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Clock, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// ===== /membership/daftar/{planId} — checkout membership lewat web (PRD tambahan 2026-09, tahap C) =====
// Ringkasan harga, biaya admin, dan tanggal mulai dihitung SERVER (GET .../checkout/:planId) dengan
// aturan yang sama dengan checkout-nya, jadi angka di sini tidak pernah berbeda dari yang ditagih.
// Per-user penuh (identitas, foto), jadi tidak ada fetch RSC: route shell hanya meneruskan planId.
// Catatan client 2026-09-28: semua paket aktif bisa dipilih langsung di halaman ini — dulu hanya paket
// yang diklik dari carousel yang tampil, sehingga pelanggan mengira paketnya cuma satu.

const longDate = (key: string) => formatCalendarDateIntl(key, { day: 'numeric', month: 'long', year: 'numeric' })

export function MembershipCheckoutPage({ planId }: { planId: string }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) router.replace(authModal('login'))
  }, [isLoading, user, router])

  const queryKey = ['membership-checkout', planId]
  const { data, error: loadError } = useQuery({
    queryKey,
    queryFn: async () => (await axiosInstance.get<ApiSuccess<MembershipCheckoutPreviewDto>>(`/customer/memberships/checkout/${planId}`)).data.data,
    enabled: !!user,
    retry: false
  })

  // Daftar paket aktif publik (endpoint yang sama dengan beranda) untuk pemilih paket.
  const { data: plans } = useQuery({
    queryKey: ['public-membership-plans'],
    queryFn: async () => (await axiosInstance.get<ApiSuccess<MembershipPlanDto[]>>('/public/membership-plans')).data.data,
    staleTime: 60_000
  })

  const checkout = useMutation({
    mutationFn: async () =>
      (await axiosInstance.post<ApiSuccess<MembershipCheckoutDto>>('/customer/memberships', { membershipPlanId: planId })).data.data,
    onSuccess: ({ membershipId }) => router.push(routes.membershipPayment(membershipId)),
    onError: (err) => {
      const { message, fieldErrors } = extractApiError(err, 'Pendaftaran gagal diproses. Coba lagi.')
      setError(fieldErrors.photo ?? fieldErrors.membership ?? message)
    }
  })

  const photoReady = Boolean(data?.memberPhotoUrl) && data?.memberPhotoStatus !== 'rejected'
  const showsWargaHint = data && data.plan.wargaPrice !== null && data.priceCategory === 'umum'

  return (
    <div className="min-h-screen bg-[#0B0E12]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24 sm:px-10">
        {loadError && (
          <Banner tone="bad" icon={<AlertCircle className="h-5 w-5" />}>
            {extractApiError(loadError, 'Paket membership tidak ditemukan.').message}{' '}
            <a href={routes.pricing()} className="underline underline-offset-4">
              Lihat paket lain
            </a>
          </Banner>
        )}

        {data && (
          <>
            <p className="font-bdo text-xs font-semibold tracking-[0.2em] text-accent-red uppercase">Daftar Membership</p>
            <h1 className="mt-2 font-bdo text-3xl font-semibold text-white sm:text-4xl">{data.plan.name}</h1>

            {data.pendingMembershipId && (
              <Banner tone="warn" icon={<Clock className="h-5 w-5" />}>
                Anda masih punya pembelian membership yang menunggu pembayaran.{' '}
                <a href={routes.membershipPayment(data.pendingMembershipId)} className="font-semibold underline underline-offset-4">
                  Lanjutkan pembayaran
                </a>
              </Banner>
            )}

            {plans && plans.length > 1 && (
              <section className="mt-6">
                <h2 className="font-bdo text-sm font-bold tracking-wider text-white/50 uppercase">Pilih paket</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {plans.map((plan) => {
                    const selected = plan.id === planId
                    const price = data.priceCategory === 'warga_ub' && plan.wargaPrice !== null ? plan.wargaPrice : plan.price
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          if (selected) return
                          setError(null)
                          router.replace(routes.membershipCheckout(plan.id), { scroll: false })
                        }}
                        className={cn(
                          'rounded-2xl border p-4 text-left transition',
                          selected ? 'border-accent-red bg-accent-red/10' : 'border-white/10 bg-white/4 hover:border-white/30'
                        )}
                      >
                        <span className="block font-bdo text-sm font-semibold text-white">{plan.name}</span>
                        <span className="mt-1 block font-bdo text-xs text-white/55">{plan.durationMonths} bulan</span>
                        <span className="mt-2 block font-bdo text-base font-bold text-white tabular-nums">{rupiah(price)}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6">
              <h2 className="font-bdo text-sm font-bold tracking-wider text-white/50 uppercase">Ringkasan</h2>
              <dl className="mt-4 space-y-3 font-bdo text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/60">
                    Harga paket {data.plan.durationMonths} bulan
                    {data.priceCategory === 'warga_ub' && (
                      <span className="ml-2 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">Tarif Warga UB</span>
                    )}
                  </dt>
                  <dd className="font-semibold text-white tabular-nums">{rupiah(data.amount)}</dd>
                </div>
                {data.adminFee > 0 && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-white/60">Biaya admin</dt>
                    <dd className="font-semibold text-white tabular-nums">{rupiah(data.adminFee)}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/60">Kode unik</dt>
                  <dd className="text-white/60">1–{data.uniqueCodeMax}, muncul di langkah pembayaran</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <dt className="font-semibold text-white">Total transfer</dt>
                  <dd className="font-bold text-white tabular-nums">{rupiah(data.amount + data.adminFee)} + kode unik</dd>
                </div>
              </dl>

              <p className="mt-4 flex items-start gap-2 font-bdo text-xs leading-relaxed text-white/60">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {data.startsAfterCurrent
                    ? `Perpanjangan: masa aktif baru dimulai ${longDate(data.startsAfterCurrent)}, setelah membership Anda yang sekarang berakhir.`
                    : `Masa aktif ${data.plan.durationMonths} bulan dimulai saat pembayaran Anda diverifikasi admin.`}
                </span>
              </p>

              {showsWargaHint && (
                <p className="mt-3 rounded-xl bg-white/4 px-3 py-2 font-bdo text-xs leading-relaxed text-white/60">
                  {data.identityStatus === 'pending'
                    ? `Pengajuan Warga UB Anda sedang ditinjau. Tunggu hasilnya untuk harga Warga UB ${rupiah(data.plan.wargaPrice as number)}, atau lanjut dengan harga umum.`
                    : `Warga UB mendapat harga ${rupiah(data.plan.wargaPrice as number)}. Ajukan verifikasi di menu Profil sebelum membeli.`}
                </p>
              )}
            </section>

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6">
              <MemberPhotoSection
                url={data.memberPhotoUrl}
                status={data.memberPhotoStatus}
                onUploaded={() => {
                  setError(null)
                  void queryClient.invalidateQueries({ queryKey })
                  void queryClient.invalidateQueries({ queryKey: ['customer-profile'] })
                }}
              />
            </section>

            <div className="mt-6">
              <AuthGate>
                {error && <p className="mb-3 font-bdo text-sm text-rose-400">{error}</p>}
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    checkout.mutate()
                  }}
                  disabled={checkout.isPending || !photoReady}
                  className="w-full rounded-full bg-accent-red px-6 py-3 font-bdo text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {checkout.isPending ? 'Memproses…' : 'Lanjut ke Pembayaran'}
                </button>
                {!photoReady && <p className="mt-2 text-center font-bdo text-xs text-white/45">Unggah foto wajah dulu untuk melanjutkan.</p>}
              </AuthGate>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
