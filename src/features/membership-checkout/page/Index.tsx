'use client'

import { AuthGate } from '@/components/booking/AuthGate'
import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { Banner, rupiah } from '@/components/payment/TransferParts'
import { MemberPhotoSection, PHOTO_CHECKIN_NOTE } from '@/components/user-dashboard/MemberPhotoSection'
import { authModal, routes } from '@/config/routes'
import { useAuth } from '@/context/AuthContext'
import { extractApiError } from '@/lib/applyApiErrors'
import axiosInstance from '@/lib/axios'
import { cn } from '@/lib/utils'
import type { ApiSuccess, MembershipCheckoutDto, MembershipCheckoutPreviewDto, MembershipPlanDto } from '@/types/contracts/contracts'
import { formatCalendarDateIntl } from '@/types/contracts/format'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertCircle, CalendarClock, Check, Clock, QrCode } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

// ===== /membership/daftar/{planId} — checkout membership lewat web (PRD tambahan 2026-09, tahap C) =====
// Ringkasan harga, biaya admin, dan tanggal mulai dihitung SERVER (GET .../checkout/:planId) dengan
// aturan yang sama dengan checkout-nya, jadi angka di sini tidak pernah berbeda dari yang ditagih.
// Per-user penuh (identitas, foto), jadi tidak ada fetch RSC: route shell hanya meneruskan planId.
//
// Catatan client 2026-10-05: alur lama membingungkan. Sekarang tiga langkah bernomor (paket -> foto
// wajah -> bayar) dengan ringkasan yang selalu terlihat di samping, dan setiap tombol nonaktif
// menyebut alasannya.

const longDate = (key: string) => formatCalendarDateIntl(key, { day: 'numeric', month: 'long', year: 'numeric' })

function durationLabel(months: number): string {
  if (months === 1) return '1 bulan'
  if (months === 12) return '1 tahun'
  return `${months} bulan`
}

