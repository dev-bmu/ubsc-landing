import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { AUTH_ENDPOINTS } from '@/config/api'

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

interface RefreshData {
  accessToken: string
}

// ===== State token =====
// Access token hanya hidup di memori — tidak pernah masuk localStorage.
let accessToken: string | undefined
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

const axiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true
})

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
// Dipertahankan apa adanya dari boilerplate: saat banyak request kena 401 bersamaan,
// hanya SATU panggilan refresh yang ditembakkan, sisanya antre di refreshSubscribers
// lalu diulang dengan token baru.
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

      if (!originalRequest?._retry) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            addRefreshSubscriber((token) => {
              if (originalRequest?.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              resolve(axiosInstance(originalRequest!))
            })
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const { data } = await axiosInstance.post<ApiEnvelope<RefreshData>>(AUTH_ENDPOINTS.refresh)
          accessToken = data.data.accessToken

          isRefreshing = false
          if (accessToken) {
            onRefreshed(accessToken)
          }

          if (originalRequest?.headers && accessToken) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }
          return axiosInstance(originalRequest!)
        } catch (err) {
          isRefreshing = false
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
