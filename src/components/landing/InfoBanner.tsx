'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { MEMBERSHIP_ENABLED } from '@/config/features'

/**
 * Port dari resources/js/Components/Landing/InfoBanner.tsx (Laravel Inertia).
 *
 * Perubahan terhadap sumber:
 * - `usePage<PageProps>().props.announcements` -> prop `announcements?: string[]` (data publik Inertia jadi prop).
 * - `framer-motion` -> `motion/react` (API identik: AnimatePresence mode="wait", rotasi 4 detik, dua useEffect).
 * - Class v3->v4: `z-[55]` -> `z-55`.
 *
 * Logika fallback + rotasi dipertahankan apa adanya.
 */
const ANNOUNCEMENTS_FALLBACK = [
  'Jadwal Zumba 10.00-12.00 ✦ Jadwal Aerobik Saat ini Sedang Tutup',
  // Promo membership ikut saklar NEXT_PUBLIC_MEMBERSHIP_ENABLED (config/features.ts).
  ...(MEMBERSHIP_ENABLED ? ['Dapatkan Diskon 20% untuk Pendaftaran Member Tahunan Bulan Ini'] : []),
  'UB Sport Center Buka Setiap Hari: 06.00 - 21.00 WIB'
]

export function InfoBanner({ announcements }: { announcements?: string[] }) {
  const messages = announcements && announcements.length > 0 ? announcements : ANNOUNCEMENTS_FALLBACK

  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [messages.length])

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [messages.length])

  return (
    <div className="fixed top-0 right-0 left-0 z-55 flex h-8 w-full items-center justify-center overflow-hidden border-b border-white/10 bg-[#252525] px-4">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -15, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="text-center font-clash text-[11px] font-semibold tracking-wide text-white/80 lg:text-[16px]"
        >
          {messages[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