export function MembershipCheckoutPage({ planId }: { planId: string }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
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
  const locked = Boolean(data?.renewalOpensOn)
  // Alasan tombol bayar nonaktif — selalu ditulis, tidak pernah tombol mati tanpa penjelasan.
  const blocker = !data ? null : locked ? 'Perpanjangan belum dibuka.' : !photoReady ? 'Kirim foto wajah dulu (langkah 2).' : null

  return (
    <div className="min-h-screen bg-[#0B0E12]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 pt-32 pb-24 sm:px-10">
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
            <p className="font-bdo text-xs font-semibold tracking-[0.2em] text-accent-red uppercase">Membership Gym</p>
            <h1 className="mt-2 font-bdo text-3xl font-semibold text-white sm:text-4xl">Daftar membership</h1>
            <p className="mt-2 font-bdo text-sm text-white/55">
              Pilih paket, kirim foto wajah, lalu bayar. Membership aktif setelah admin memverifikasi pembayaran.
            </p>

            <Stepper current={locked ? 0 : photoReady || data.pendingMembershipId ? 3 : 2} />

            {data.pendingMembershipId && (
              <Banner tone="warn" icon={<Clock className="h-5 w-5" />}>
                Anda masih punya pembelian membership yang menunggu pembayaran.{' '}
                <a href={routes.membershipPayment(data.pendingMembershipId)} className="font-semibold underline underline-offset-4">
                  Lanjutkan pembayaran
                </a>
              </Banner>
            )}

            {data.activeUntil && data.renewalOpensOn && (
              <Banner tone="info" icon={<CalendarClock className="h-5 w-5" />}>
                Membership Anda masih aktif sampai <strong>{longDate(data.activeUntil)}</strong>. Perpanjangan bisa dibeli mulai{' '}
                <strong>{longDate(data.renewalOpensOn)}</strong> (7 hari terakhir masa aktif), dan langsung menyambung tanpa jeda.
              </Banner>
            )}

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <div className="space-y-6">
                <StepCard number={1} title="Pilih paket" hint="Harga sudah disesuaikan dengan kategori akun Anda." done>
                  <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Paket membership">
                    {(plans ?? []).map((plan) => (
                      <PlanOption
                        key={plan.id}
                        plan={plan}
                        wargaRate={data.priceCategory === 'warga_ub'}
                        selected={plan.id === planId}
                        onSelect={() => {
                          setError(null)
                          router.replace(routes.membershipCheckout(plan.id), { scroll: false })
                        }}
                      />
                    ))}
                  </div>
                </StepCard>

                <StepCard
                  number={2}
                  title="Foto wajah"
                  hint={`Diverifikasi staff. ${PHOTO_CHECKIN_NOTE} Cukup sekali — foto yang sama dipakai seterusnya.`}
                  done={photoReady}
                >
                  <MemberPhotoSection url={data.memberPhotoUrl} status={data.memberPhotoStatus} compact onUploaded={() => setError(null)} />
                </StepCard>
              </div>

              <aside className="rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6 lg:sticky lg:top-28">
                <p className="font-bdo text-xs font-bold tracking-wider text-white/45 uppercase">3. Ringkasan & bayar</p>
                <p className="mt-3 font-bdo text-lg font-semibold text-white">{data.plan.name}</p>
                <p className="font-bdo text-sm text-white/55">
                  {durationLabel(data.plan.durationMonths)} ·{' '}
                  {data.startsAfterCurrent ? `mulai ${longDate(data.startsAfterCurrent)}` : 'mulai saat pembayaran disetujui'}
                </p>

                <dl className="mt-5 space-y-2.5 border-t border-white/10 pt-4 font-bdo text-sm">
                  <Row label="Harga paket">
                    {rupiah(data.amount)}
                    {data.priceCategory === 'warga_ub' && (
                      <span className="ml-2 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">Warga UB</span>
                    )}
                  </Row>
                  {data.adminFee > 0 && <Row label="Biaya admin">{rupiah(data.adminFee)}</Row>}
                  <Row label="Kode unik" muted>
                    3 digit, dibuat saat bayar
                  </Row>
                </dl>

                <div className="mt-4 flex items-start justify-between gap-3 border-t border-white/10 pt-4">
                  <span className="pt-1.5 font-bdo text-sm font-semibold text-white">Total bayar</span>
                  <span className="text-right">
                    <span className="block font-clash text-2xl font-semibold text-white tabular-nums">{rupiah(data.amount + data.adminFee)}</span>
                    <span className="font-bdo text-[11px] text-white/45">+ kode unik (maks. {rupiah(data.uniqueCodeMax)})</span>
                  </span>
                </div>

                <div className="mt-5">
                  <AuthGate>
                    {error && <p className="mb-3 font-bdo text-sm text-rose-400">{error}</p>}
                    {data.pendingMembershipId ? (
                      // Masih ada pembelian yang menunggu pembayaran: pembelian baru tidak dibuat sampai yang ini
                      // selesai atau kedaluwarsa. Dulu tombolnya tetap 'Lanjut ke Pembayaran' dan diam-diam kembali ke
                      // pembelian lama, sehingga terlihat seperti bisa mendaftar dua kali.
                      <>
                        <a
                          href={routes.membershipPayment(data.pendingMembershipId)}
                          className="block w-full rounded-full bg-accent-red px-6 py-3 text-center font-bdo text-sm font-bold text-white transition hover:opacity-90"
                        >
                          Lanjutkan Pembayaran yang Tertunda
                        </a>
                        <p className="mt-2 text-center font-bdo text-xs text-white/50">
                          Pembelian baru bisa dibuat setelah pembayaran itu selesai atau kedaluwarsa.
                        </p>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null)
                            checkout.mutate()
                          }}
                          disabled={checkout.isPending || blocker !== null}
                          className="w-full rounded-full bg-accent-red px-6 py-3 font-bdo text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {checkout.isPending ? 'Memproses…' : 'Lanjut ke Pembayaran'}
                        </button>
                        {blocker && <p className="mt-2 text-center font-bdo text-xs text-white/50">{blocker}</p>}
                      </>
                    )}
                  </AuthGate>
                </div>

                <p className="mt-4 flex items-start gap-2 font-bdo text-xs leading-relaxed text-white/45">
                  <QrCode className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Di langkah berikutnya Anda membayar (QRIS atau transfer) lalu mengunggah bukti bayar. Membership aktif begitu admin
                  memverifikasinya.
                </p>

                {data.plan.wargaPrice !== null && data.priceCategory === 'umum' && (
                  <p className="mt-3 rounded-xl bg-white/4 px-3 py-2 font-bdo text-xs leading-relaxed text-white/55">
                    {data.identityStatus === 'pending'
                      ? `Pengajuan Warga UB Anda sedang ditinjau. Tunggu hasilnya untuk harga ${rupiah(data.plan.wargaPrice)}, atau lanjut dengan harga umum.`
                      : `Warga UB (mahasiswa/pegawai) membayar ${rupiah(data.plan.wargaPrice)}. Ajukan verifikasi di menu Profil sebelum membeli.`}
                  </p>
                )}
              </aside>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

