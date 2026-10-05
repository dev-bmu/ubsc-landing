// ===== Uji penumpukan (drift) pada dokumen panjang =====
//
// Sel harness kecil (128×84) tidak bisa melihat selisih sub-LayoutUnit (< 1/64px) per elemen yang MENUMPUK sepanjang
// dokumen. Terjadi nyata di gate Fase 2: Lightning CSS (optimize @tailwindcss/postcss di build produksi Next) menulis
// 1.1428571em sebagai 1.14286em, dan dokumen prose-sm 40 bagian bergeser 5px dari Laravel walau setiap sel lolos.
//
// Tool ini merender dokumen panjang dengan class ASLI Laravel — prose LegalShell/RichEditor dan tumpukan string
// tipografi dari korpus — di atas CSS oracle dan CSS kandidat, lalu membandingkan posisi setiap elemen. Vonis: selisih
// posisi harus TEPAT 0.
//
// Pemakaian: node drift.mjs <baseUrl harness> <korpus.json> <css kandidat> [lebar,lebar,...]
//   css kandidat: path lokal (mis. candidates/c6.out.css) atau path di server harness (/_next/static/css/…css)
import fs from 'node:fs'
import { chromium } from 'playwright-core'

const [, , base, corpusPath, candidateCss, widthsArg = '390,1280'] = process.argv
if (!base || !corpusPath || !candidateCss) {
  console.error('Pemakaian: node drift.mjs <baseUrl harness> <korpus.json> <css kandidat> [lebar,lebar,...]')
  process.exit(2)
}
const WIDTHS = widthsArg.split(',').map(Number)
const EDGE = process.env.HARNESS_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const REPEAT = 40

// ===== Dokumen uji =====

const proseSection = (i) => `
<h2>Bagian ${i} — Ketentuan penggunaan fasilitas</h2>
<p>Paragraf pembuka ${i}: pengguna wajib mematuhi tata tertib UB Sport Center, termasuk <a href="#">jadwal booking</a>, pembayaran, dan <strong>ketentuan pembatalan</strong>.</p>
<p>Paragraf kedua dengan <em>penekanan</em> dan <code>kode_booking</code> yang cukup panjang supaya teks membungkus beberapa baris pada lebar sempit maupun desktop.</p>
<h3>Sub-bagian ${i}.1</h3>
<ul><li>Butir pertama</li><li>Butir kedua yang lebih panjang dari yang pertama</li><li>Butir ketiga</li></ul>
<ol><li>Langkah satu</li><li>Langkah dua</li></ol>
<blockquote><p>Kutipan kebijakan ${i}.</p></blockquote>
<h4>Catatan</h4>
<p>Paragraf penutup ${i}.</p>
<hr>
<table><thead><tr><th>Kolom</th><th>Nilai</th></tr></thead><tbody><tr><td>A</td><td>1</td></tr><tr><td>B</td><td>2</td></tr></tbody></table>
<pre><code>contoh blok kode ${i}</code></pre>`
const proseBody = Array.from({ length: REPEAT }, (_, i) => proseSection(i + 1)).join('')

// String yang sama di v3 dan v4 (class prose tidak dimigrasi codemod) — LegalShell.tsx dan RichEditor.tsx.
const PROSE = [
  'prose prose-slate mt-8 max-w-none font-bdo prose-headings:font-bdo prose-headings:font-semibold prose-a:text-accent-red',
  'prose prose-sm max-w-none px-4 py-4'
]

