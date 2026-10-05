import { timingSafeEqual } from 'crypto'
import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

// ===== POST /revalidate — dipanggil ubsc-api setelah admin mengubah isi halaman publik =====
// Halaman publik di-ISR 2-10 menit; route ini membuang tag cache fetch-nya (services/server.ts) supaya
// perubahan admin — mis. fasilitas dinonaktifkan — langsung tampil. SENGAJA bukan di bawah /api: di
// produksi nginx meneruskan /api/* ke ubsc-api, jadi API memanggil port Next ini langsung
// (LANDING_REVALIDATE_URL). Rahasia bersama di header x-revalidate-secret.

const ALLOWED_TAGS = new Set(['home', 'facilities', 'booking-facilities', 'membership-plans', 'news', 'booking-reviews'])

function secretMatches(given: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  if (!secretMatches(request.headers.get('x-revalidate-secret'))) return NextResponse.json({ ok: false }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null
  const tags = Array.isArray(body?.tags) ? body.tags.filter((tag): tag is string => typeof tag === 'string' && ALLOWED_TAGS.has(tag)) : []
  for (const tag of tags) revalidateTag(tag)
  return NextResponse.json({ ok: true, revalidated: tags })
}
