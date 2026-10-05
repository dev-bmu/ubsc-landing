'use client'

/**
 * Port dari resources/js/Components/UserDashboard/ProfileModal.tsx (Laravel/Inertia).
 *
 * Perubahan terhadap sumber:
 *   - `export default function` -> named export `ProfileModal`.
 *   - `usePage<PageProps>().props.auth.user` -> `const { user } = useAuth()` (@/context/AuthContext).
 *   - 3 Inertia `useForm` (profileForm, passwordForm, identityForm) -> `react-hook-form` (useForm)
 *     + submit lewat `axiosInstance` (@/lib/axios, baseURL '/api'):
 *       profile.update   -> POST /api/customer/profile   (multipart; ada File avatar + _method=patch)
 *       password.update  -> PUT  /api/customer/password   (JSON)
 *       profile.identity -> POST /api/customer/identity   (multipart; ada File identityFile)
 *   - Error: envelope { code, message, fields }. `err.response.data.error.fields` -> setError per field;
 *     bila tidak ada fields -> error root (pesan umum) yang ditampilkan lewat <InputError>.
 *   - Class Tailwind v3 -> v4: 16 pasang dari spec (bg-white/[0.0x]->bg-white/x, outline-none->outline-hidden,
 *     backdrop-blur-sm->backdrop-blur-xs, flex-shrink-0->shrink-0, z-[200]->z-200).
 *   - `data-lenis-prevent`, handler Escape, body scroll lock, revoke objectURL, avatar preview (useRef),
 *     seluruh ikon lucide, dan struktur/urutan section DIPERTAHANKAN apa adanya.
 *
 * Catatan INERT (Fase 6):
 *   - Endpoint /api/customer/{profile,password,identity} dibangun di Fase 6 dan dipakai di bawah.
 *     UI di-port faithful; submit diarahkan ke endpoint yang benar dan gagal anggun (error state komponen).
 *   - Field profil BELUM ADA di AuthUser ({ id, name, email, role, permissions }): avatar, avatarUrl,
 *     birthPlace, birthDate, identityNumber, identityStatus. Dibaca via tipe lokal `ProfileUser`
 *     (cast dari user) dengan optional chaining/placeholder — sumber datanya menyusul di Fase 6.
 *     JANGAN menambah field ini ke AuthContext dari sini.
 *   - Error field tetap dirender inline persis seperti sumber (font-bdo text-[11px]/[12px] text-rose-400)
 *     demi fidelity; <InputError> dipakai untuk pesan error umum (envelope.message) per form.
 */

import { useState, useEffect, useMemo, useRef, type ChangeEvent, type FormEventHandler } from 'react'
import { BadgeCheck, CalendarDays, Camera, Clock, Eye, EyeOff, FileUp, MapPin, ShieldCheck, User, X, XCircle, type LucideIcon } from 'lucide-react'
import { useForm, type FieldValues, type Path, type UseFormRegister, type UseFormSetError, type FieldErrors } from 'react-hook-form'
import type { AxiosError } from 'axios'
import { cn } from '@/lib/utils'
import axiosInstance from '@/lib/axios'
import { useAuth } from '@/context/AuthContext'
import { InputError } from '@/components/InputError'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AuthUser } from '@/types/api/auth'
import type { ApiSuccess, CustomerProfileDto } from '@/types/contracts/contracts'
import { ResendVerificationButton } from '@/components/auth/EmailVerification'
import { MemberPhotoSection } from './MemberPhotoSection'

interface Props {
  onClose: () => void
}

// /me hanya membawa id/name/email/role. Sisa field profil (avatar, tempat/tanggal lahir, identitas)
// datang dari GET /api/customer/profile — digabung di bawah supaya modal terisi sejak render pertama.
type ProfileUser = Partial<AuthUser> & Partial<CustomerProfileDto>

interface ProfileFormValues {
  name: string
  birthPlace: string
  birthDate: string
  avatar: File | null
}

interface PasswordFormValues {
  currentPassword: string
  password: string
  passwordConfirmation: string
}

interface IdentityFormValues {
  identityCategory: 'warga_kampus'
  identityNumber: string
  identityFile: File | null
}

// Envelope error API baru: { error: { code, message, fields } }.
interface ApiErrorEnvelope {
  error?: {
    code?: string
    message?: string
    fields?: Record<string, string | string[]>
  }
}

