'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import bola from '@/assets/images/bola-ubsc.avif'
import { routes } from '@/config/routes'

// ===== /coming-soon — port 1:1 dari resources/js/Pages/ComingSoon.tsx =====
// 'use client' di berkas halaman: SELURUH isi halaman ini adalah satu unit animasi motion
// (glow, partikel, judul, preloader). Tidak ada satu pun bagian statis yang layak dipisah menjadi
// leaf, jadi memecahnya hanya menambah berkas tanpa memindahkan satu byte pun keluar dari bundel
// klien. Tidak ada data dan tidak ada fetch.
//
// <Head> Inertia DIHAPUS — judul halaman ada di src/app/coming-soon/page.tsx.
// Inertia <Link> -> next/link, href dari builder routes.home().
// Aset `bola ubsc.avif` -> '@/assets/images/bola-ubsc.avif' (StaticImageData, dipakai lewat .src).
export function ComingSoonPage() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#020202] text-white select-none">
      {/* 1. BACKGROUND EFFECT: Biru Misterius #0369B3 */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Glow Utama Kanan Atas */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
            x: [0, 30, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] right-[-5%] h-screen w-[100vh] rounded-full bg-[#0369B3]/40 blur-[120px] lg:blur-[180px]"
        />

        {/* Glow Pendukung Kiri Bawah */}
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-[-10%] left-[-10%] h-[70vh] w-[70vh] rounded-full bg-[#0369B3]/20 blur-[100px]"
        />
      </div>

      {/* 2. FLOATING PARTICLES (Efek Debu Mewah) */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            // Math.random() dipertahankan verbatim dari Laravel. Di Next komponen klien tetap di-SSR,
            // jadi nilai acak server != klien; suppressHydrationWarning hanya membungkam peringatan
            // hidrasi untuk style acak ini — tidak ada atribut tambahan yang sampai ke DOM.
            suppressHydrationWarning
            initial={{
              opacity: 0,
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%'
            }}
            animate={{
              y: ['-10%', '110%'],
              opacity: [0, 0.4, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 15,
              repeat: Infinity,
              delay: Math.random() * 10
            }}
            className="absolute h-1 w-1 rounded-full bg-blue-200/40 blur-[1px]"
          />
        ))}
      </div>

      {/* 3. NOISE TEXTURE (Kesan Premium) */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-[url('https://grainy-gradients.vercel.app')] opacity-[0.05] mix-blend-overlay" />

      {/* 4. MAIN CONTENT LAYER */}
      <div className="relative z-30 flex h-full flex-col justify-between px-8 py-10 lg:px-20 lg:py-16">
        {/* Header Info */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.2, duration: 1 }}>
          <p className="font-bdo text-[10px] tracking-[0.4em] text-white/50 uppercase lg:text-xs">Official UB Sport Center</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="mt-4 max-w-[280px] font-bdo text-sm leading-relaxed font-light text-gray-300 lg:max-w-md lg:text-lg lg:leading-7"
          >
            Kami sedang meracik sesuatu yang <span className="font-semibold text-[#0369B3]">superior</span>. Nantikan pengalamannya segera.
          </motion.p>
        </motion.div>

        {/* TITLE SECTION: Responsive & No Overflow */}
        <div className="flex flex-col overflow-hidden py-4 lg:overflow-visible">
          <motion.h1
            initial={{ y: '100%', skewY: 7, opacity: 0 }}
            animate={{ y: 0, skewY: 0, opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-clash text-[clamp(3.5rem,14vw,16rem)] leading-[0.8] font-extrabold tracking-tighter text-white"
          >
            COMING
          </motion.h1>

          <div className="flex items-center gap-1 sm:gap-3 lg:gap-5">
            <motion.h1
              initial={{ y: '100%', skewY: 7, opacity: 0 }}
              animate={{ y: 0, skewY: 0, opacity: 1 }}
              transition={{ duration: 1.2, delay: 2, ease: [0.16, 1, 0.3, 1] }}
              className="font-clash text-[clamp(3.5rem,14vw,16rem)] leading-[0.8] font-extrabold tracking-tighter text-white"
            >
              SO
            </motion.h1>

            {/* Bola Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 2.2, stiffness: 80 }}
              className="relative flex items-center justify-center"
            >
              <motion.img
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                src={bola.src}
                alt="bola"
                className="w-[11vw] max-w-48 min-w-14 object-contain drop-shadow-[0_0_40px_rgba(3,105,179,0.5)]"
                draggable={false}
              />
            </motion.div>

            <motion.h1
              initial={{ y: '100%', skewY: 7, opacity: 0 }}
              animate={{ y: 0, skewY: 0, opacity: 1 }}
              transition={{ duration: 1.2, delay: 2.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-clash text-[clamp(3.5rem,14vw,16rem)] leading-[0.8] font-extrabold tracking-tighter text-white"
            >
              N!
            </motion.h1>
          </div>
        </div>

        {/* Footer Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8 }}
          className="flex items-center justify-between"
        >
          <Link
            href={routes.home()}
            className="group flex items-center gap-3 font-bdo text-[10px] font-medium tracking-widest text-gray-500 uppercase transition-colors hover:text-white lg:text-xs"
          >
            <span className="h-px w-6 bg-gray-800 transition-all group-hover:w-10 group-hover:bg-white" />
            Kembali ke Beranda
          </Link>

          <div className="hidden font-bdo text-[10px] tracking-[0.3em] text-white/20 uppercase md:block">Est. 2026 — UB Sport Center</div>
        </motion.div>
      </div>

      {/* 5. LUXURY PRELOADER OVERLAY */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: '-100%' }}
        transition={{ duration: 1.2, delay: 1.5, ease: [0.85, 0, 0.15, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      >
        <div className="relative overflow-hidden p-8">
          <motion.img
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            src="/ubsc.png"
            alt="Logo"
            className="w-28 lg:w-40"
            draggable={false}
          />
          <motion.div
            initial={{ x: '-150%' }}
            animate={{ x: '150%' }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0 skew-x-12 bg-linear-to-r from-transparent via-white/20 to-transparent"
          />
        </div>
      </motion.div>
    </div>
  )
}
