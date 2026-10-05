'use client'

/**
 * AuthModal.tsx — port dari resources/js/Components/Landing/AuthModal.tsx.
 *
 * CSS entrance (auth-modal-*, auth-stagger, auth-visual-vignette, dst) sudah ada di
 * src/styles/ubsc-bespoke.css (di-port Fase 2 dari resources/css/app.css). Komentar sumber tentang
 * meng-@import "auth-modal.css" terpisah SUDAH BASI — di Laravel pun class-nya menyatu di app.css.
 *
 * Perubahan terhadap sumber:
 *   - Inertia `useForm().post(route('login'|'register'))` -> react-hook-form + TanStack useMutation ke
 *     AUTH_ENDPOINTS (login & register sama-sama balas { accessToken, user }; register auto-login).
 *     Sukses -> useAuth().login(accessToken, user) lalu onClose. Error envelope { fields } -> setError
 *     per field lewat extractApiError.
 *   - `<a href={route('password.request')}>` -> `<a href={routes.forgotPassword()}>` (anchor, bukan
 *     next/link: Laravel pun anchor full-reload, dan halaman /forgot-password baru dibuat Fase 5/6).
 *   - `window.location.href = '/auth/google'` -> GOOGLE_AUTH_URL ('/api/auth/customer/google').
 *   - 6 classPair v3->v4 (bg-gradient-to-r->bg-linear-to-r ×2, z-[1]->z-1, z-[200]->z-200,
 *     outline-none->outline-hidden, normalisasi arbitrary value modal card). data-lenis-prevent tetap.
 */

import { InputError } from '@/components/InputError'
import { AUTH_ENDPOINTS, GOOGLE_AUTH_URL } from '@/config/api'
import { routes } from '@/config/routes'
import { useAuth } from '@/context/AuthContext'
import { extractApiError } from '@/lib/applyApiErrors'
import axiosInstance from '@/lib/axios'
import { cn } from '@/lib/utils'
import type { AuthUser } from '@/types/api/auth'
import type { ApiSuccess } from '@/types/contracts/contracts'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, X } from 'lucide-react'
import { type CSSProperties, useEffect, useState } from 'react'
import { type UseFormRegisterReturn, useForm } from 'react-hook-form'

type Tab = 'login' | 'register'

interface Props {
  open: boolean
  initialTab?: Tab
  onClose: () => void
}

interface SessionData {
  accessToken: string
  user: AuthUser
}

const heroImage = '/assets/images/ub-sport-center-gym-enterence.avif'
const brandLogo = '/ubsc-blue.png'

const labelCls =
  'mb-[7px] block font-bdo text-[13px] font-medium leading-none text-[#1f2937] [@media(max-height:760px)]:lg:mb-[6px] [@media(max-height:760px)]:lg:text-[12px]'
const inputCls =
  'h-[42px] w-full rounded-[7px] border-0 bg-[#f7f7f7] px-[13px] font-bdo text-[15px] font-normal text-[#1f2937] shadow-none outline-hidden transition-[background-color,box-shadow,transform] duration-200 placeholder:text-[#8d8d8d] hover:bg-[#f3f5f6] focus:bg-white focus:ring-2 focus:ring-[#15678D]/25 lg:h-[40px] lg:text-[14px] [@media(max-height:760px)]:lg:h-[34px] [@media(max-height:760px)]:lg:text-[13px]'
const errorRing = 'ring-2 ring-red-500/35'

const motionDelay = (ms: number) => ({ '--auth-delay': `${ms}ms` }) as CSSProperties

