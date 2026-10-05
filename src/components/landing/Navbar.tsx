'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  LogOut,
  User as UserIcon,
  ChevronDown,
  CreditCard,
  MessageCircle,
  Dumbbell,
  CalendarCheck,
  Wallet,
  X as CloseIcon
} from 'lucide-react'
import square from '@/assets/hero/square.png'
import { UnverifiedEmailBanner } from '@/components/auth/EmailVerification'
import { InfoBanner } from '@/components/landing/InfoBanner'
import { AuthModal } from '@/components/landing/AuthModal'
import { ProfileModal } from '@/components/user-dashboard/ProfileModal'
import { PaymentHistoryModal } from '@/components/user-dashboard/PaymentHistoryModal'
import { GymMembershipModal } from '@/components/user-dashboard/GymMembershipModal'
import { useAuth } from '@/context/AuthContext'
import { routes } from '@/config/routes'
import axiosInstance from '@/lib/axios'
import { cn } from '@/lib/utils'
import type { ApiSuccess, PendingPaymentDto } from '@/types/contracts/contracts'
import type { AuthUser } from '@/types/api/auth'
import './navbar.css'

/* ====================================================================
   TYPES
==================================================================== */
type UserModal = 'profile' | 'history' | 'membership'

// avatar tidak ada di AuthUser (/me hanya id/name/email/role) — field ini
// dibaca lewat tipe lokal (cast) sampai backend menambahkannya. Jangan ubah AuthContext.
type UserWithAvatar = AuthUser & { avatar_url?: string | null; avatar?: string | null }

interface NavItem {
  label: string
  number: string
  href: string
}

interface NavbarProps {
  activeSection?: string
  showInfoBanner?: boolean
  // announcements diteruskan ke InfoBanner. Di Laravel InfoBanner membacanya sendiri dari usePage;
  // di Next data publik diambil di Server Component beranda lalu diturunkan sebagai prop.
  announcements?: string[]
}

/* ====================================================================
   CONSTANTS
==================================================================== */
const NAV_ITEMS: NavItem[] = [
  { label: 'Home', number: '01', href: '/' },
  { label: 'About', number: '02', href: '/about' },
  { label: 'News', number: '03', href: '/news' },
  { label: 'Facilities', number: '04', href: '/facilities' },
  { label: 'Pricing', number: '05', href: '/pricing' },
  { label: 'Booking', number: '06', href: '/booking' }
]

/* ponytail: the adaptive-colour engine that lived here (canvas dominant-colour
   sampling + rAF RGB lerp + IntersectionObserver over every section) is gone.
   Its only output was `_displayColor`, which nothing rendered — so it was
   re-rendering this whole component at 60fps to compute a value no one read. */

/* ====================================================================
   KINETIC NAV LINK
==================================================================== */
interface KineticNavLinkProps {
  item: NavItem
  isActive: boolean
}

function KineticNavLink({ item, isActive }: KineticNavLinkProps) {
  const activeCol = 'rgba(255,255,255,0.95)'
  const idleCol = 'rgba(255,255,255,0.65)'
  const supCol = 'rgba(255,255,255,0.35)'

  return (
    <a
      href={item.href}
      className={`kinetic-nav-link ${isActive ? 'kinetic-nav-active' : ''} font-clash text-[clamp(0.75rem,1vw,16px)] tracking-wide`}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '1px',
        color: isActive ? activeCol : idleCol,
        textDecoration: 'none',
        outline: 'none',
        userSelect: 'none',
        transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        letterSpacing: '0.02em'
      }}
    >
      <span
        style={{
          display: 'inline-block',
          overflow: 'hidden',
          position: 'relative',
          lineHeight: 1.15
        }}
      >
        <span className="knav-primary" style={{ display: 'block' }}>
          {item.label}
        </span>
        <span
          className="knav-clone"
          aria-hidden="true"
          style={{
            display: 'block',
            position: 'absolute',
            inset: 0,
            transform: 'translateY(-110%)',
            color: isActive ? activeCol : 'rgba(255,255,255,0.85)'
          }}
        >
          {item.label}
        </span>
      </span>
      <sup
        style={{
          display: 'inline-block',
          overflow: 'hidden',
          position: 'relative',
          fontSize: '10px',
          lineHeight: 1,
          verticalAlign: 'super',
          color: supCol,
          marginLeft: '1px'
        }}
      >
        <span className="knav-num-primary" style={{ display: 'block' }}>
          {item.number}
        </span>
        <span
          className="knav-num-clone"
          aria-hidden="true"
          style={{
            display: 'block',
            position: 'absolute',
            inset: 0,
            transform: 'translateY(110%)'
          }}
        >
          {item.number}
        </span>
      </sup>
    </a>
  )
}

