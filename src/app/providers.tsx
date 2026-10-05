'use client'

import { AuthProvider } from '@/context/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactLenis, useLenis } from 'lenis/react'
import { usePathname } from 'next/navigation'
import type React from 'react'
import { useEffect, useState } from 'react'

// ===== Reset scroll saat pindah halaman =====
// Padanan `router.on('navigate', () => lenis.scrollTo(0, { immediate, force }))` di app.tsx Laravel.
// Next mengembalikan window ke atas pada tiap navigasi, tetapi Lenis masih meng-ease menuju posisi
// halaman sebelumnya dan menang di frame berikutnya — pada halaman pendek itu berarti mendarat di footer.
//
// usePathname (BUKAN useSearchParams) sengaja dipakai: ia tidak memaksa route menjadi dinamis, jadi
// ISR per halaman tetap hidup. Komponen ini tidak merender apa pun.
function ScrollReset() {
  const lenis = useLenis()
  const pathname = usePathname()

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true })
  }, [lenis, pathname])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1
          }
        }
      })
  )

  // ReactLenis dengan `root`: menempel ke documentElement/window, TIDAK menambah wrapper DOM —
  // syarat supaya struktur halaman tetap identik dengan Laravel. Opsi persis app.tsx:
  // `duration` sengaja tidak diisi (mati saat `lerp` ada), lerp 0.14, smoothWheel true, syncTouch false.
  // JANGAN mengimpor 'lenis/dist/lenis.css': aturan .lenis sudah ada di src/styles/ubsc-bespoke.css:22-36.
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ReactLenis root options={{ lerp: 0.14, smoothWheel: true, syncTouch: false }}>
          <ScrollReset />
          {children}
        </ReactLenis>
      </AuthProvider>
    </QueryClientProvider>
  )
}
