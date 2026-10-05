'use client'

/**
 * Port dari resources/js/Components/UserDashboard/PaymentHistoryModal.tsx (faithful, DOM identik).
 * - default export -> named export `PaymentHistoryModal`.
 * - axios polos -> axiosInstance (@/lib/axios, baseURL '/api'); '/user/transactions' -> '/customer/transactions'.
 * - kolom `checkoutUrl` dihapus dari interface (Rewrite.md); tak ada pemakaian di render (ExternalLink pakai paymentUrl).
 * - 4 classPair v3->v4 diterapkan (spec).
 * - Catatan client 2026-09-28: baris membership berjudul paket + masa aktif (dulu "-"), dan setiap baris
 *   punya tombol Invoice (dokumen cetak dari API — "Simpan PDF" lewat dialog cetak browser).
 */

import { useEffect, useState } from 'react'
import { CreditCard, ExternalLink, FileText, Loader2, X } from 'lucide-react'
import axiosInstance from '@/lib/axios'
import { openPrintable } from '@/lib/openPrintable'
import { cn } from '@/lib/utils'
import type { ApiSuccess, CustomerTransactionDto, CustomerTransactionIndexDto, InvoiceDto } from '@/types/contracts/contracts'

interface Props {
  onClose: () => void
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PAID: { label: 'Lunas', className: 'bg-emerald-500/15 text-emerald-400' },
  UNPAID: { label: 'Belum Bayar', className: 'bg-amber-500/15 text-amber-400' },
  EXPIRED: { label: 'Kedaluwarsa', className: 'bg-slate-500/15 text-slate-400' },
  FAILED: { label: 'Gagal', className: 'bg-rose-500/15 text-rose-400' }
}

const AWAITING = { label: 'Menunggu Verifikasi', className: 'bg-sky-500/15 text-sky-400' }
const REJECTED = { label: 'Bukti Ditolak', className: 'bg-rose-500/15 text-rose-400' }

/**
 * paymentStatus alone cannot tell these apart: a proof that is waiting on
 * staff and one that was never sent are both UNPAID.
 */
function statusFor(t: CustomerTransactionDto) {
  if (t.paymentStatus === 'UNPAID' && t.verificationStatus === 'awaiting') return AWAITING
  if (t.verificationStatus === 'rejected') return REJECTED
  return STATUS_CONFIG[t.paymentStatus] ?? STATUS_CONFIG.FAILED
}

function formatRupiah(amount: number) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

/** Baris membership tidak punya fasilitas: judulnya paket, tanggalnya masa aktif. */
function titleFor(t: CustomerTransactionDto): string {
  return t.type === 'membership' ? `Membership ${t.membershipPlan ?? 'Gym'}` : t.facilityName
}

function dateFor(t: CustomerTransactionDto): string {
  if (t.membershipPeriod) return `${formatDate(t.membershipPeriod.startDate)} – ${formatDate(t.membershipPeriod.endDate)}`
  return formatDate(t.bookingDate ?? t.createdAt)
}

async function openInvoice(t: CustomerTransactionDto) {
  const opened = await openPrintable(
    async () => (await axiosInstance.get<ApiSuccess<InvoiceDto>>(`/customer/transactions/${t.id}/invoice`)).data.data.html
  )
  if (!opened) window.alert('Invoice gagal dibuka. Izinkan pop-up untuk situs ini, lalu coba lagi.')
}

export function PaymentHistoryModal({ onClose }: Props) {
  const [transactions, setTransactions] = useState<CustomerTransactionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    axiosInstance
      .get<ApiSuccess<CustomerTransactionIndexDto>>('/customer/transactions')
      .then((res) => setTransactions(res.data.data.transactions))
      .catch(() => setError('Gagal memuat data transaksi.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div data-lenis-prevent className="fixed inset-0 z-200 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0d1422] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10">
              <CreditCard className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="font-bdo text-[10px] font-bold tracking-[0.18em] text-blue-400 uppercase">Riwayat</p>
              <h2 className="font-clash text-[16px] font-semibold text-white">History Pembayaran</h2>
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
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-white/30" />
            </div>
          )}

          {!loading && error && (
            <div className="px-6 py-10 text-center">
              <p className="font-bdo text-sm text-rose-400">{error}</p>
            </div>
          )}

          {!loading && !error && transactions.length === 0 && (
            <div className="px-6 py-12 text-center">
              <CreditCard className="mx-auto mb-3 h-8 w-8 text-white/15" />
              <p className="font-bdo text-sm text-white/40">Belum ada transaksi.</p>
            </div>
          )}

          {!loading && !error && transactions.length > 0 && (
            <ul className="divide-y divide-white/[0.06] px-4 py-2">
              {transactions.map((t) => {
                const status = statusFor(t)
                return (
                  <li key={t.id} className="flex items-start justify-between gap-3 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-clash text-[13px] font-semibold text-white">{titleFor(t)}</p>
                      <p className="font-bdo text-[11px] text-white/40">
                        {dateFor(t)} · <span className="font-mono">{t.receiptNumber}</span>
                      </p>
                      <p className="mt-0.5 font-bdo text-[13px] text-white/70">
                        {/* Yang ditransfer (harga + biaya admin + kode unik), bukan harga saja. */}
                        {formatRupiah(t.transferTotal)}
                      </p>
                      {t.verificationStatus === 'rejected' && t.rejectionReason && (
                        <p className="mt-1 font-bdo text-[11px] text-rose-400">{t.rejectionReason}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className={cn('rounded-full px-2.5 py-0.5 font-bdo text-[10px] font-medium', status.className)}>{status.label}</span>
                      <button
                        type="button"
                        onClick={() => openInvoice(t)}
                        className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 font-bdo text-[11px] text-white/70 transition-colors hover:bg-white/10"
                      >
                        Invoice
                        <FileText className="h-3 w-3" />
                      </button>
                      {t.paymentStatus === 'UNPAID' && t.paymentUrl && (
                        <a
                          href={t.paymentUrl}
                          className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1 font-bdo text-[11px] text-blue-400 transition-colors hover:bg-blue-500/20"
                        >
                          {t.verificationStatus === 'awaiting' ? 'Lihat' : 'Bayar'}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
