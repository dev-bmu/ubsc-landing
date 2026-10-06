import { timingSafeEqual } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { SITE_NAME, SITE_URL } from '@/config/site'
import { ogSig } from '@/lib/seo'

// ===== GET /og?title=&label=&sig= — kartu OG bawaan (1200x630 PNG) =====
// Cadangan terakhir bila halaman/artikel tidak punya OG image dari admin (generatedOgUrl di lib/seo.ts).
// SENGAJA bukan opengraph-image.tsx berbasis berkas: konvensi itu menimpa OG image yang diatur admin.
// Font bawaan next/og (tanpa bold); BDO Grotesk hanya ada sebagai woff2 yang tidak didukung satori.

const MAX_TITLE = 110
const MAX_LABEL = 32

// Logo putih (dipakai Navbar di atas latar gelap), dibaca sekali per proses.
let logoDataUrl: Promise<string> | null = null
const loadLogo = () =>
  (logoDataUrl ??= readFile(path.join(process.cwd(), 'public', 'ubsc.png')).then((file) => `data:image/png;base64,${file.toString('base64')}`))

const clip = (value: string, max: number) => {
  const text = value.replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text
}

export async function GET(request: NextRequest) {
  // Hanya URL bertanda tangan generatedOgUrl (HMAC REVALIDATE_SECRET) yang dirender: teks bebas dari luar
  // = spoofing kartu bermerek + render satori dan cache font next/og (tak pernah dibuang) per query unik.
  const q = request.nextUrl.searchParams
  const raw = q.get('title') ?? ''
  const rawLabel = q.get('label') ?? ''
  const given = Buffer.from(q.get('sig') ?? '')
  const expected = Buffer.from(ogSig(raw, rawLabel))
  if (!process.env.REVALIDATE_SECRET || given.length !== expected.length || !timingSafeEqual(given, expected)) return new Response(null, { status: 404 })

  const title = clip(raw, MAX_TITLE) || SITE_NAME
  const label = clip(rawLabel, MAX_LABEL)
  const logo = await loadLogo()

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        color: 'white',
        background: 'linear-gradient(135deg, #071530 0%, #0e2444 55%, #15678d 100%)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- markup satori (ImageResponse), bukan DOM; next/image tidak berlaku */}
        <img src={logo} width={160} height={81} alt={SITE_NAME} />
        <div style={{ display: 'flex', fontSize: 26, color: 'rgba(255,255,255,0.7)' }}>{new URL(SITE_URL).host}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {label ? (
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              marginBottom: 28,
              padding: '8px 22px',
              borderRadius: 8,
              fontSize: 28,
              background: 'linear-gradient(to right, #790a0a, #FF0000)'
            }}
          >
            {label}
          </div>
        ) : null}
        <div style={{ display: 'flex', fontSize: title.length > 60 ? 54 : 66, lineHeight: 1.15, letterSpacing: '-0.02em', wordBreak: 'break-word' }}>{title}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', fontSize: 26, color: 'rgba(255,255,255,0.85)' }}>
        <div style={{ display: 'flex', width: 56, height: 6, marginRight: 20, background: '#FF0000' }} />
        {SITE_NAME} · Universitas Brawijaya, Malang
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      // Isi ditentukan sepenuhnya oleh query (judul berubah = URL berubah), jadi aman di-cache lama.
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800' }
    }
  )
}
