'use client'

import axiosInstance, { refreshSession, setAccessToken } from '@/lib/axios'
import { AUTH_ENDPOINTS, CUSTOMER_SESSION_COOKIE } from '@/config/api'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { AuthUser } from '@/types/api/auth'

/** Cookie penanda sesi (non-httpOnly, dipasang API saat login). Tanpanya tidak ada sesi untuk dipulihkan. */
function hasSessionHint(): boolean {
  return document.cookie
    .split('; ')
    .some((part) => part.startsWith(`${CUSTOMER_SESSION_COOKIE}=`) && part.length > CUSTOMER_SESSION_COOKIE.length + 1)
}

interface AuthContextType {
  user: AuthUser | null
  login: (accessToken: string, userData: AuthUser) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Access token hanya hidup di memori — pulihkan sesi dari cookie refresh httpOnly
    // ubsc_c_refresh, yang ber-Path=/api/auth sehingga hanya ikut pada panggilan auth ini.
    const checkUserStatus = async () => {
      // Tamu: tidak ada sesi untuk dipulihkan — langsung selesai, tanpa request dan tanpa jeda.
      if (!hasSessionHint()) {
        setIsLoading(false)
        return
      }
      try {
        const { user: restored } = await refreshSession()
        setUser({
          id: restored.id,
          name: restored.name,
          email: restored.email,
          role: restored.role,
          permissions: Array.isArray(restored.permissions) ? restored.permissions : undefined,
          emailVerifiedAt: restored.emailVerifiedAt
        })
      } catch {
        setAccessToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserStatus()
  }, [])

  const login = (accessToken: string, userData: AuthUser) => {
    setAccessToken(accessToken)
    setUser(userData)
    // TODO Fase 4: tidak ada pengalihan di sini. Login landing terjadi di dalam AuthModal
    // (?auth=login) dan pengunjung harus tetap di halaman yang sedang dibuka; kalau ada
    // returnUrl, AuthModal yang memutuskan, bukan context.
  }

  const logout = async () => {
    try {
      await axiosInstance.delete(AUTH_ENDPOINTS.logout)
    } catch (error) {
      console.error('Logout gagal:', error)
    } finally {
      setAccessToken(null)
      setUser(null)
      // Landing tidak punya /login — pulang ke beranda.
      window.location.href = '/'
    }
  }

  const value = { user, login, logout, isLoading }

  // PENTING: children SELALU dirender, termasuk saat isLoading.
  // Boilerplate menukar seluruh halaman dengan skeleton full-page di sini; di landing itu
  // mengosongkan homepage sebelum EntranceLoader sempat jalan. Konsumen yang butuh status
  // pemulihan sesi membaca isLoading sendiri lewat useAuth().
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider')
  }
  return context
}
