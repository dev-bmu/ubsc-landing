import type { ReactNode } from 'react'
import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'

// Port 1:1 dari resources/js/Components/Legal/LegalShell.tsx.
// Server Component: tanpa hook, tanpa handler — hanya kerangka dokumen legal.
// <Head title> Inertia DIHAPUS; metadata tinggal di route shell (src/app/syarat-ketentuan/page.tsx dkk).
export function LegalShell({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24 sm:px-10">
        <h1 className="font-bdo text-3xl font-semibold text-black sm:text-4xl">{title}</h1>
        <p className="mt-2 font-bdo text-sm text-gray-400">Terakhir diperbarui: {updated}</p>
        <div className="prose mt-8 max-w-none font-bdo prose-slate prose-headings:font-bdo prose-headings:font-semibold prose-a:text-accent-red">
          {children}
        </div>
      </main>
      <Footer />
    </>
  )
}
