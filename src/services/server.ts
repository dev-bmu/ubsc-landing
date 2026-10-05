import 'server-only'

import type {
  ApiSuccess,
  ApprovedReviewIndexDto,
  BookingFacilityIndexDto,
  FacilityDto,
  HomeDto,
  MembershipPlanDto,
  NewsDto
} from '@/types/contracts/contracts'

// ===== Fetch data publik dari sisi server (RSC) =====
// Padanan `HandleInertiaRequests::share` + `HomeController@index` Laravel: data beranda diambil di
// server lalu diturunkan sebagai prop. Yang PUBLIK saja di sini (announcements, gymTraffic, dan
// seluruh isi HomeDto); yang per-user (pending_payment) diambil klien lewat TanStack Query di Navbar,
// supaya beranda tidak jatuh ke force-dynamic.
//
// baseURL diambil dari API_BASE_URL. Di dev, rewrites() next.config hanya menangani permintaan dari
// BROWSER; fetch RSC berjalan di proses Node dan harus menembak origin API secara langsung. Di
// produksi API_BASE_URL menunjuk origin internal ubsc-api (nginx tidak ikut, ini server-to-server).
function apiBaseUrl(): string {
  return process.env.API_BASE_URL ?? 'http://localhost:4020'
}

/**
 * Ambil agregat beranda. `revalidate` per pemanggil (beranda: 300s, sesuai page.tsx).
 * `tags` memungkinkan invalidasi terarah dari API setelah tulis CMS (revalidateTag).
 *
 * Melempar bila API tidak 2xx atau envelope tidak `success` — pemanggil (Server Component beranda)
 * yang memutuskan fallback. Semua komponen beranda sudah punya fallback statis sendiri
 * (FALLBACK_MEMBERSHIP_PLANS, DUMMY_IMAGES, dst), jadi kegagalan tidak mengosongkan halaman.
 */
export async function getHome(options?: { revalidate?: number; tags?: string[] }): Promise<HomeDto> {
  const res = await fetch(`${apiBaseUrl()}/api/public/home`, {
    headers: { accept: 'application/json' },
    next: {
      revalidate: options?.revalidate ?? 300,
      tags: options?.tags ?? ['home']
    }
  })

  if (!res.ok) {
    throw new Error(`getHome: API mengembalikan ${res.status}`)
  }

  const body = (await res.json()) as ApiSuccess<HomeDto>
  if (!body.success) {
    throw new Error('getHome: envelope tidak success')
  }

  return body.data
}

// ===== Koleksi granular (Fase 5) =====
// Halaman selain beranda hanya butuh satu atau dua koleksi, jadi mereka menembak endpoint granular
// alih-alih /api/public/home. `revalidate` mengikuti rencana cache per halaman di Rewrite.md.
//
// Kegagalan SENGAJA dilempar, sama seperti getHome: pemanggil (Server Component halaman) yang
// memutuskan fallback, dan setiap komponen sudah punya fallback statisnya sendiri.

async function getPublic<T>(path: string, tag: string, revalidate: number): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}/api/public/${path}`, {
    headers: { accept: 'application/json' },
    next: { revalidate, tags: [tag] }
  })

  if (!res.ok) throw new Error(`getPublic(${path}): API mengembalikan ${res.status}`)

  const body = (await res.json()) as ApiSuccess<T>
  if (!body.success) throw new Error(`getPublic(${path}): envelope tidak success`)

  return body.data
}

/** Paket membership aktif — dipakai /pricing. ISR 600s. */
export function getMembershipPlans(revalidate = 600): Promise<MembershipPlanDto[]> {
  return getPublic<MembershipPlanDto[]>('membership-plans', 'membership-plans', revalidate)
}

/** Fasilitas aktif beserta harga — dipakai /pricing dan /facilities. ISR 600s. */
export function getFacilities(revalidate = 600): Promise<FacilityDto[]> {
  return getPublic<FacilityDto[]>('facilities', 'facilities', revalidate)
}

/**
 * SELURUH berita terbit — dipakai /news. ISR 120s.
 * Beda dari beranda yang hanya memakai 7 teratas lewat HomeDto; endpoint ini memang tidak dibatasi,
 * sama seperti PublicNewsController::index Laravel.
 */
export function getNews(revalidate = 120): Promise<NewsDto[]> {
  return getPublic<NewsDto[]>('news', 'news', revalidate)
}

/** Fasilitas + unit untuk halaman /booking. ISR 600s. */
export function getBookingFacilities(revalidate = 600): Promise<BookingFacilityIndexDto> {
  return getPublic<BookingFacilityIndexDto>('booking/facilities', 'booking-facilities', revalidate)
}

/** Ulasan yang sudah disetujui, untuk section ulasan di /booking. ISR 600s. */
export function getApprovedReviews(revalidate = 600): Promise<ApprovedReviewIndexDto> {
  return getPublic<ApprovedReviewIndexDto>('booking/reviews', 'booking-reviews', revalidate)
}
