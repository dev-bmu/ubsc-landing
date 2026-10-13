'use client'

import { formatLongDate, todayStr } from '@/lib/calendar'
import type { BookingStatus } from '@/types/contracts/contracts'
import { CalendarDays, CheckCircle2, Clock, MapPin, Maximize2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'

// ===== Tiket masuk: satu kartu per sesi =====
// Dipakai halaman bayar booking untuk booking tunggal DAN paket, supaya pelanggan (dan petugas yang
// melihat layar HP-nya) selalu membaca bentuk yang sama: "Sesi 1 dari 2", tanggal panjang, jam,
// status, lalu QR. Sebelum lunas kartu yang sama tampil tanpa QR — jadwalnya tetap terbaca.

export interface TicketSession {
  id: string
  /** "YYYY-MM-DD" */
  dateKey: string
  /** "14:00 – 15:00" */
  time: string
  unitName?: string | null
  status: BookingStatus
  checkedInAt?: string | null
  checkInUrl?: string | null
}

type Stage = 'cancelled' | 'checkedIn' | 'done' | 'missed' | 'today' | 'upcoming'

const CHIP: Record<Stage, { label: string; className: string }> = {
  today: { label: 'Hari ini', className: 'bg-emerald-400 text-neutral-950' },
  upcoming: { label: 'Akan datang', className: 'bg-sky-400/15 text-sky-300 ring-1 ring-sky-400/30' },
  checkedIn: { label: 'Sudah check-in', className: 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30' },
  done: { label: 'Selesai', className: 'bg-white/8 text-white/60 ring-1 ring-white/15' },
  missed: { label: 'Sudah lewat', className: 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30' },
  cancelled: { label: 'Dibatalkan', className: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30' }
}

function stageOf(s: TicketSession, today: string): Stage {
  if (s.status === 'cancelled') return 'cancelled'
  if (s.checkedInAt) return 'checkedIn'
  if (s.status === 'completed') return 'done'
  // "YYYY-MM-DD" bisa dibandingkan sebagai string. Sesi lampau yang belum lunas (mis. bukti belum
  // diverifikasi) BUKAN "Selesai" — tidak pernah dibayar maupun dihadiri.
  if (s.dateKey < today) return s.status === 'confirmed' ? 'done' : 'missed'
  return s.dateKey === today ? 'today' : 'upcoming'
}

/** QR hanya untuk sesi lunas yang masih bisa didatangi (hari ini / akan datang). */
export function showsQr(s: TicketSession, today: string): boolean {
  const stage = stageOf(s, today)
  return Boolean(s.checkInUrl) && (stage === 'today' || stage === 'upcoming')
}

export function TicketList({
  title,
  subtitle,
  sessions,
  receiptNumber,
  showUnit = false
}: {
  title: string
  subtitle?: string
  sessions: TicketSession[]
  receiptNumber: string
  /** Tulis unit di tiap kartu — dipakai bila sesi paket tidak semuanya di unit yang sama. */
  showUnit?: boolean
}) {
  // Dibaca sekali di klien; halaman ini baru merender tiket setelah data API tiba (tanpa SSR).
  const [today] = useState(todayStr)
  const [zoom, setZoom] = useState<{ session: TicketSession; label: string } | null>(null)
  const paid = sessions.some((s) => s.checkInUrl)
  const anyQr = sessions.some((s) => showsQr(s, today))
  const live = sessions.some((s) => s.status !== 'cancelled')
  const total = sessions.length

  return (
    <section className="mt-6">
      <h2 className="font-bdo text-xl font-semibold text-white sm:text-2xl">{title}</h2>
      {subtitle && <p className="mt-1 font-bdo text-sm text-neutral-300">{subtitle}</p>}
      {live && (
        <p className="mt-2 font-bdo text-sm text-white/55">
          {anyQr
            ? total > 1
              ? 'Setiap sesi punya QR sendiri. Tunjukkan QR sesi hari itu ke petugas.'
              : 'Tunjukkan QR ini ke petugas saat datang — cukup dari layar HP.'
            : paid
              ? 'Semua sesi sudah check-in atau sudah lewat.'
              : 'QR tiket muncul di sini setelah pembayaran dikonfirmasi.'}
        </p>
      )}

      <ol className="mt-4 space-y-3">
        {sessions.map((s, i) => {
          const stage = stageOf(s, today)
          const label = total > 1 ? `Sesi ${i + 1} dari ${total}` : 'Tiket masuk'
          const showQr = showsQr(s, today)
          const muted = stage === 'cancelled' || stage === 'done' || stage === 'missed'

          return (
            <li
              key={s.id}
              className={`rounded-2xl border p-5 sm:p-6 ${
                stage === 'today' ? 'border-emerald-400/60 bg-emerald-400/[0.07] ring-1 ring-emerald-400/30' : 'border-white/10 bg-white/4'
              } ${muted ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bdo text-xs font-bold tracking-wider text-white/50 uppercase">{label}</span>
                    <span className={`rounded-full px-3 py-1 font-bdo text-xs font-bold ${CHIP[stage].className}`}>{CHIP[stage].label}</span>
                  </div>
                  <p
                    className={`mt-3 flex items-start gap-2 font-bdo text-xl font-bold text-white sm:text-2xl ${stage === 'cancelled' ? 'line-through' : ''}`}
                  >
                    <CalendarDays className="mt-1 h-5 w-5 shrink-0 text-white/50" />
                    {formatLongDate(s.dateKey)}
                  </p>
                  <p className="mt-1 flex items-center gap-2 font-bdo text-lg text-white/80">
                    <Clock className="h-5 w-5 shrink-0 text-white/50" />
                    {s.time} WIB
                  </p>
                  {showUnit && s.unitName && (
                    <p className="mt-1 flex items-center gap-2 font-bdo text-lg font-semibold text-white">
                      <MapPin className="h-5 w-5 shrink-0 text-white/50" />
                      {s.unitName}
                    </p>
                  )}
                  {s.checkedInAt && (
                    <p className="mt-3 inline-flex items-center gap-2 font-bdo text-sm font-semibold text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Check-in {s.checkedInAt}
                    </p>
                  )}
                </div>

                {showQr && (
                  <button
                    type="button"
                    onClick={() => setZoom({ session: s, label })}
                    aria-label={`Perbesar QR ${label}, ${formatLongDate(s.dateKey)}`}
                    className="group flex shrink-0 flex-col items-center gap-2 self-center"
                  >
                    <span className="rounded-2xl bg-white p-3 transition group-hover:scale-[1.02]">
                      <QRCodeSVG value={s.checkInUrl as string} size={148} level="M" />
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-bdo text-xs font-semibold text-white/70 group-hover:text-white">
                      <Maximize2 className="h-3.5 w-3.5" />
                      Ketuk untuk perbesar
                    </span>
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {anyQr && <p className="mt-3 font-bdo text-xs text-white/45">QR tidak bisa dipindai? Sebutkan kode {receiptNumber} ke petugas.</p>}

      {zoom && <QrZoom session={zoom.session} label={zoom.label} receiptNumber={receiptNumber} onClose={() => setZoom(null)} />}
    </section>
  )
}

/** QR layar penuh untuk pemindai petugas. <dialog> bawaan: Esc, fokus, dan backdrop gratis. */
function QrZoom({ session, label, receiptNumber, onClose }: { session: TicketSession; label: string; receiptNumber: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
      aria-label={`QR ${label}, ${formatLongDate(session.dateKey)}`}
      className="m-auto w-[min(92vw,420px)] rounded-3xl bg-white p-0 text-neutral-900 backdrop:bg-black/80"
    >
      <div className="p-6 text-center">
        <p className="font-bdo text-xs font-bold tracking-wider text-neutral-500 uppercase">{label}</p>
        <p className="mt-1 font-bdo text-xl font-bold">{formatLongDate(session.dateKey)}</p>
        <p className="font-bdo text-base text-neutral-600">{session.time} WIB</p>
        {session.unitName && <p className="font-bdo text-base font-semibold text-neutral-800">{session.unitName}</p>}
        <QRCodeSVG value={session.checkInUrl as string} size={320} level="M" className="mx-auto mt-5 h-auto w-full max-w-[320px]" />
        <p className="mt-3 font-bdo text-sm font-semibold tracking-wide">{receiptNumber}</p>
        <p className="mt-2 font-bdo text-xs text-neutral-500">Arahkan layar ke petugas. Sulit terbaca? Naikkan kecerahan layar.</p>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="mt-5 w-full rounded-full bg-neutral-900 py-3 font-bdo text-sm font-bold text-white hover:bg-neutral-800"
        >
          Tutup
        </button>
      </div>
    </dialog>
  )
}