// Tumpukan tipografi: string className korpus yang mengatur ukuran teks / line-height dan tetap mengalir normal.
const { pairs } = JSON.parse(fs.readFileSync(corpusPath, 'utf8'))
const TYPO = /(^|\s)([a-z0-9-]+:)*(leading-|text-(xs|sm|base|lg|[0-9]?xl|\[\d))/
const NOT_FLOW = /absolute|fixed|sticky|hidden|(^|\s|:)h-|max-h-|min-h-|overflow|line-clamp|truncate|flex|grid|inline|float|columns-|aspect-|translate|scale|rotate|contents|table|whitespace-nowrap/
const stack = pairs.filter((p) => TYPO.test(p.v3) && !NOT_FLOW.test(p.v3) && !NOT_FLOW.test(p.v4)).slice(0, 400)
const stackBody = (side) =>
  stack.map((p, i) => `<p class="${p[side].replace(/"/g, '&quot;')}">Baris ${i}: teks contoh UB Sport Center yang cukup panjang untuk membungkus dua sampai tiga baris di layar sempit.</p>`).join('')

const DOCS = [
  ...PROSE.map((cls) => ({ name: cls.split(' ').slice(0, 2).join(' '), baseline: `<article class="${cls}">${proseBody}</article>`, candidate: `<article class="${cls}">${proseBody}</article>` })),
  { name: `tumpukan tipografi korpus (${stack.length} string)`, baseline: `<div>${stackBody('v3')}</div>`, candidate: `<div>${stackBody('v4')}</div>` }
]

const page = (css, body) =>
  `<!doctype html><html lang="id"><head><meta charset="utf-8"><link rel="stylesheet" href="${css}"></head><body class="font-sans antialiased" style="margin:0;background:#fff"><main id="doc">${body}</main></body></html>`

// ===== Pengukuran =====

const browser = await chromium.launch({ executablePath: EDGE, args: ['--force-color-profile=srgb', '--font-render-hinting=none'] })
const localCss = !candidateCss.startsWith('/') ? fs.readFileSync(candidateCss, 'utf8') : null

async function measure(width, css, body) {
  const context = await browser.newContext({ viewport: { width, height: 900 } })
  const tab = await context.newPage()
  // Halaman & CSS lokal disajikan lewat route di origin server harness, supaya /fonts tetap satu origin.
  if (localCss) await tab.route(`${base}/drift-candidate.css`, (route) => route.fulfill({ contentType: 'text/css', body: localCss }))
  await tab.route(`${base}/drift.html`, (route) => route.fulfill({ contentType: 'text/html', body: page(css, body) }))
  await tab.goto(`${base}/drift.html`, { waitUntil: 'load', timeout: 120000 })
  await tab.evaluate(() => document.fonts.ready)
  const result = await tab.evaluate(() => {
    const doc = document.getElementById('doc')
    return { height: doc.getBoundingClientRect().height, tops: [...doc.querySelectorAll('*')].map((el) => el.getBoundingClientRect().top) }
  })
  await context.close()
  return result
}

let failed = 0
for (const width of WIDTHS) {
  for (const doc of DOCS) {
    const a = await measure(width, '/laravel.css', doc.baseline)
    const b = await measure(width, localCss ? '/drift-candidate.css' : candidateCss, doc.candidate)
    if (a.tops.length !== b.tops.length) throw new Error(`${doc.name}: jumlah elemen berbeda (${a.tops.length} vs ${b.tops.length})`)
    let maxDelta = 0
    let firstVisible = null
    a.tops.forEach((top, i) => {
      const delta = Math.abs(top - b.tops[i])
      maxDelta = Math.max(maxDelta, delta)
      if (firstVisible === null && delta >= 0.5) firstVisible = i
    })
    const ok = maxDelta === 0 && a.height === b.height
    if (!ok) failed++
    console.log(
      `${ok ? 'SAMA  ' : 'GESER '} ${String(width).padStart(4)}px  ${doc.name}: tinggi ${a.height} vs ${b.height} · selisih posisi maks ${maxDelta.toFixed(4)}px` +
        (firstVisible !== null ? ` · elemen ke-${firstVisible} sudah >= 0,5px` : '')
    )
  }
}
await browser.close()
console.log(failed ? `\nGAGAL: ${failed} dokumen bergeser` : `\nBERSIH: ${DOCS.length} dokumen × ${WIDTHS.length} lebar, 0 pergeseran`)
process.exit(failed ? 1 : 0)
