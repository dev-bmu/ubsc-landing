// Debug sekali pakai: apakah pembulatan presisi Lightning CSS (1.1428571em -> 1.14286em) menumpuk di dokumen prose panjang?
// node .scratch/prose-stress.mjs <baseUrl harness> <path css kandidat di server> [lebar]
import { chromium } from 'playwright-core'

const [, , base, candidateCss, widthArg = '1280'] = process.argv
const width = Number(widthArg)
const CLS = [
  'prose prose-slate mt-8 max-w-none font-bdo prose-headings:font-bdo prose-headings:font-semibold prose-a:text-accent-red',
  'prose',
  'prose prose-sm',
  'prose prose-lg'
]

const block = (i) => `
<h2>Bagian ${i} — Ketentuan penggunaan fasilitas</h2>
<p>Paragraf pembuka ${i}: pengguna wajib mematuhi tata tertib UB Sport Center, termasuk <a href="#">jadwal booking</a>, pembayaran, dan <strong>ketentuan pembatalan</strong> yang berlaku.</p>
<p>Paragraf kedua dengan <em>penekanan</em> dan <code>kode_booking</code> yang cukup panjang supaya teks membungkus beberapa baris pada lebar sempit maupun lebar penuh layar desktop.</p>
<h3>Sub-bagian ${i}.1</h3>
<ul><li>Butir pertama daftar</li><li>Butir kedua daftar yang lebih panjang dari yang pertama</li><li>Butir ketiga</li></ul>
<ol><li>Langkah satu</li><li>Langkah dua</li></ol>
<blockquote><p>Kutipan kebijakan ${i}.</p></blockquote>
<h4>Catatan</h4>
<p>Paragraf penutup ${i}.</p>
<hr>
<table><thead><tr><th>Kolom</th><th>Nilai</th></tr></thead><tbody><tr><td>A</td><td>1</td></tr><tr><td>B</td><td>2</td></tr></tbody></table>
<pre><code>contoh blok kode ${i}</code></pre>
`

const html = (css, cls) => `<!doctype html><html lang="id"><head><meta charset="utf-8"><link rel="stylesheet" href="${css}"></head>
<body class="font-sans antialiased" style="margin:0;background:#fff"><article id="doc" class="${cls}">${Array.from({ length: 40 }, (_, i) => block(i + 1)).join('')}</article></body></html>`

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' })
for (const cls of CLS) {
  const result = []
  for (const css of ['/laravel.css', candidateCss]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    // CSS kandidat berupa path lokal (bukan URL server): sajikan lewat route supaya tetap satu origin dengan /fonts.
    const local = !css.startsWith('/')
    if (local) {
      const body = (await import('node:fs')).readFileSync(css, 'utf8')
      await page.route(`${base}/probe-candidate.css`, (route) => route.fulfill({ contentType: 'text/css', body }))
    }
    const href = local ? '/probe-candidate.css' : css
    await page.route(`${base}/probe-prose.html`, (route) => route.fulfill({ contentType: 'text/html', body: html(href, cls) }))
    await page.goto(`${base}/probe-prose.html`, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    result.push(
      await page.evaluate(() => {
        const doc = document.getElementById('doc')
        const kids = [...doc.querySelectorAll('h2, p, li, blockquote, pre, table, hr, h3, h4')]
        return { height: doc.getBoundingClientRect().height, tops: kids.map((k) => k.getBoundingClientRect().top) }
      })
    )
    await context.close()
  }
  const [a, b] = result
  let maxDelta = 0
  let firstOver = null
  a.tops.forEach((t, i) => {
    const d = Math.abs(t - b.tops[i])
    if (d > maxDelta) maxDelta = d
    if (firstOver === null && d >= 0.5) firstOver = i
  })
  console.log(`${cls}\n  tinggi oracle ${a.height} · kandidat ${b.height} · selisih ${(b.height - a.height).toFixed(4)}px · max selisih posisi ${maxDelta.toFixed(4)}px · elemen pertama >=0.5px: ${firstOver}`)
}
await browser.close()
