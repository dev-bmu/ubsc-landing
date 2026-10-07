/**
 * Gambar kartu member (E-Card) di <canvas> — catatan client 2026-09-28: kartu harus berbentuk kartu
 * dan bisa diunduh. Satu gambar dipakai untuk tampilan DAN unduhan PNG, jadi yang disimpan pelanggan
 * sama persis dengan yang dilihatnya. Ukuran CR80 (85,6 × 54 mm) pada 300 dpi.
 */

import { sameOriginMedia } from '@/config/media'

export const CARD_WIDTH = 1012
export const CARD_HEIGHT = 638

export interface MemberCardContent {
  name: string
  customerNumber: string
  planName: string
  /** Label + tanggal di kolom kanan, mis. 'BERLAKU S.D.' / '28 Oktober 2026'. */
  validityLabel: string
  validityValue: string
  photoUrl: string | null
  /** Foto sudah diunggah tapi belum disetujui staff — digambar dengan penanda MENUNGGU VERIFIKASI. */
  photoPending: boolean
}

const NAVY = '#0B1E3B'
const ORANGE = '#E35336'
const DISPLAY = '"Clash Display", "BDO Grotesk", sans-serif'
const TEXT = '"BDO Grotesk", sans-serif'

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    // Mode CORS wajib: tanpa itu canvas jadi "tainted" dan unduhan PNG gagal. CDN R2 tidak mengirim
    // Access-Control-Allow-Origin, jadi URL CDN dibaca lewat proxy same-origin (sameOriginMedia).
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Potong teks dengan elipsis supaya muat di lebar tertentu. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let cut = text
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1)
  return `${cut.trimEnd()}…`
}

/** Kecilkan font sampai muat (nama panjang), baru terakhir dipotong elipsis. */
function fitSize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: (size: number) => string, sizes: number[]): string {
  for (const size of sizes) {
    ctx.font = font(size)
    if (ctx.measureText(text).width <= maxWidth) return text
  }
  return fit(ctx, text, maxWidth)
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.font = `600 20px ${TEXT}`
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.letterSpacing = '3px'
  ctx.fillText(text, x, y)
  ctx.letterSpacing = '0px'
}

export async function drawMemberCard(canvas: HTMLCanvasElement, card: MemberCardContent, qr: HTMLCanvasElement | null): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  await Promise.all([`700 46px ${DISPLAY}`, `600 28px ${TEXT}`].map((font) => document.fonts.load(font).catch(() => [])))
  const [photo, logo] = await Promise.all([card.photoUrl ? loadImage(sameOriginMedia(card.photoUrl)) : null, loadImage('/ubsc.png')])

  const W = CARD_WIDTH
  const H = CARD_HEIGHT
  ctx.clearRect(0, 0, W, H)
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(0, 0, W, H, 36)
  ctx.clip()

  // Latar: navy bergradasi + cahaya oranye di pojok kanan atas.
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#13294d')
  bg.addColorStop(0.55, NAVY)
  bg.addColorStop(1, '#0a1428')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W - 60, 40, 0, W - 60, 40, 520)
  glow.addColorStop(0, 'rgba(227,83,54,0.55)')
  glow.addColorStop(1, 'rgba(227,83,54,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 2
  for (const r of [260, 340, 420]) {
    ctx.beginPath()
    ctx.arc(W + 40, H + 60, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Kepala: logo + judul kartu.
  if (logo) {
    const h = 58
    ctx.drawImage(logo, 56, 44, (logo.width / logo.height) * h, h)
  } else {
    ctx.font = `700 30px ${DISPLAY}`
    ctx.fillStyle = '#ffffff'
    ctx.fillText('UB SPORT CENTER', 56, 86)
  }
  ctx.textAlign = 'right'
  ctx.font = `600 22px ${TEXT}`
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.letterSpacing = '4px'
  ctx.fillText('GYM MEMBER CARD', W - 56, 84)
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'

  // Foto wajah (object-fit: cover).
  const px = 56
  const py = 150
  const pw = 210
  const ph = 262
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(px, py, pw, ph, 22)
  ctx.clip()
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fillRect(px, py, pw, ph)
  if (photo) {
    const scale = Math.max(pw / photo.width, ph / photo.height)
    const sw = pw / scale
    const sh = ph / scale
    ctx.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, px, py, pw, ph)
    if (card.photoPending) {
      ctx.fillStyle = 'rgba(245,158,11,0.92)'
      ctx.fillRect(px, py + ph - 68, pw, 68)
      // 22px dua baris: satu baris tak muat selebar foto, dan 14px tak terbaca saat kartu diperkecil di ponsel.
      ctx.font = `700 22px ${TEXT}`
      ctx.fillStyle = NAVY
      ctx.textAlign = 'center'
      ctx.letterSpacing = '1px'
      ctx.fillText('MENUNGGU', px + pw / 2, py + ph - 40)
      ctx.fillText('VERIFIKASI', px + pw / 2, py + ph - 14)
      ctx.letterSpacing = '0px'
      ctx.textAlign = 'left'
    }
  } else {
    ctx.font = `600 20px ${TEXT}`
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.textAlign = 'center'
    ctx.fillText('Foto belum', px + pw / 2, py + ph / 2 - 6)
    ctx.fillText('disetujui', px + pw / 2, py + ph / 2 + 22)
    ctx.textAlign = 'left'
  }
  ctx.restore()
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(px, py, pw, ph, 22)
  ctx.stroke()

  // Identitas.
  const tx = 300
  const textWidth = 410
  label(ctx, 'NAMA', tx, 174)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(
    fitSize(ctx, card.name, textWidth, (size) => `700 ${size}px ${DISPLAY}`, [44, 38, 32]),
    tx,
    222
  )

  label(ctx, 'NO. MEMBER', tx, 274)
  ctx.font = `700 40px ${TEXT}`
  ctx.fillStyle = '#ffffff'
  ctx.letterSpacing = '2px'
  ctx.fillText(card.customerNumber, tx, 320)
  ctx.letterSpacing = '0px'

  label(ctx, 'PAKET', tx, 370)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(
    fitSize(ctx, card.planName, textWidth, (size) => `600 ${size}px ${TEXT}`, [28, 24]),
    tx,
    406
  )
  label(ctx, card.validityLabel, tx, 452)
  ctx.font = `600 28px ${TEXT}`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(card.validityValue, tx, 488)

  // QR di kotak putih — dipindai petugas di meja gym.
  const qx = 732
  const qy = 146
  const qs = 224
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(qx, qy, qs, qs, 20)
  ctx.fill()
  if (qr) ctx.drawImage(qr, qx + 18, qy + 18, qs - 36, qs - 36)
  ctx.font = `600 18px ${TEXT}`
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.textAlign = 'center'
  ctx.fillText('Pindai saat masuk gym', qx + qs / 2, qy + qs + 34)
  ctx.textAlign = 'left'

  // Pita bawah.
  const band = ctx.createLinearGradient(0, 0, W, 0)
  band.addColorStop(0, ORANGE)
  band.addColorStop(1, '#F08C78')
  ctx.fillStyle = band
  ctx.fillRect(0, H - 86, W, 86)
  ctx.font = `600 24px ${TEXT}`
  ctx.fillStyle = '#ffffff'
  ctx.fillText('Tunjukkan kartu ini + wajah Anda ke petugas', 56, H - 34)
  ctx.textAlign = 'right'
  ctx.font = `700 22px ${TEXT}`
  ctx.fillText('ubsportcenter.co.id', W - 56, H - 34)
  ctx.textAlign = 'left'

  ctx.restore()
}