function GoogleIcon() {
  return (
    <svg className="h-[27px] w-[27px]" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4 20.54 7.7 23 12 23z"
      />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 4 3.46 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

// PasswordField menerima hasil register() react-hook-form (di-spread ke input), bukan value/onChange
// Inertia. DOM tetap sama; hanya sumber nilainya yang pindah ke RHF (uncontrolled ref).
function PasswordField({
  registration,
  placeholder,
  autoComplete,
  error
}: {
  registration: UseFormRegisterReturn
  placeholder: string
  autoComplete: string
  error?: string
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        {...registration}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className={cn(inputCls, 'pr-11', error && errorRing)}
      />
      <button
        type="button"
        onClick={() => setShow((current) => !current)}
        tabIndex={-1}
        aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
        className="absolute top-1/2 right-[11px] flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[#0d3b2e] transition-colors hover:text-[#15678D]"
      >
        {show ? <EyeOff className="h-[15px] w-[15px]" /> : <Eye className="h-[15px] w-[15px]" />}
      </button>
    </div>
  )
}

function ContinueWithGoogle() {
  return (
    <div className="flex flex-col items-center">
      <p className="font-bdo text-[13px] leading-none font-normal text-[#a6a6a6] [@media(max-height:760px)]:lg:text-[12px]">or continue with</p>
      <button
        type="button"
        onClick={() => {
          window.location.href = GOOGLE_AUTH_URL
        }}
        aria-label="Continue with Google"
        className="mt-[15px] flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white shadow-[0_8px_20px_rgba(0,34,68,0.08)] ring-1 ring-black/5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_12px_28px_rgba(0,34,68,0.12)] [@media(max-height:760px)]:lg:mt-[10px] [@media(max-height:760px)]:lg:h-[32px] [@media(max-height:760px)]:lg:w-[32px]"
      >
        <GoogleIcon />
      </button>
    </div>
  )
}

function useSessionMutation<TPayload>(endpoint: string, onDone: () => void) {
  const { login } = useAuth()
  return useMutation({
    mutationFn: async (payload: TPayload) => {
      const res = await axiosInstance.post<ApiSuccess<SessionData>>(endpoint, payload)
      return res.data.data
    },
    onSuccess: (data) => {
      login(data.accessToken, data.user)
      onDone()
    }
  })
}

interface LoginValues {
  email: string
  password: string
  remember: boolean
}

function LoginForm({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, setError, resetField, formState } = useForm<LoginValues>({
    defaultValues: { email: '', password: '', remember: false }
  })
  const errors = formState.errors
  const mutation = useSessionMutation<LoginValues>(AUTH_ENDPOINTS.login, onClose)

  const submit = handleSubmit((values) => {
    mutation.mutate(values, {
      onError: (error) => {
        const { message, fieldErrors } = extractApiError(error, 'Gagal masuk. Periksa email dan password.')
        const entries = Object.entries(fieldErrors)
        if (entries.length === 0) {
          setError('email', { message })
        } else {
          for (const [name, msg] of entries) setError(name as keyof LoginValues, { message: msg })
        }
        resetField('password')
      }
    })
  })

  return (
    <form onSubmit={submit} className="mt-[38px] w-full [@media(max-height:760px)]:lg:mt-[26px] [@media(max-height:860px)]:lg:mt-[34px]">
      <div className="auth-stagger" style={motionDelay(260)}>
        <label className={labelCls}>Email</label>
        <input
          type="email"
          placeholder="Masukkan email"
          autoComplete="username"
          required
          className={cn(inputCls, errors.email && errorRing)}
          {...register('email')}
        />
        <InputError message={errors.email?.message} className="mt-1 text-[11px]" />
      </div>

      <div className="auth-stagger mt-[17px] [@media(max-height:760px)]:lg:mt-[12px]" style={motionDelay(320)}>
        <label className={labelCls}>Password</label>
        <PasswordField
          registration={register('password')}
          placeholder="Masukkan password"
          autoComplete="current-password"
          error={errors.password?.message}
        />
        <InputError message={errors.password?.message} className="mt-1 text-[11px]" />
      </div>

      <div className="auth-stagger mt-[12px] flex items-center justify-between [@media(max-height:760px)]:lg:mt-[9px]" style={motionDelay(370)}>
        <label className="flex cursor-pointer items-center gap-[9px]">
          <input
            type="checkbox"
            className="h-[13px] w-[13px] rounded-[4px] border border-[#1f2937] bg-white text-[#15678D] focus:ring-[#15678D]/30"
            {...register('remember')}
          />
          <span className="font-bdo text-[12px] leading-none font-normal text-[#555555]">Ingat saya</span>
        </label>
        <a
          href={routes.forgotPassword()}
          className="font-bdo text-[12px] leading-none font-medium text-[#244669] transition-colors hover:text-red-600"
        >
          Forgot Password ?
        </a>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="auth-stagger mt-[34px] flex h-[48px] w-full items-center justify-center rounded-[11px] bg-linear-to-r from-[#002244] to-[#15678D] font-bdo text-[15px] font-medium text-white shadow-[0_14px_24px_rgba(0,34,68,0.24)] transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_18px_30px_rgba(0,34,68,0.28)] disabled:translate-y-0 disabled:opacity-60 [@media(max-height:760px)]:lg:mt-[22px] [@media(max-height:760px)]:lg:h-[41px] [@media(max-height:760px)]:lg:text-[14px] [@media(max-height:860px)]:lg:mt-[30px]"
        style={motionDelay(420)}
      >
        {mutation.isPending ? 'Memproses...' : 'Masuk'}
      </button>

      <div
        className="auth-stagger mt-[24px] [@media(max-height:760px)]:lg:mt-[14px] [@media(max-height:860px)]:lg:mt-[20px]"
        style={motionDelay(480)}
      >
        <ContinueWithGoogle />
      </div>
    </form>
  )
}

interface RegisterValues {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  password: string
}

/**
 * BADAN REQUEST register — camelCase, mengikuti kontrak API (AuthValidation.REGISTER).
 *
 * Nama field FORM di atas sengaja tetap snake_case: itu atribut `name` di DOM dan ikut diukur gate
 * paritas. Payload dirakit EKSPLISIT dari values, tidak dengan menyebarnya — menyebar `values` akan
 * mengirim first_name/last_name/phone_number yang tidak dikenal skema Zod lalu dibuang diam-diam.
 * Itulah dua bug yang diperbaiki di sini: passwordConfirmation tidak pernah sampai (400 saat daftar),
 * dan nomor HP tidak pernah tersimpan.
 */
interface RegisterPayload {
  name: string
  email: string
  phoneNumber: string
  password: string
  passwordConfirmation: string
}

/** Field error server (camelCase) -> slot input yang benar-benar ada di form ini. */
const REGISTER_ERROR_FIELD: Record<string, keyof RegisterValues> = {
  // `name` gabungan dipetakan ke first_name supaya pesannya tampil (sama seperti Laravel: errors.name).
  name: 'first_name',
  email: 'email',
  phoneNumber: 'phone_number',
  password: 'password',
  // Konfirmasi tidak punya input sendiri (nilainya disalin dari password), jadi pesannya menempel di sana.
  passwordConfirmation: 'password'
}

function RegisterForm({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, setError, resetField, formState } = useForm<RegisterValues>({
    defaultValues: { first_name: '', last_name: '', email: '', phone_number: '', password: '' }
  })
  const errors = formState.errors
  const mutation = useSessionMutation<RegisterPayload>(AUTH_ENDPOINTS.register, onClose)

  const submit = handleSubmit((values) => {
    const fullName = [values.first_name, values.last_name].filter(Boolean).join(' ').trim()
    mutation.mutate(
      {
        name: fullName,
        email: values.email,
        phoneNumber: values.phone_number,
        password: values.password,
        passwordConfirmation: values.password
      },
      {
        onError: (error) => {
          const { message, fieldErrors } = extractApiError(error, 'Gagal mendaftar. Periksa data Anda.')
          const entries = Object.entries(fieldErrors)
          if (entries.length === 0) {
            setError('email', { message })
          } else {
            for (const [name, msg] of entries) {
              const target = REGISTER_ERROR_FIELD[name]
              // Field yang tidak punya slot input tidak boleh hilang diam-diam.
              if (target) setError(target, { message: msg })
              else setError('email', { message: msg })
            }
          }
          resetField('password')
        }
      }
    )
  })

  return (
    <form onSubmit={submit} className="mt-[24px] w-full [@media(max-height:760px)]:lg:mt-[13px] [@media(max-height:860px)]:lg:mt-[18px]">
      <div
        className="auth-stagger grid grid-cols-1 gap-[13px] sm:grid-cols-2 sm:gap-[22px] [@media(max-height:760px)]:lg:gap-[16px]"
        style={motionDelay(250)}
      >
        <div>
          <label className={labelCls}>Nama Depan</label>
          <input
            type="text"
            placeholder="Nama Depan"
            autoComplete="given-name"
            required
            className={cn(inputCls, (errors.first_name || errors.last_name) && errorRing)}
            {...register('first_name')}
          />
        </div>
        <div>
          <label className={labelCls}>Nama Belakang</label>
          <input
            type="text"
            placeholder="Nama Belakang"
            autoComplete="family-name"
            className={cn(inputCls, (errors.first_name || errors.last_name) && errorRing)}
            {...register('last_name')}
          />
        </div>
      </div>
      <InputError message={errors.first_name?.message} className="mt-1 text-[11px]" />

      <div className="auth-stagger mt-[14px] [@media(max-height:760px)]:lg:mt-[9px]" style={motionDelay(310)}>
        <label className={labelCls}>Email</label>
        <input
          type="email"
          placeholder="Masukkan email"
          autoComplete="username"
          required
          className={cn(inputCls, errors.email && errorRing)}
          {...register('email')}
        />
        <InputError message={errors.email?.message} className="mt-1 text-[11px]" />
      </div>

      <div className="auth-stagger mt-[14px] [@media(max-height:760px)]:lg:mt-[9px]" style={motionDelay(360)}>
        <label className={labelCls}>No. Handphone</label>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="Contoh: 081234567890"
          autoComplete="tel"
          className={cn(inputCls, errors.phone_number && errorRing)}
          {...register('phone_number')}
        />
        <InputError message={errors.phone_number?.message} className="mt-1 text-[11px]" />
      </div>

      <div className="auth-stagger mt-[14px] [@media(max-height:760px)]:lg:mt-[9px]" style={motionDelay(410)}>
        <label className={labelCls}>Password</label>
        <PasswordField
          registration={register('password')}
          placeholder="Masukkan Password"
          autoComplete="new-password"
          error={errors.password?.message}
        />
        <InputError message={errors.password?.message} className="mt-1 text-[11px]" />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="auth-stagger mt-[22px] flex h-[48px] w-full items-center justify-center rounded-[11px] bg-linear-to-r from-[#002244] to-[#15678D] font-bdo text-[15px] font-medium text-white shadow-[0_14px_24px_rgba(0,34,68,0.24)] transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_18px_30px_rgba(0,34,68,0.28)] disabled:translate-y-0 disabled:opacity-60 [@media(max-height:760px)]:lg:mt-[14px] [@media(max-height:760px)]:lg:h-[41px] [@media(max-height:760px)]:lg:text-[14px] [@media(max-height:860px)]:lg:mt-[18px]"
        style={motionDelay(460)}
      >
        {mutation.isPending ? 'Memproses...' : 'Daftar'}
      </button>

      <div className="auth-stagger mt-[18px] [@media(max-height:760px)]:lg:mt-[9px] [@media(max-height:860px)]:lg:mt-[13px]" style={motionDelay(510)}>
        <ContinueWithGoogle />
      </div>
    </form>
  )
}

function VisualPanel() {
  return (
    <div className="auth-modal-visual relative hidden h-full shrink-0 basis-[55.41%] overflow-hidden bg-[#151515] lg:block">
      {/* eslint-disable-next-line @next/next/no-img-element -- aset desain dari public/, sengaja bukan next/image */}
      <img src={heroImage} alt="UB Sport Center gym entrance" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="auth-visual-vignette absolute inset-0" />
    </div>
  )
}

function AuthCopy({ tab, onSwitchTab }: { tab: Tab; onSwitchTab: () => void }) {
  const isLogin = tab === 'login'

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- logo brand dari public/, sengaja bukan next/image */}
      <img
        src={brandLogo}
        alt="UB Sport Center"
        className="auth-stagger mx-auto h-[43px] w-[86px] object-contain [@media(max-height:760px)]:lg:h-[35px] [@media(max-height:760px)]:lg:w-[72px]"
        style={motionDelay(80)}
      />
      <h1
        className="auth-stagger mt-[23px] font-bdo text-[23px] leading-[1.2] font-semibold tracking-normal text-black [@media(max-height:760px)]:lg:mt-[14px] [@media(max-height:760px)]:lg:text-[20px] [@media(max-height:860px)]:lg:mt-[19px]"
        style={motionDelay(140)}
      >
        {isLogin ? (
          <>
            Selamat Datang Kembali, Silahkan
            <br />
            Masuk Ke Akun Anda
          </>
        ) : (
          <>
            Selamat Datang, Silahkan Mulai
            <br />
            Buat Akun Sport Center Anda
          </>
        )}
      </h1>
      <p
        className="auth-stagger mt-[9px] font-bdo text-[14px] leading-none font-normal text-[#777777] [@media(max-height:760px)]:lg:text-[12px]"
        style={motionDelay(200)}
      >
        {isLogin ? 'Jika kamu belum memiliki akun ' : 'Jika kamu sudah memiliki akun '}
        <button type="button" onClick={onSwitchTab} className="font-semibold text-red-600 transition-colors hover:text-red-700">
          {isLogin ? 'Daftar disini !' : 'Masuk disini !'}
        </button>
      </p>
    </>
  )
}