const STEPS = ['Paket', 'Foto wajah', 'Bayar'] as const

/** `current` = langkah yang sedang dikerjakan (1..3); 0 = alur terkunci (perpanjangan belum dibuka). */
function Stepper({ current }: { current: number }) {
  return (
    <ol className="mt-6 flex items-center gap-2 sm:gap-3" aria-label="Langkah pendaftaran">
      {STEPS.map((label, index) => {
        const step = index + 1
        const done = current > step
        const active = current === step
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bdo text-xs font-bold',
                done ? 'bg-emerald-400 text-[#0B0E12]' : active ? 'bg-accent-red text-white' : 'bg-white/8 text-white/45'
              )}
            >
              {done ? <Check className="h-4 w-4" /> : step}
            </span>
            <span className={cn('truncate font-bdo text-xs font-semibold sm:text-sm', active || done ? 'text-white' : 'text-white/45')}>{label}</span>
            {step < STEPS.length && <span className="hidden h-px flex-1 bg-white/10 sm:block" />}
          </li>
        )
      })}
    </ol>
  )
}

function StepCard({ number, title, hint, done, children }: { number: number; title: string; hint: string; done: boolean; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bdo text-xs font-bold',
            done ? 'bg-emerald-400 text-[#0B0E12]' : 'bg-accent-red text-white'
          )}
        >
          {done ? <Check className="h-4 w-4" /> : number}
        </span>
        <div>
          <h2 className="font-bdo text-base font-semibold text-white">{title}</h2>
          <p className="mt-0.5 font-bdo text-xs leading-relaxed text-white/50">{hint}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function PlanOption({
  plan,
  wargaRate,
  selected,
  onSelect
}: {
  plan: MembershipPlanDto
  wargaRate: boolean
  selected: boolean
  onSelect: () => void
}) {
  const price = wargaRate && plan.wargaPrice !== null ? plan.wargaPrice : plan.price
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => !selected && onSelect()}
      className={cn(
        'rounded-2xl border p-4 text-left transition',
        selected ? 'border-accent-red bg-accent-red/10 ring-1 ring-accent-red' : 'border-white/10 bg-white/2 hover:border-white/30'
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block font-bdo text-sm font-semibold text-white">{plan.name}</span>
          <span className="mt-0.5 block font-bdo text-xs text-white/50">{durationLabel(plan.durationMonths)}</span>
        </span>
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
            selected ? 'border-accent-red bg-accent-red text-white' : 'border-white/25'
          )}
        >
          {selected && <Check className="h-3 w-3" />}
        </span>
      </span>
      <span className="mt-4 block font-clash text-xl font-semibold text-white tabular-nums">{rupiah(price)}</span>
      {plan.durationMonths > 1 && (
        <span className="block font-bdo text-xs text-white/45 tabular-nums">≈ {rupiah(Math.round(price / plan.durationMonths))} / bulan</span>
      )}
      {!wargaRate && plan.wargaPrice !== null && (
        <span className="mt-2 block font-bdo text-[11px] text-emerald-300/80">Warga UB {rupiah(plan.wargaPrice)}</span>
      )}
    </button>
  )
}

function Row({ label, muted, children }: { label: string; muted?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-white/55">{label}</dt>
      <dd className={cn('text-right tabular-nums', muted ? 'text-xs text-white/45' : 'font-semibold text-white')}>{children}</dd>
    </div>
  )
}
