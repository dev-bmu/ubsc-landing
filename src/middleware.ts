import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CUSTOMER_SESSION_COOKIE } from '@/config/api'
import { isProtectedPath, routes } from '@/config/routes'

// ===== Gate area customer =====
// Landing adalah situs PUBLIK dengan beberapa halaman milik-sendiri customer. Tidak ada
// dashboard, tidak ada halaman /login, dan TIDAK ADA RBAC staff di sini — seluruh logika
// role/permission boilerplate sudah dibuang bersama src/config/permissions.ts. Satu-satunya
// pertanyaan yang dijawab berkas ini: "pengunjung ini punya sesi atau belum?"
//
// Yang dibaca cuma cookie mirror ubsc_c_role (non-httpOnly, Path=/). Cookie refresh
// ubsc_c_refresh SENGAJA ber-Path=/api/auth (ubsc-api/src/services/auth-services.ts), jadi
// TIDAK PERNAH terkirim ke request halaman di path '/'. Mensyaratkannya di sini — seperti
// boilerplate admin yang mengecek 'refresh_token' — berarti setiap customer yang sudah login
// tetap dianggap tamu dan dilempar keluar dari halamannya sendiri.
//
// Cookie mirror ini penanda, BUKAN otorisasi: non-httpOnly artinya siapa pun bisa
// mengarangnya dari console. Keputusan sebenarnya tetap milik ubsc-api yang memvalidasi
// token; yang gagal paling jauh cuma "halaman ter-render lalu request datanya 401".
const REDIRECT_PARAM_AUTH = 'auth'
const REDIRECT_PARAM_RETURN_URL = 'returnUrl'

// Login customer BUKAN halaman, melainkan modal di atas beranda yang dibuka lewat ?auth=login
// (src/config/routes.ts). Karena itu tujuan redirect adalah '/', bukan '/login' yang memang
// tidak ada di origin ini.
const buildAuthModalUrl = (request: NextRequest) => {
  const url = new URL(routes.home(), request.nextUrl)
  url.searchParams.set(REDIRECT_PARAM_AUTH, 'login')

  const requestedPathWithQuery = `${request.nextUrl.pathname}${request.nextUrl.search}`
  if (requestedPathWithQuery !== routes.home()) url.searchParams.set(REDIRECT_PARAM_RETURN_URL, requestedPathWithQuery)

  return url
}

export function middleware(request: NextRequest) {
  // Mayoritas halaman landing publik: keluar secepatnya supaya middleware tidak jadi biaya
  // tetap di jalur request halaman yang di-ISR.
  if (!isProtectedPath(request.nextUrl.pathname)) return NextResponse.next()

  const hasCustomerSession = Boolean(request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value)
  if (!hasCustomerSession) return NextResponse.redirect(buildAuthModalUrl(request))

  return NextResponse.next()
}

export const config = {
  // Matcher sengaja dibiarkan lebar dan penyaringan sesungguhnya dilakukan isProtectedPath():
  // daftar route yang tertutup hanya boleh hidup di satu tempat (src/config/routes.ts).
  // Menyalinnya ke matcher berarti dua daftar yang harus disamakan manual, dan saat keduanya
  // berbeda gate-nya mati tanpa error.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
