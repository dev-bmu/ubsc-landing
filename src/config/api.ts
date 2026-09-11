// ===== Path API ubsc-api =====
// axiosInstance memakai baseURL '/api' (same-origin; di dev di-rewrite ke ubsc-api oleh
// next.config.ts, di produksi diterminasi nginx), jadi SELURUH path di file ini relatif
// terhadap '/api'.

// ===== Audience auth =====
// ubsc-api mendaftarkan audience sebagai SEGMEN URL, bukan menebaknya dari header Origin
// (lihat ubsc-api/src/routes/details/auth.ts: authRoutes.use('/customer', ...) dan
// .use('/staff', ...)). Endpoint penuhnya: /api/auth/customer/login, /refresh, /logout,
// /sessions, /sessions/:id.
//
// Landing adalah situs customer, jadi nilainya SELALU '/auth/customer'. Jangan pernah
// memakai '/auth/...' polos seperti boilerplate admin: hasilnya 404, bukan 401, dan 404
// itu menyamar jadi "sesi habis" di interceptor — gagalnya sunyi dan menyesatkan.
export const AUTH_BASE = '/auth/customer'

// Satu daftar path auth untuk semua pemakai (lib/axios.ts, services/Auth.ts,
// context/AuthContext.tsx). Interceptor 401 mencocokkan url request ke konstanta yang
// SAMA dengan yang dipakai saat memanggil, supaya penjaga "endpoint auth tidak boleh
// memicu refresh" tidak bisa meleset saat path berubah.
export const AUTH_ENDPOINTS = {
  login: `${AUTH_BASE}/login`,
  refresh: `${AUTH_BASE}/refresh`,
  logout: `${AUTH_BASE}/logout`,
  sessions: `${AUTH_BASE}/sessions`,
  session: (sessionId: string) => `${AUTH_BASE}/sessions/${sessionId}`
} as const

// ===== Cookie sesi customer =====
// Ditetapkan ubsc-api/src/services/auth-services.ts:
//   ubsc_c_refresh      httpOnly, Path=/api/auth  -> SENGAJA tidak terlihat di path '/'
//   ubsc_c_role         non-httpOnly, Path=/       -> penanda "ada sesi" untuk middleware
//   ubsc_c_permissions  non-httpOnly, Path=/       -> tidak dipakai landing (tidak ada RBAC staff)
//
// Nama cookie staff (ubsc_s_*) milik origin admin dan tidak pernah disentuh repo ini.
export const CUSTOMER_SESSION_COOKIE = 'ubsc_c_role'
