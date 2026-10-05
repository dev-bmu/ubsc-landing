import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { AUTH_ENDPOINTS } from '@/config/api'
import type { AuthUser } from '@/types/api/auth'

// Perluas config axios supaya punya penanda _retry.
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

// ===== Envelope respons API =====
// API baru selalu membungkus payload: { success, data }. Endpoint refresh mengembalikan
// data.accessToken (dan data.user, yang dibaca AuthContext).
// TODO Fase 1: ganti tipe lokal ini dengan tipe resmi dari '@/types/contracts' begitu
// `npm run sync:contracts` sudah mengisi salinannya.
interface ApiEnvelope<T> {
  success: boolean
  data: T
}

export interface RefreshData {
  accessToken: string
  user: AuthUser
}

// ===== State token =====
// Access token hanya hidup di memori — tidak pernah masuk localStorage.
let accessToken: string | undefined
let refreshInFlight: Promise<RefreshData> | null = null

const axiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true
})

/**
 * Pulihkan / perpanjang sesi lewat cookie refresh. SATU request per tab pada satu waktu: pemanggil
 * yang datang saat refresh masih berjalan (AuthContext saat halaman dimuat, interceptor 401) menunggu
 * promise yang sama. Dua refresh paralel dengan token yang sama dibaca server sebagai pencurian token
 * (reuse detection) dan semua sesi dicabut.
 */
export function refreshSession(): Promise<RefreshData> {
  refreshInFlight ??= axiosInstance
    .post<ApiEnvelope<RefreshData>>(AUTH_ENDPOINTS.refresh)
    .then((res) => {
      accessToken = res.data.data.accessToken
      return res.data.data
    })
    .finally(() => {
      refreshInFlight = null
    })
  return refreshInFlight
}

// ===== Pengalihan saat sesi habis =====
// Landing SENGAJA tidak punya halaman /login. Form login hidup di AuthModal yang dibuka
// lewat query ?auth=login (Rewrite.md: jangan intercepting route, jangan useSearchParams —
// hook itu memaksa route jadi dinamis dan diam-diam mematikan strategi ISR per halaman).
const redirectToLogin = () => {
  if (typeof window === 'undefined') return

  const currentParams = new URLSearchParams(window.location.search)
  // Modal login sudah terbuka — jangan bikin loop.
  if (window.location.pathname === '/' && currentParams.get('auth') === 'login') return

  const returnUrl = `${window.location.pathname}${window.location.search}`
  const params = new URLSearchParams({ auth: 'login' })
  if (returnUrl !== '/') params.set('returnUrl', returnUrl)

  window.location.href = `/?${params.toString()}`
}

axiosInstance.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ===== Interceptor refresh single-flight =====
// Saat banyak request kena 401 bersamaan, semuanya menunggu SATU refreshSession() lalu diulang
// dengan token baru.
//
// Path-nya datang dari AUTH_ENDPOINTS ('/auth/customer/...'), bukan '/auth/...' polos milik
// boilerplate admin: audience di ubsc-api adalah segmen URL, dan path lama membalas 404.
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig
    const url = originalRequest?.url || ''

    if (error.response?.status === 401) {
      // Endpoint auth sendiri tidak boleh memicu refresh.
      const isAuthLogin = url.includes(AUTH_ENDPOINTS.login)
      const isAuthRefresh = url.includes(AUTH_ENDPOINTS.refresh)
      const isAuthLogout = url.includes(AUTH_ENDPOINTS.logout)
      if (isAuthLogin || isAuthRefresh || isAuthLogout) {
        return Promise.reject(error)
      }

      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true
        try {
          const { accessToken: token } = await refreshSession()
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosInstance(originalRequest)
        } catch (err) {
          accessToken = undefined
          redirectToLogin()
          return Promise.reject(err)
        }
      }
    }

    return Promise.reject(error)
  }
)

export function setAccessToken(token: string | null) {
  accessToken = token ?? undefined
}

export default axiosInstance