// Terjemahkan envelope { code, message, fields } ke react-hook-form: `fields` -> error per field,
// selain itu -> error root (pesan umum). Generic supaya dipakai ketiga form.
function applyEnvelopeErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>) {
  const envelope = (err as AxiosError<ApiErrorEnvelope>).response?.data?.error
  if (envelope?.fields && Object.keys(envelope.fields).length > 0) {
    Object.entries(envelope.fields).forEach(([key, val]) => {
      setError(key as Path<T>, { message: Array.isArray(val) ? val[0] : String(val) })
    })
  } else {
    setError('root' as Path<T>, { message: envelope?.message ?? 'Terjadi kesalahan. Silakan coba lagi.' })
  }
}

export function ProfileModal({ onClose }: Props) {
  const { user: authUser } = useAuth()
  const queryClient = useQueryClient()
  // Profil lengkap (avatar, tempat/tanggal lahir, identitas) hanya ada di endpoint ini; /me tidak membawanya.
  const { data: profile } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: async () => (await axiosInstance.get<ApiSuccess<CustomerProfileDto>>('/customer/profile')).data.data,
    enabled: !!authUser,
    retry: false
  })
  // useMemo WAJIB: objek gabungan baru di setiap render membuat efek prefill di bawah jalan setiap
  // render, dan reset() di dalamnya memicu render lagi — isian form tertimpa terus, tidak bisa diketik.
  const user: ProfileUser | null = useMemo(() => (authUser || profile ? { ...authUser, ...profile } : null), [authUser, profile])

  /** Dipanggil setelah tiap mutasi sukses: Navbar membaca nama & avatar dari /me. */
  const refreshProfile = () => {
    void queryClient.invalidateQueries({ queryKey: ['customer-profile'] })
    void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
  }

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    setError: setProfileError,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting }
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name: user?.name ?? '',
      birthPlace: user?.birthPlace ?? '',
      birthDate: user?.birthDate ?? '',
      avatar: null
    }
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    setError: setPasswordError,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting }
  } = useForm<PasswordFormValues>({
    defaultValues: { currentPassword: '', password: '', passwordConfirmation: '' }
  })

  const {
    register: registerIdentity,
    handleSubmit: handleSubmitIdentity,
    reset: resetIdentity,
    setError: setIdentityError,
    watch: watchIdentity,
    formState: { errors: identityErrors, isSubmitting: identitySubmitting }
  } = useForm<IdentityFormValues>({
    defaultValues: {
      identityCategory: 'warga_kampus',
      identityNumber: user?.identityNumber ?? '',
      identityFile: null
    }
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [identityFile, setIdentityFile] = useState<File | null>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [identitySuccess, setIdentitySuccess] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  /* Prefill ulang saat sesi (user) selesai dipulihkan async oleh AuthContext — di Laravel data user
     tersedia sinkron dari usePage; di sini bisa menyusul, jadi reset default ketika user berubah. */
  useEffect(() => {
    if (!user) return
    resetProfile({ name: user.name ?? '', birthPlace: user.birthPlace ?? '', birthDate: user.birthDate ?? '', avatar: null })
    resetIdentity({ identityCategory: 'warga_kampus', identityNumber: user.identityNumber ?? '', identityFile: null })
  }, [user, resetProfile, resetIdentity])

  /* Body scroll lock */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  /* Escape to close */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  /* Revoke object URL when preview changes or on unmount */
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setAvatarFile(file)
  }

  const submitProfile = handleSubmitProfile(async (values) => {
    setProfileSuccess(false)
    const formData = new FormData()
    formData.append('_method', 'patch')
    formData.append('name', values.name)
    formData.append('birthPlace', values.birthPlace)
    formData.append('birthDate', values.birthDate)
    if (avatarFile) formData.append('avatar', avatarFile)
    try {
      await axiosInstance.post('/customer/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setProfileSuccess(true)
      refreshProfile()
    } catch (err) {
      applyEnvelopeErrors<ProfileFormValues>(err, setProfileError)
    }
  })

  const submitPassword = handleSubmitPassword(async (values) => {
    setPasswordSuccess(false)
    try {
      await axiosInstance.put('/customer/password', values)
      setPasswordSuccess(true)
      resetPassword()
    } catch (err) {
      applyEnvelopeErrors<PasswordFormValues>(err, setPasswordError)
    }
  })

  const submitIdentity = handleSubmitIdentity(async (values) => {
    setIdentitySuccess(false)
    const formData = new FormData()
    formData.append('identityCategory', 'warga_kampus')
    formData.append('identityNumber', values.identityNumber)
    if (identityFile) formData.append('identityFile', identityFile)
    try {
      await axiosInstance.post('/customer/identity', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setIdentitySuccess(true)
      refreshProfile()
      setIdentityFile(null)
    } catch (err) {
      applyEnvelopeErrors<IdentityFormValues>(err, setIdentityError)
    }
  })

  const handleIdentityFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIdentityFile(e.target.files?.[0] ?? null)
  }

  const initials = (user?.name ?? '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const displayAvatar = avatarPreview ?? user?.avatarUrl ?? user?.avatar ?? null

  useEffect(() => {
    setAvatarFailed(false)
  }, [displayAvatar])

  return (
    <div data-lenis-prevent className="fixed inset-0 z-200 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0d1422] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10">
              <User className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <p className="font-bdo text-[10px] font-bold tracking-[0.18em] text-orange-400 uppercase">Akun Saya</p>
              <h2 className="font-clash text-[16px] font-semibold text-white">Profil Saya</h2>
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

        {/* Scrollable body — inner scroll, overscroll contained */}
        <div className="max-h-[85vh] space-y-8 overflow-y-auto overscroll-contain px-6 py-6">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="group relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-white/10 transition-all hover:ring-orange-400/40"
              title="Ganti foto profil"
            >
              {displayAvatar && !avatarFailed ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar dinamis pengguna (URL remote / object URL); sengaja <img> agar onError fallback & referrerPolicy tetap seperti sumber, bukan next/image
                <img
                  src={displayAvatar}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-navy-900">
                  <span className="font-clash text-2xl leading-none font-bold text-white">{initials}</span>
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </button>
            <p className="font-bdo text-[11px] text-white/30">{avatarFile ? avatarFile.name : 'Klik untuk ganti foto'}</p>
            {user?.customerNumber && (
              <p className="font-bdo text-[12px] text-white/60">
                Nomor member <span className="font-mono font-semibold text-white">{user.customerNumber}</span>
              </p>
            )}
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={handleAvatarChange} />
            {profileErrors.avatar && <p className="font-bdo text-[11px] text-rose-400">{profileErrors.avatar.message}</p>}
          </div>

          {/* Section 1 — Profile info */}
          <form onSubmit={submitProfile} className="space-y-4">
            <p className="font-bdo text-[10px] font-medium tracking-[0.18em] text-white/40 uppercase">Informasi Profil</p>

            <div className="space-y-1.5">
              <label className="font-bdo text-[12px] text-white/60">Nama Lengkap</label>
              <input
                type="text"
                {...registerProfile('name')}
                className={cn(
                  'w-full rounded-xl border bg-white/4 px-4 py-2.5 font-bdo text-sm text-white outline-hidden transition-colors focus:bg-white/[0.07]',
                  profileErrors.name ? 'border-rose-500/50 focus:border-rose-500/50' : 'border-white/[0.08] focus:border-orange-400/40'
                )}
              />
              {profileErrors.name && <p className="font-bdo text-[11px] text-rose-400">{profileErrors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-bdo text-[12px] text-white/60">Tempat Lahir</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/25" />
                  <input
                    type="text"
                    {...registerProfile('birthPlace')}
                    placeholder="Kota kelahiran"
                    className={cn(
                      'w-full rounded-xl border bg-white/4 px-4 py-2.5 pl-10 font-bdo text-sm text-white outline-hidden transition-colors placeholder:text-white/20 focus:bg-white/[0.07]',
                      profileErrors.birthPlace ? 'border-rose-500/50 focus:border-rose-500/50' : 'border-white/[0.08] focus:border-orange-400/40'
                    )}
                  />
                </div>
                {profileErrors.birthPlace && <p className="font-bdo text-[11px] text-rose-400">{profileErrors.birthPlace.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="font-bdo text-[12px] text-white/60">Tanggal Lahir</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/25" />
                  <input
                    type="date"
                    {...registerProfile('birthDate')}
                    className={cn(
                      'w-full rounded-xl border bg-white/4 px-4 py-2.5 pl-10 font-bdo text-sm text-white outline-hidden transition-colors focus:bg-white/[0.07]',
                      profileErrors.birthDate ? 'border-rose-500/50 focus:border-rose-500/50' : 'border-white/[0.08] focus:border-orange-400/40'
                    )}
                  />
                </div>
                {profileErrors.birthDate && <p className="font-bdo text-[11px] text-rose-400">{profileErrors.birthDate.message}</p>}
              </div>
            </div>

            {/* Email — read-only, cannot be changed after registration */}
            <div className="space-y-1.5">
              <label className="font-bdo text-[12px] text-white/60">
                Email
                <span className="ml-2 rounded-full bg-white/6 px-2 py-0.5 text-[10px] text-white/30">tidak dapat diubah</span>
              </label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-white/5 bg-white/2 px-4 py-2.5 font-bdo text-sm text-white/40 outline-hidden"
              />
              {user?.emailVerifiedAt === null && (
                <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 font-bdo text-[12px] text-amber-200">
                  Email belum diverifikasi — profil, pembayaran, dan membership baru bisa dipakai setelah verifikasi. <ResendVerificationButton />
                </div>
              )}
            </div>

            {profileSuccess && <p className="font-bdo text-[12px] text-emerald-400">Profil berhasil diperbarui.</p>}

            <InputError message={profileErrors.root?.message} />

            <button
              type="submit"
              disabled={profileSubmitting}
              className="w-full rounded-xl bg-orange-500 py-2.5 font-clash text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {profileSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>

          <div className="h-px bg-white/6" />

          {/* Section — Warga UB verification */}
          <IdentitySection
            status={user?.identityStatus ?? 'unverified'}
            register={registerIdentity}
            errors={identityErrors}
            isSubmitting={identitySubmitting}
            identityNumber={watchIdentity('identityNumber')}
            identityFile={identityFile}
            onFileChange={handleIdentityFileChange}
            success={identitySuccess}
            onSubmit={submitIdentity}
          />

          <div className="h-px bg-white/6" />

          <MemberPhotoSection url={user?.memberPhotoUrl ?? null} status={user?.memberPhotoStatus ?? null} onUploaded={refreshProfile} />

          <div className="h-px bg-white/6" />

          {/* Section 2 — Change password */}
          <form onSubmit={submitPassword} className="space-y-4">
            <p className="font-bdo text-[10px] font-medium tracking-[0.18em] text-white/40 uppercase">Ganti Password</p>

            <div className="space-y-1.5">
              <label className="font-bdo text-[12px] text-white/60">Password Saat Ini</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  {...registerPassword('currentPassword')}
                  className={cn(
                    'w-full rounded-xl border bg-white/4 px-4 py-2.5 pr-10 font-bdo text-sm text-white outline-hidden transition-colors focus:bg-white/[0.07]',
                    passwordErrors.currentPassword ? 'border-rose-500/50 focus:border-rose-500/50' : 'border-white/[0.08] focus:border-orange-400/40'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.currentPassword && <p className="font-bdo text-[11px] text-rose-400">{passwordErrors.currentPassword.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="font-bdo text-[12px] text-white/60">Password Baru</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  {...registerPassword('password')}
                  className={cn(
                    'w-full rounded-xl border bg-white/4 px-4 py-2.5 pr-10 font-bdo text-sm text-white outline-hidden transition-colors focus:bg-white/[0.07]',
                    passwordErrors.password ? 'border-rose-500/50 focus:border-rose-500/50' : 'border-white/[0.08] focus:border-orange-400/40'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.password && <p className="font-bdo text-[11px] text-rose-400">{passwordErrors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="font-bdo text-[12px] text-white/60">Konfirmasi Password Baru</label>
              <input
                type="password"
                {...registerPassword('passwordConfirmation')}
                className={cn(
                  'w-full rounded-xl border bg-white/4 px-4 py-2.5 font-bdo text-sm text-white outline-hidden transition-colors focus:bg-white/[0.07]',
                  passwordErrors.passwordConfirmation
                    ? 'border-rose-500/50 focus:border-rose-500/50'
                    : 'border-white/[0.08] focus:border-orange-400/40'
                )}
              />
              {passwordErrors.passwordConfirmation && (
                <p className="font-bdo text-[11px] text-rose-400">{passwordErrors.passwordConfirmation.message}</p>
              )}
            </div>

            {passwordSuccess && <p className="font-bdo text-[12px] text-emerald-400">Password berhasil diperbarui.</p>}

            <InputError message={passwordErrors.root?.message} />

            <button
              type="submit"
              disabled={passwordSubmitting}
              className="w-full rounded-xl bg-white/6 py-2.5 font-clash text-[13px] font-semibold text-white transition-all hover:bg-white/10 disabled:opacity-50"
            >
              {passwordSubmitting ? 'Memperbarui...' : 'Perbarui Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

/**
 * Campus-community verification. Member pricing is only unlocked once staff
 * mark the submission verified, so the state machine is shown honestly:
 * unverified → pending → verified | rejected (resubmit allowed).
 */
function IdentitySection({
  status,
  register,
  errors,
  isSubmitting,
  identityNumber,
  identityFile,
  onFileChange,
  success,
  onSubmit
}: {
  status: string
  register: UseFormRegister<IdentityFormValues>
  errors: FieldErrors<IdentityFormValues>
  isSubmitting: boolean
  identityNumber: string
  identityFile: File | null
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  success: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
}) {
  const canSubmit = status === 'unverified' || status === 'rejected'

  const badge = (
    {
      verified: { icon: BadgeCheck, cls: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300', label: 'Terverifikasi — harga Warga UB aktif' },
      pending: { icon: Clock, cls: 'border-sky-400/25 bg-sky-400/10 text-sky-300', label: 'Menunggu review admin (1–2 hari kerja)' },
      rejected: { icon: XCircle, cls: 'border-rose-400/25 bg-rose-400/10 text-rose-300', label: 'Ditolak — periksa dokumen lalu ajukan ulang' },
      unverified: { icon: ShieldCheck, cls: 'border-white/10 bg-white/4 text-white/60', label: 'Belum diajukan' }
    } as Record<string, { icon: LucideIcon; cls: string; label: string }>
  )[status] ?? { icon: ShieldCheck, cls: 'border-white/10 bg-white/4 text-white/60', label: 'Belum diajukan' }
  const BadgeIcon = badge.icon

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <p className="font-bdo text-[10px] font-medium tracking-[0.18em] text-white/40 uppercase">Verifikasi Warga UB</p>
        <p className="mt-1 font-bdo text-[12px] leading-relaxed text-white/50">
          Mahasiswa, dosen, dan tenaga kependidikan UB mendapat harga khusus. Ajukan sekali dengan NIM/NIP dan foto KTM atau kartu pegawai.
        </p>
      </div>

      <div className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 font-bdo text-[12px]', badge.cls)}>
        <BadgeIcon className="h-4 w-4 shrink-0" />
        {badge.label}
      </div>

      {canSubmit && (
        <>
          <div className="space-y-1.5">
            <label className="font-bdo text-[12px] text-white/60">NIM / NIP / Nomor identitas kampus</label>
            <input
              type="text"
              {...register('identityNumber')}
              placeholder="contoh: 215150200111001"
              className="w-full rounded-xl border border-white/[0.07] bg-white/4 px-4 py-2.5 font-bdo text-sm text-white outline-hidden placeholder:text-white/25 focus:border-orange-500/40"
            />
            {errors.identityNumber && <p className="font-bdo text-[12px] text-rose-400">{errors.identityNumber.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="font-bdo text-[12px] text-white/60">Foto KTM / kartu pegawai (JPG, PNG, PDF · maks 4 MB)</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/2 px-4 py-3 transition hover:border-orange-500/40">
              <FileUp className="h-4 w-4 text-white/40" />
              <span className="font-bdo text-[12px] text-white/60">{identityFile ? identityFile.name : 'Pilih dokumen'}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={onFileChange} />
            </label>
            {errors.identityFile && <p className="font-bdo text-[12px] text-rose-400">{errors.identityFile.message}</p>}
          </div>

          {success && <p className="font-bdo text-[12px] text-emerald-400">Pengajuan terkirim. Admin akan meninjau.</p>}

          <InputError message={errors.root?.message} />

          <button
            type="submit"
            disabled={isSubmitting || !identityFile || !identityNumber}
            className="w-full rounded-xl bg-orange-500 py-2.5 font-clash text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Mengirim...' : status === 'rejected' ? 'Ajukan Ulang' : 'Ajukan Verifikasi'}
          </button>
        </>
      )}
    </form>
  )
}
