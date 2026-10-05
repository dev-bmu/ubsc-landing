// ===== Aritmetika grid bulan, Senin dulu =====
// Port dari UBSC-LARAVEL/resources/js/lib/calendar.ts. Di Laravel modul ini diangkat keluar dari
// Pages/Admin/Settings/Schedules/Index.tsx supaya kalender staf dan kalender kelas customer tidak
// melenceng jadi dua pendapat berbeda soal di mana minggu dimulai. Aritmetika murni — proyek ini
// tidak punya date library dan memang tidak butuh untuk ini.
//
// SATU perbedaan yang disengaja dari sumber Laravel: pemformatan tanggal dan rupiah TIDAK
// diimplementasikan ulang di sini. Laravel memakai Intl.DateTimeFormat lokal di dalam file ini;
// di repo Next semua pemformatan wajib lewat '@/lib/format' (R13: satu implementasi untuk seluruh
// sistem). `formatCalendarDateIntl` memang sudah didokumentasikan sebagai padanan eksak pola
// `LONG_DATE.format(new Date(`${dateStr}T12:00:00`))` milik Laravel, dan `formatRupiah` sudah
// menghasilkan bentuk "Rp " + toLocaleString('id-ID') yang sama persis.
import { formatCalendarDateIntl, formatRupiah, toJakartaDateKey } from '@/lib/format'

export const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] as const

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

export type Weekday = (typeof WEEKDAYS)[number]

export const WEEKDAY_ID: Record<Weekday, string> = {
  Monday: 'Senin',
  Tuesday: 'Selasa',
  Wednesday: 'Rabu',
  Thursday: 'Kamis',
  Friday: 'Jumat',
  Saturday: 'Sabtu',
  Sunday: 'Minggu'
}

export function padTwo(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Minggu-minggu sebuah bulan sebagai string `YYYY-MM-DD`, `null` untuk sel padding.
 * `month` 1-12.
 */
export function buildCalendarWeeks(month: number, year: number): (string | null)[][] {
  const firstDow = new Date(year, month - 1, 1).getDay()
  const startOffset = (firstDow + 6) % 7 // Minggu JS mulai Minggu; milik kita mulai Senin.
  const daysInMonth = new Date(year, month, 0).getDate()

  const cells: (string | null)[] = Array(startOffset).fill(null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${year}-${padTwo(month)}-${padTwo(day)}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return weeks
}

export function dayNumber(dateStr: string): number {
  return Number(dateStr.slice(8, 10))
}

/** "2026-10" → {month: 10, year: 2026} */
export function parseMonthKey(key: string): { month: number; year: number } {
  const [year, month] = key.split('-').map(Number)
  return { month, year }
}

export function monthKey(month: number, year: number): string {
  return `${year}-${padTwo(month)}`
}

export function shiftMonth(key: string, delta: number): string {
  const { month, year } = parseMonthKey(key)
  const date = new Date(year, month - 1 + delta, 1)
  return monthKey(date.getMonth() + 1, date.getFullYear())
}

/**
 * Bulan berjalan menurut Asia/Jakarta.
 *
 * Laravel memakai zona lokal browser; di Next nilai ini ikut dirender saat SSR (server UTC), jadi
 * zona dipaku ke WIB lewat toJakartaDateKey — kalau tidak, di tanggal 1 pukul 00.30 WIB server
 * masih menyebut bulan sebelumnya dan tombol "bulan sebelumnya" ikut salah.
 */
export function currentMonthKey(): string {
  return toJakartaDateKey(new Date()).slice(0, 7)
}

/** Hari ini "YYYY-MM-DD" menurut Asia/Jakarta — alasan zona sama seperti currentMonthKey(). */
export function todayStr(): string {
  return toJakartaDateKey(new Date())
}

/** "Senin, 6 Oktober 2026" */
export function formatLongDate(dateStr: string): string {
  return formatCalendarDateIntl(dateStr, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** "6 Okt" */
export function formatShortDate(dateStr: string): string {
  return formatCalendarDateIntl(dateStr, { day: 'numeric', month: 'short' })
}

/** Alias nama Laravel; implementasinya tetap satu-satunya milik '@/lib/format'. */
export const rupiah = formatRupiah