/* ====================================================================
   MAIN COMPONENT
==================================================================== */
export function Navbar({ activeSection = 'Home', showInfoBanner = true, announcements }: NavbarProps) {
  /* ── Auth state ── */
  const { user, logout } = useAuth()
  const isLoggedIn = !!user

  /* ── Pending payment (per audit: TanStack Query, bukan usePage) ── */
  const { data: pendingPayment } = useQuery({
    queryKey: ['pending-payment'],
    queryFn: async () => {
      // Guest tak pernah menembaknya (enabled). Balasan boleh null — pill disembunyikan.
      const res = await axiosInstance.get<ApiSuccess<PendingPaymentDto | null>>('/customer/pending-payment')
      return res.data.data
    },
    enabled: !!user,
    retry: false
  })

  /* ── UI state ── */
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  /* ── Modal state (from Navbar__1_.tsx) ── */
  const [authOpen, setAuthOpen] = useState(false)
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login')
  const [activeUserModal, setActiveUserModal] = useState<UserModal | null>(null)
  const [avatarFailed, setAvatarFailed] = useState(false)

  /* ── Navbar & Background Scroll Behavior ── */
  const [navHidden, setNavHidden] = useState(false)
  // showBg dipertahankan persis dari Laravel: setShowBg TIDAK pernah dipanggil di sumber — opacity
  // overlay digerakkan imperatif lewat getElementById('ubsc-nav-bg-overlay').style.opacity di handler
  // scroll, jadi state ini selalu false. Quirk sumber, di-port apa adanya; jangan "diperbaiki" (mengubah
  // ke setShowBg akan menggandakan mekanisme dan bisa menggeser perilaku).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showBg, setShowBg] = useState(false)
  const lastScrollY = useRef(0)
  const lastScrollUp = useRef(false)
  const ticking = useRef(false)
  const bgOpacity = useRef(0)

  useEffect(() => {
    const update = () => {
      const y = window.scrollY
      const scrollingUp = y < lastScrollY.current
      const isAtTop = y < 50

      if (y !== lastScrollY.current) {
        lastScrollUp.current = scrollingUp
      }

      const targetOpacity = y > 50 ? 1 : 0
      if (targetOpacity !== bgOpacity.current) {
        bgOpacity.current = targetOpacity
        const overlay = document.getElementById('ubsc-nav-bg-overlay')
        if (overlay) {
          overlay.style.opacity = targetOpacity.toString()
        }
      }

      if (isAtTop) {
        setNavHidden(false)
      } else if (scrollingUp && lastScrollUp.current) {
        setNavHidden(false)
      } else if (!scrollingUp) {
        setNavHidden(true)
      }

      lastScrollY.current = y
      ticking.current = false
    }

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(update)
        ticking.current = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── Lock body scroll when mobile menu open ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  /* ── Click-outside closes desktop dropdown ── */
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  /* ── Tautan email "Lihat Kartu Member" (?kartu=1): buka modal Membership Gym begitu sesi siap ── */
  useEffect(() => {
    if (!user) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('kartu') !== '1') return
    setActiveUserModal('membership')
    window.history.replaceState(null, '', window.location.pathname)
  }, [user])

  /* ── Auto-open auth modal from URL ?auth=login|register ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const authParam = params.get('auth')
    if (authParam === 'login' || authParam === 'register') {
      setAuthInitialTab(authParam)
      setAuthOpen(true)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  /* ==============================================================
     DERIVED DISPLAY VALUES
  ============================================================== */
  const firstName = user?.name?.split(' ')[0] ?? 'User'
  const initials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : ''
  // avatar dibaca lewat cast tipe lokal; sumber lengkapnya GET /api/customer/profile (dipakai ProfileModal).
  const userAvatar = (user as UserWithAvatar | null)?.avatar_url ?? (user as UserWithAvatar | null)?.avatar ?? null

  useEffect(() => {
    setAvatarFailed(false)
  }, [userAvatar])

  /* ==============================================================
     RENDER
  ============================================================== */
  return (
    <>
      {showInfoBanner && <InfoBanner announcements={announcements} />}
      <UnverifiedEmailBanner />

      {/* Wrapper: background + navbar move as ONE unit */}
      <div
        id="ubsc-nav-wrapper"
        className={cn('ubsc-nav-grain', 'fixed right-0 left-0 flex flex-col', navHidden ? '-translate-y-full' : 'translate-y-0')}
        style={{
          top: showInfoBanner ? 27 : 14,
          height: '100px',
          zIndex: 50,
          transition: 'transform 0.45s cubic-bezier(0.65, 0, 0.35, 1)'
        }}
      >
        {/* Background overlay — stays inside wrapper, moves with navbar */}
        <div
          id="ubsc-nav-bg-overlay"
          className="ubsc-liquid-glass pointer-events-none absolute inset-0"
          style={{
            opacity: showBg ? 1 : 0,
            transition: 'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div className="ubsc-lg-effect" />
          <div className="ubsc-lg-tint" />
          <div className="ubsc-lg-shine" />
        </div>

        {/* Navbar content */}
        <nav
          className="relative z-1 flex items-center justify-between px-8 py-6 lg:px-12"
          style={{ position: 'relative', height: '100px', zIndex: 1 }}
        >
          {/* ── Logo ── */}
          <div className="flex items-center gap-2">
            <a href={routes.home()} className="ubsc-logo-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element -- logo UBSC dari public/, aset desain (bukan gambar CMS), bukan next/image */}
              <img src="/ubsc.png" alt="UB Sport Center Logo" className="ubsc-logo h-8 w-auto md:h-12" style={{ position: 'relative', zIndex: 2 }} />
            </a>
          </div>

          {/* ── Desktop navigation links ── */}
          <ul className="hidden items-center gap-6 min-[1100px]:flex xl:gap-12" style={{ position: 'relative', zIndex: 2 }}>
            {NAV_ITEMS.map((item) => (
              <li key={item.number}>
                <KineticNavLink item={item} isActive={item.label === activeSection} />
              </li>
            ))}
          </ul>

          {/* ── Auth CTA ── */}
          <div className="ubsc-auth-section relative" style={{ zIndex: 101 }}>
            {isLoggedIn ? (
              <div className="relative hidden min-[1100px]:block" ref={dropdownRef}>
                <div className="ubsc-cta-wrap origin-right scale-90 xl:scale-100">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="ubsc-cta-btn group flex cursor-pointer items-stretch overflow-hidden rounded-lg bg-white"
                  >
                    {/* Avatar */}
                    <div className="mt-1 mb-1 ml-1 w-14 shrink-0 self-stretch overflow-hidden rounded-md">
                      {userAvatar && !avatarFailed ? (
                        // eslint-disable-next-line @next/next/no-img-element -- avatar user (URL runtime) dgn onError fallback, bukan next/image
                        <img
                          src={userAvatar}
                          alt={firstName}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarFailed(true)}
                        />
                      ) : (
                        <div className="ubsc-avatar-bg flex h-full w-full items-center justify-center">
                          <span className="font-clash text-xl font-bold text-white/90 select-none">{initials}</span>
                        </div>
                      )}
                    </div>

                    {/* Name / Email / Role */}
                    <div className="flex min-w-0 flex-col justify-center px-3 py-2 text-left">
                      <div className="flex items-baseline gap-0.5">
                        <span className="font-clash text-[10px] font-normal text-slate-400/80">Good day, </span>
                        <span className="max-w-[80px] truncate font-clash text-sm leading-tight font-semibold text-slate-700">{firstName}</span>
                      </div>
                      <p className="mt-0.5 max-w-[96px] truncate font-clash text-[10px] font-medium text-slate-500">{user?.email}</p>
                      <p className="-mt-0.5 max-w-[80px] truncate font-clash text-[10px] font-medium text-slate-400/70">{user?.role ?? 'Member'}</p>
                    </div>

                    {/* Chevron */}
                    <div className="flex items-center pr-3">
                      <ChevronDown
                        size={20}
                        className={cn('text-slate-400 transition-all duration-300 ease-out', dropdownOpen && 'rotate-180 text-slate-600')}
                      />
                    </div>
                  </button>
                </div>

                {/* ── Premium Dropdown ── */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -6,
                        scale: 0.97
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1
                      }}
                      exit={{
                        opacity: 0,
                        y: -6,
                        scale: 0.97
                      }}
                      transition={{
                        duration: 0.22,
                        ease: [0.16, 1, 0.3, 1]
                      }}
                      className="absolute top-full right-0 mt-3 overflow-hidden"
                      style={{
                        width: '220px',
                        background: 'linear-gradient(180deg, rgba(15, 17, 35, 0.98) 0%, rgba(10, 12, 25, 0.99) 100%)',
                        backdropFilter: 'blur(32px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: `
                          0 0 0 1px rgba(255, 255, 255, 0.04) inset,
                          0 8px 32px rgba(0, 0, 0, 0.6),
                          0 16px 64px rgba(0, 0, 0, 0.4)
                        `
                      }}
                    >
                      {/* Top gradient accent */}
                      <div
                        className="h-px w-full"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.5) 50%, transparent 100%)'
                        }}
                      />

                      {/* User Info Header */}
                      <div className="px-4 pt-4 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0">
                            <div
                              className="absolute inset-0 rounded-lg"
                              style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
                              }}
                            />
                            {userAvatar && !avatarFailed ? (
                              // eslint-disable-next-line @next/next/no-img-element -- avatar user (URL runtime) dgn onError fallback, bukan next/image
                              <img
                                src={userAvatar}
                                alt={firstName}
                                className="relative z-10 h-full w-full rounded-lg object-cover"
                                referrerPolicy="no-referrer"
                                onError={() => setAvatarFailed(true)}
                              />
                            ) : (
                              <div className="relative z-10 flex h-full w-full items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-600">
                                <span className="font-clash text-base font-bold text-white">{initials}</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-clash text-sm font-bold text-white">{user?.name}</p>
                            <p className="mt-0.5 truncate font-clash text-[11px] text-white/50">{user?.email}</p>
                            {user?.emailVerifiedAt === null && (
                              <p className="mt-1 font-clash text-[10px] font-semibold text-amber-300">Email belum diverifikasi</p>
                            )}
                          </div>
                        </div>
                        {/* Role badge */}
                        <div className="mt-3">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-1 font-clash text-[10px] font-semibold"
                            style={{
                              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.15))',
                              color: '#a78bfa',
                              border: '1px solid rgba(139, 92, 246, 0.3)'
                            }}
                          >
                            {user?.role ?? 'Member'}
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="mx-4 h-px bg-white/5" />

                      {/* Action Menu */}
                      <div className="flex flex-col gap-0.5 px-2 py-2">
                        <motion.button
                          type="button"
                          whileHover={{
                            x: 3,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                          }}
                          transition={{
                            duration: 0.15
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setDropdownOpen(false)
                            setActiveUserModal('profile')
                          }}
                          className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-linear-to-br from-indigo-500/20 to-purple-500/20 transition-all group-hover:border-indigo-500/40">
                            <UserIcon size={15} className="text-indigo-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-clash text-sm font-medium text-white/90">My Profile</p>
                          </div>
                          <svg
                            className="h-4 w-4 text-white/30 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-white/50"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>

                        <motion.button
                          type="button"
                          whileHover={{
                            x: 3,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                          }}
                          transition={{
                            duration: 0.15
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setDropdownOpen(false)
                            setActiveUserModal('history')
                          }}
                          className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-linear-to-br from-emerald-500/20 to-teal-500/20 transition-all group-hover:border-emerald-500/40">
                            <CreditCard size={15} className="text-emerald-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-clash text-sm font-medium text-white/90">Payment History</p>
                          </div>
                          <svg
                            className="h-4 w-4 text-white/30 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-white/50"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>

                        <motion.button
                          type="button"
                          whileHover={{
                            x: 3,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                          }}
                          transition={{
                            duration: 0.15
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setDropdownOpen(false)
                            setActiveUserModal('membership')
                          }}
                          className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-linear-to-br from-amber-500/20 to-orange-500/20 transition-all group-hover:border-amber-500/40">
                            <Dumbbell size={15} className="text-amber-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-clash text-sm font-medium text-white/90">Gym Membership</p>
                          </div>
                          <svg
                            className="h-4 w-4 text-white/30 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-white/50"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>

                        <a
                          href={routes.bookingHistory()}
                          onClick={() => setDropdownOpen(false)}
                          className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 hover:bg-white/5"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-linear-to-br from-sky-500/20 to-cyan-500/20 transition-all group-hover:border-sky-500/40">
                            <CalendarCheck size={15} className="text-sky-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-clash text-sm font-medium text-white/90">Riwayat Booking</p>
                            {pendingPayment && (
                              <p className="font-bdo text-[11px] text-amber-300">
                                {pendingPayment.awaiting ? 'Menunggu verifikasi' : 'Ada pembayaran belum selesai'}
                              </p>
                            )}
                          </div>
                          {pendingPayment && <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />}
                        </a>

                        <motion.button
                          type="button"
                          whileHover={{
                            x: 3,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                          }}
                          transition={{
                            duration: 0.15
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setDropdownOpen(false)
                            window.open('https://wa.me/6285280809080', '_blank')
                          }}
                          className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-green-500/20 bg-linear-to-br from-green-500/20 to-emerald-500/20 transition-all group-hover:border-green-500/40">
                            <MessageCircle size={15} className="text-green-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-clash text-sm font-medium text-white/90">Contact Us</p>
                          </div>
                          <svg
                            className="h-4 w-4 text-white/30 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-white/50"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>
                      </div>

                      {/* Divider */}
                      <div className="mx-4 h-px bg-white/5" />

                      {/* Logout Button */}
                      <div className="mb-1 px-2 py-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false)
                            logout()
                          }}
                          className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 transition-all duration-150 hover:scale-[1.02]"
                          style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                          }}
                        >
                          <LogOut size={14} className="text-red-400" />
                          <span className="font-clash text-sm font-medium text-red-400">Sign Out</span>
                        </button>
                      </div>

                      {/* Bottom gradient accent */}
                      <div
                        className="h-1 rounded-b-xl"
                        style={{
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /*
               * ── LOGGED OUT: "Lets Get Started" card ──
               */
              <div className="ubsc-cta-wrap hidden origin-right scale-90 min-[1100px]:flex xl:scale-100">
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="ubsc-cta-btn group flex cursor-pointer items-stretch overflow-hidden rounded-lg bg-white"
                >
                  <div className="mt-1 mb-1 ml-1 w-14 shrink-0 self-stretch overflow-hidden rounded-md">
                    {/* eslint-disable-next-line @next/next/no-img-element -- aset desain dari src/assets (StaticImageData), bukan gambar CMS, bukan next/image */}
                    <img src={square.src} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center px-3 py-2 text-left">
                    <p className="font-clash text-sm leading-tight font-semibold text-navy-900">Lets Get Started</p>
                    <p className="font-clash text-[12px] font-medium text-navy-900/80">Register Now</p>
                    <p className="-mt-0.5 font-clash text-[10px] text-navy-900/40">Guest</p>
                  </div>
                  <div className="flex items-center pr-3">
                    <ArrowRight size={22} className="text-navy-900 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* ── Hamburger (mobile) ── */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex flex-col items-end justify-center gap-[6px] p-1 min-[1100px]:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            style={{ position: 'relative', zIndex: 2 }}
          >
            <span
              className={cn('block h-[2px] w-7 rounded-sm bg-white/90 transition-all duration-300', mobileOpen && 'w-6 translate-y-[4px] rotate-45')}
              style={{
                boxShadow: '0 0 4px rgba(255,255,255,0.4)'
              }}
            />
            <span
              className={cn(
                'block h-[2px] w-5 rounded-sm bg-white/90 transition-all duration-300',
                mobileOpen && 'w-6 translate-y-[-4px] -rotate-45'
              )}
              style={{
                boxShadow: '0 0 4px rgba(255,255,255,0.4)'
              }}
            />
          </button>
        </nav>
      </div>

      {/* ── Mobile overlay backdrop ── */}
      <div
        onClick={() => setMobileOpen(false)}
        className={cn(
          'fixed inset-0 z-30 transition-opacity duration-300 min-[1100px]:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        style={{
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)'
        }}
      />

      {/* ── Mobile slide-down menu ── */}
      <div
        className={cn(
          'fixed right-0 left-0 z-40 transition-transform duration-500 ease-out min-[1100px]:hidden',
          mobileOpen ? 'translate-y-0' : '-translate-y-full'
        )}
        style={{
          top: showInfoBanner ? 32 : 14,
          background: 'rgba(8,9,20,0.97)',
          backdropFilter: 'blur(24px) saturate(130%)',
          WebkitBackdropFilter: 'blur(24px) saturate(130%)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 16px 64px rgba(0,0,0,0.55)'
        }}
      >
        <div className="h-[80px] md:h-[104px]" />
        <div className="h-px w-full bg-white/10" />

        <ul className="flex flex-col px-8 pt-0">
          {NAV_ITEMS.map((item, index) => (
            <li key={item.number}>
              <a
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-baseline justify-between py-5 font-clash text-xl transition-colors',
                  item.label === activeSection ? 'text-white' : 'text-white/45 hover:text-white/75'
                )}
              >
                <span
                  style={{
                    textShadow: '0 1px 8px rgba(0,0,0,0.9)'
                  }}
                >
                  {item.label}
                </span>
                <sup className="text-[10px] text-white/30">{item.number}</sup>
              </a>
              {index < NAV_ITEMS.length - 1 && <div className="h-px w-full" />}
            </li>
          ))}
        </ul>

        <div className="mx-8 mt-0 h-px bg-white/10" />

        <div className="px-[clamp(1.25rem,4vw,2rem)] py-[clamp(0.75rem,3vw,1.5rem)]">
          {isLoggedIn ? (
            <div className="flex flex-col gap-2">
              {/* Mobile: profile card */}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false)
                  setActiveUserModal('profile')
                }}
                className="group flex w-full items-stretch overflow-hidden rounded-xl bg-white"
              >
                <div className="m-1.5 h-[clamp(3rem,10vw,5rem)] w-[clamp(3rem,10vw,5rem)] shrink-0 overflow-hidden rounded-lg">
                  {userAvatar && !avatarFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element -- avatar user (URL runtime) dgn onError fallback, bukan next/image
                    <img
                      src={userAvatar}
                      alt={firstName}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : (
                    <div className="ubsc-avatar-bg flex h-full w-full items-center justify-center">
                      <span className="font-clash text-2xl font-bold text-white/90 select-none">{initials}</span>
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center px-[clamp(0.5rem,2vw,0.875rem)] py-2 text-left">
                  <p className="font-clash text-[clamp(0.75rem,3.5vw,1rem)] leading-tight font-semibold text-navy-900">{firstName}</p>
                  <p className="mt-0.5 font-clash text-[clamp(0.625rem,2.8vw,0.875rem)] font-medium text-navy-900/80">{user?.role ?? 'Member'}</p>
                  <p className="-mt-0.5 truncate font-clash text-[clamp(0.55rem,2.4vw,0.75rem)] text-navy-900/40">{user?.email}</p>
                </div>
                <div className="flex items-center pr-[clamp(0.5rem,2vw,0.875rem)]">
                  <ArrowRight className="h-[clamp(1rem,4vw,1.25rem)] w-[clamp(1rem,4vw,1.25rem)] text-navy-900 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false)
                  logout()
                }}
                className="flex items-center gap-3 rounded-xl border border-red-500/20 px-4 py-3 font-clash text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/15"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          ) : (
            /* Mobile: guest card */
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false)
                setAuthOpen(true)
              }}
              className="group flex w-full items-stretch overflow-hidden rounded-xl bg-white"
            >
              <div className="m-1.5 aspect-square w-[clamp(3rem,10vw,5rem)] shrink-0 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element -- aset desain dari src/assets (StaticImageData), bukan gambar CMS, bukan next/image */}
                <img src={square.src} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col justify-center px-[clamp(0.5rem,2vw,0.875rem)] py-2 text-left">
                <p className="font-clash text-[clamp(0.75rem,3.5vw,1rem)] leading-tight font-semibold text-navy-900">Lets Get Started</p>
                <p className="mt-0.5 font-clash text-[clamp(0.625rem,2.8vw,0.875rem)] text-navy-900/80">Register Now</p>
                <p className="-mt-0.5 font-clash text-[clamp(0.55rem,2.4vw,0.75rem)] text-navy-900/40">Guest</p>
              </div>
              <div className="ml-auto flex items-center pr-[clamp(0.5rem,2vw,0.875rem)]">
                <ArrowRight className="h-[clamp(1rem,4vw,1.25rem)] w-[clamp(1rem,4vw,1.25rem)] text-navy-900 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ── Auth Modal (guest only) ── */}
      {!isLoggedIn && <AuthModal open={authOpen} initialTab={authInitialTab} onClose={() => setAuthOpen(false)} />}

      {/* ── Unfinished payment reminder (customers only) ── */}
      {isLoggedIn && pendingPayment && <PendingPaymentPill payment={pendingPayment} />}

      {/* ── User Dashboard Modals (authenticated only) ── */}
      {activeUserModal === 'profile' && <ProfileModal onClose={() => setActiveUserModal(null)} />}
      {activeUserModal === 'history' && <PaymentHistoryModal onClose={() => setActiveUserModal(null)} />}
      {activeUserModal === 'membership' && <GymMembershipModal onClose={() => setActiveUserModal(null)} />}
    </>
  )
}

/**
 * A customer can close the tab on the transfer screen and never find the URL
 * again — there is no dashboard to stumble back into. This follows them on
 * every page until the transfer is resolved. Dismissable per page load only;
 * it comes back on the next one, which is the point.
 */
function PendingPaymentPill({ payment }: { payment: PendingPaymentDto }) {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null

  const label = payment.awaiting ? 'Bukti pembayaran sedang diverifikasi' : `Selesaikan pembayaran ${payment.receipt ?? ''}`.trim()
  const extra = payment.count > 1 ? ` · ${payment.count} reservasi` : ''

  return (
    <div className="fixed right-4 bottom-4 left-4 z-120 flex justify-center sm:right-6 sm:bottom-6 sm:left-auto">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-amber-400/30 bg-[#12161d]/95 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
          <Wallet size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bdo text-[13px] font-semibold text-white">
            {label}
            <span className="text-white/50">{extra}</span>
          </p>
          <p className="font-bdo text-[11px] text-white/55">
            {payment.awaiting
              ? 'Slot Anda ditahan sampai admin memutuskan.'
              : `Transfer tepat Rp ${payment.total.toLocaleString('id-ID')} sebelum waktu habis.`}
          </p>
        </div>
        <a href={payment.url} className="shrink-0 rounded-full bg-accent-red px-3.5 py-2 font-bdo text-[12px] font-bold text-white hover:opacity-90">
          {payment.awaiting ? 'Lihat' : 'Bayar'}
        </a>
        <button type="button" aria-label="Sembunyikan" onClick={() => setHidden(true)} className="shrink-0 text-white/30 hover:text-white/70">
          <CloseIcon size={14} />
        </button>
      </div>
    </div>
  )
}
