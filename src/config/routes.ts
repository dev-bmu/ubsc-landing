// ===== Route builder halaman landing (publik + customer) =====
// Pengganti `route()` Ziggy dari Laravel. Isinya HANYA URL halaman.
//
// Yang sengaja TIDAK ada di sini: endpoint tulis (POST/PUT/PATCH/DELETE) dan endpoint data
// yang kebetulan GET tapi mengembalikan JSON — booking.slots, booking.month, user.transactions,
// reviews.store, profile.update, dan kawan-kawan. Semuanya menjadi path API di dalam
// src/services/*.ts pada fase domain masing-masing dan hilang total dari kode komponen.
// Peta kerjanya: ubsc-api/docs/route-inventory.md
//
// Slug bahasa Indonesia dipertahankan apa adanya dari Laravel (riwayat-booking, kebijakan-privasi,
// kebijakan-pengembalian, syarat-ketentuan, pembayaran, coming-soon) — URL publik tidak boleh berubah.

// Catatan tipe: setiap builder di bawah diakhiri `as const` supaya tipe kembaliannya tetap literal
// ('/', '/booking', dst), bukan `string` yang melebar. `typedRoutes: true` sudah aktif di next.config.ts,
// dan di sana `Link href` bertipe union route yang benar-benar ada — nilai `string` biasa ditolak saat
// `next build`. Tanpa `as const`, aturan ESLint no-restricted-syntax (wajib pakai builder ini) dan
// typedRoutes saling meniadakan: href literal gagal lint, href dari builder gagal build.
// `Route` dari 'next' sengaja tidak dipakai di sini — tipe itu baru ada setelah `next build` menulis
// .next/types, jadi `tsc --noEmit` di clone yang masih bersih akan gagal me-resolve-nya.
export const routes = {
  // ===== Halaman publik =====
  home: () => '/' as const,
  about: () => '/about' as const,
  pricing: () => '/pricing' as const,
  facilities: () => '/facilities' as const,
  news: () => '/news' as const,
  branches: (slug: string) => `/branches/${slug}` as const,
  comingSoon: () => '/coming-soon' as const,

  // ===== Halaman legal =====
  legalTerms: () => '/syarat-ketentuan' as const,
  legalPrivacy: () => '/kebijakan-privasi' as const,
  legalRefund: () => '/kebijakan-pengembalian' as const,

  // ===== Booking + area customer =====
  booking: () => '/booking' as const,
  // bookingId dari Laravel adalah integer; dipakai sebagai string supaya aman untuk segmen URL.
  bookingPayment: (bookingId: string) => `/booking/${bookingId}/pembayaran` as const,
  bookingHistory: () => '/riwayat-booking' as const,

  // ===== Halaman auth yang memang berdiri sendiri =====
  // Hanya empat ini yang benar-benar halaman. Login/register memakai modal, lihat authModal di bawah.
  forgotPassword: () => '/forgot-password' as const,
  resetPassword: (token: string) => `/reset-password/${token}` as const,
  confirmPassword: () => '/confirm-password' as const,
  verifyEmail: () => '/verify-email' as const
} as const

// ===== Modal auth (login / register) =====
// Login dan register customer BUKAN halaman. Mekanismenya modal di atas beranda yang dibuka lewat
// query `?auth=login` atau `?auth=register`. Laravel lama pun sudah begitu: GET /login dan
// GET /register di routes/auth.php hanya `redirect` ke /?auth=login dan /?auth=register.
//
// JANGAN membuat halaman /login di landing — origin ini tidak punya halaman login sama sekali.
// Halaman login yang ada adalah milik admin, di repo dan origin terpisah (dash.ubsportcenter.co.id).
//
// JANGAN membaca query ini dengan useSearchParams(). Hook itu memaksa route menjadi dinamis dan
// diam-diam mematikan strategi ISR untuk seluruh subtree — halaman tetap ter-render, tidak ada
// error, hanya cache-nya yang hilang, jadi kerusakannya tidak kelihatan sampai produksi.
// Sebagai gantinya: baca window.location.search di dalam useEffect pada komponen klien modal
// (komponen itu sudah dinamis dan tidak menular ke shell), atau terima prop searchParams dari
// Server Component halaman bila memang halaman itu sudah dinamis.
export type AuthModalMode = 'login' | 'register'

export const authModal = (mode: AuthModalMode) => `/?auth=${mode}` as const

// ===== Pencocokan path aktif =====
// Pengganti `route().current('x.*')` Ziggy: matchPrefix(usePathname(), '/booking').
// Definisinya ada DI SINI, bukan di config/permissions.ts seperti boilerplate: landing tidak punya
// RBAC staff sama sekali (lihat catatan PROTECTED_ROUTE di bawah), jadi file permissions.ts sudah
// dihapus dari repo ini dan routes.ts adalah satu-satunya rumah untuk urusan path halaman.
export const matchPrefix = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`)

// ===== Route yang wajib login (audience customer) =====
// Landing TIDAK punya route ber-permission staff. Yang tertutup hanyalah area milik-sendiri
// customer, dan keduanya baru dibangun di Fase 6 — didaftarkan sekarang supaya gate-nya sudah
// benar begitu halamannya lahir, bukan ditambahkan belakangan saat orang lupa.
//
// /booking SENDIRI PUBLIK (grid jadwal, ISR 600s). Yang tertutup cuma langkah pembayarannya,
// dan bentuk URL-nya /booking/{id}/pembayaran — id di TENGAH, jadi tidak bisa diwakili prefix.
// Karena itu ada dua daftar: prefix untuk yang memang berawalan tetap, pola untuk yang bersegmen
// dinamis. Menjadikan '/booking' sebagai prefix protected akan menutup halaman publiknya.
export const PROTECTED_ROUTE_PREFIXES = ['/riwayat-booking'] as const

export const PROTECTED_ROUTE_PATTERNS = [/^\/booking\/[^/]+\/pembayaran\/?$/] as const

export const isProtectedPath = (path: string): boolean =>
  PROTECTED_ROUTE_PREFIXES.some((prefix) => matchPrefix(path, prefix)) || PROTECTED_ROUTE_PATTERNS.some((pattern) => pattern.test(path))

// TODO Fase 5: `typedRoutes` sudah aktif di next.config.ts, tapi penegakannya baru mencakup halaman yang
// benar-benar ada ('/' dan '/unauthorized'). Builder di atas yang halamannya belum dibuat akan ditolak
// `next build` begitu dipakai di `href` — buat halamannya pada fase yang bersangkutan, jangan
// melonggarkan tipenya.