export function AuthModal({ open, initialTab = 'login', onClose }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab)

  // openCount naik tiap modal dibuka; jadi bagian dari key form-flow supaya animasi stagger CSS replay.
  const [openCount, setOpenCount] = useState(0)

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  useEffect(() => {
    if (open) setOpenCount((c) => c + 1)
  }, [open])

  // ESC untuk menutup
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Kunci scroll body selama terbuka
  useEffect(() => {
    if (!open) return

    const scrollY = window.scrollY
    const prev = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    }
    const prevHtmlOverflow = document.documentElement.style.overflow

    document.documentElement.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.position = prev.position
      document.body.style.top = prev.top
      document.body.style.left = prev.left
      document.body.style.right = prev.right
      document.body.style.width = prev.width
      document.body.style.overflow = prev.overflow
      window.scrollTo(0, scrollY)
    }
  }, [open])

  // Tetap unmount sampai open pertama. Kartu memuat gambar + logo besar; merendernya di balik opacity-0
  // akan menarik keduanya di tiap kunjungan guest. openCount>0 menjaga fade-out saat menutup tetap utuh.
  if (!open && openCount === 0) return null

  return (
    <div
      data-lenis-prevent
      className={cn(
        'fixed inset-0 z-200 flex items-center justify-center overflow-hidden px-3 py-4 transition-opacity duration-150',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <div className={cn('absolute inset-0 bg-black/10', open && 'auth-modal-backdrop-open')} onClick={onClose} />

      <div
        className={cn(
          'relative z-10 flex max-h-[calc(100vh-32px)] w-full max-w-[520px] flex-col overflow-hidden rounded-none bg-white shadow-[0_28px_80px_rgba(0,0,0,0.45)] lg:aspect-1220/763 lg:h-auto lg:max-h-none lg:w-[min(1220px,calc(100vw-72px),calc((100vh-72px)*1.599))] lg:max-w-none lg:flex-row xl:w-[min(1220px,calc(100vw-96px),calc((100vh-72px)*1.599))] [@media(max-height:760px)]:lg:w-[min(1126px,calc(100vw-56px),calc((100vh-56px)*1.599))]',
          open && 'auth-modal-open'
        )}
      >
        <VisualPanel />

        <section className="auth-form-panel auth-form-scroll relative flex min-h-0 min-w-0 flex-1 justify-center overflow-y-auto overscroll-contain px-6 py-8 sm:px-10 lg:items-center lg:px-[46px] lg:py-[38px] xl:px-[50px] [@media(max-height:760px)]:lg:py-[24px]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="auth-close absolute top-5 right-5 z-10 flex h-[25px] w-[25px] items-center justify-center rounded-full bg-white/90 text-[#4c585b] shadow-[0_8px_22px_rgba(0,34,68,0.10)] ring-1 ring-black/5 transition-[transform,background-color,color,box-shadow] duration-200 hover:scale-105 hover:bg-white hover:text-black hover:shadow-[0_10px_26px_rgba(0,34,68,0.16)] lg:top-[25px] lg:right-[27px]"
          >
            <X className="h-[17px] w-[17px]" />
          </button>

          <div className="auth-modal-content relative z-1 my-auto w-full max-w-[430px] py-8 sm:py-10 lg:max-w-none lg:py-0">
            <div key={`${tab}-${openCount}`} className="auth-modal-form-flow">
              <AuthCopy tab={tab} onSwitchTab={() => setTab(tab === 'login' ? 'register' : 'login')} />
              {tab === 'login' ? <LoginForm onClose={onClose} /> : <RegisterForm onClose={onClose} />}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
