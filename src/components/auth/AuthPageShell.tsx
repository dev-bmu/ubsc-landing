import type { ReactNode } from 'react'
import { routes } from '@/config/routes'

/**
 * Kerangka halaman akun mandiri — verifikasi email, lupa password, reset password (tautan dari email).
 * Kartu putih di tengah dengan gaya yang sama dengan modal login. Sengaja tanpa Navbar: halaman ini
 * dibuka dari email dan satu-satunya tugasnya menyelesaikan satu langkah.
 */
export function AuthPageShell({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0E12] px-4 py-16">
      <div className="w-full max-w-md rounded-[20px] bg-white p-7 shadow-2xl sm:p-9">
        <a href={routes.home()} className="inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo UBSC dari public/, aset desain (bukan gambar CMS) */}
          <img src="/ubsc-blue.png" alt="UB Sport Center" className="h-10 w-auto" />
        </a>
        <h1 className="mt-6 font-clash text-2xl font-semibold text-[#0B1E3B]">{title}</h1>
        {description && <p className="mt-2 font-bdo text-sm leading-relaxed text-slate-500">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </main>
  )
}

export const authLabelCls = 'mb-1.5 block font-bdo text-[13px] font-medium text-[#1f2937]'

export const authInputCls =
  'h-11 w-full rounded-[9px] bg-[#f5f6f8] px-3.5 font-bdo text-[15px] text-[#1f2937] outline-hidden placeholder:text-[#8d8d8d] focus:bg-white focus:ring-2 focus:ring-[#15678D]/25'

export const authButtonCls =
  'flex h-11 w-full items-center justify-center rounded-[11px] bg-linear-to-r from-[#002244] to-[#15678D] font-bdo text-[15px] font-medium text-white shadow-[0_14px_24px_rgba(0,34,68,0.24)] transition hover:opacity-95 disabled:opacity-60'

export function AuthNotice({ tone, children }: { tone: 'ok' | 'bad' | 'info'; children: ReactNode }) {
  const cls = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    bad: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-sky-200 bg-sky-50 text-sky-800'
  }[tone]
  return <div className={`rounded-xl border px-4 py-3 font-bdo text-sm leading-relaxed ${cls}`}>{children}</div>
}
