// Merakit pasangan halaman dengan DOM IDENTIK — hanya string class yang berbeda:
//   out/baseline-<k>.html   class v3 + CSS produksi Laravel
//   out/candidate-<k>.html  class v4 + CSS v4 kandidat
// plus out/candidate-source.txt (seluruh string class kandidat, mentah) untuk dipindai Tailwind v4, dan
// out/pages.json (manifest halaman).
//
// Sumber class v4 per jenis sel:
//   - utilitas, bespoke, bersarang, hazard: Styleguide.v4.tsx (codemod pada satu class per sel)
//   - combo (string className asli): `v4` yang dibawa sel itu sendiri — literal dari SUMBER MIGRASI
//     (codemod + koreksi R0–R3), yaitu teks yang benar-benar di-port di Fase 4–8. Lihat gen-cells.mjs.
//
// Paginasi: satu halaman berisi 8.000+ sel setinggi ratusan ribu piksel di 390px, dan screenshot
// Chromium untuk halaman sepanjang itu timeout. Setiap halaman dibatasi PAGE_SIZE sel.
//
// Pemakaian: node build-pages.mjs <harness-dir> [--page-size=500]
import fs from 'node:fs'

const [, , harnessDir, ...flags] = process.argv
const opt = Object.fromEntries(flags.map((f) => f.replace(/^--/, '').split('=')))
const PAGE_SIZE = Number(opt['page-size'] || 500)
const cells = JSON.parse(fs.readFileSync(`${harnessDir}/cells.json`, 'utf8'))

// ===== Peta class v3 -> v4 per sel, dibaca dari Styleguide.v4.tsx hasil codemod =====
const v4Source = fs.readFileSync(`${harnessDir}/Styleguide.v4.tsx`, 'utf8')
const v4 = new Map()
for (const m of v4Source.matchAll(/data-cell="([^"]+)"(?: data-depth="(\d+)")? className=\{("(?:[^"\\]|\\.)*")\}/g)) {
  v4.set(m[2] === undefined ? m[1] : `${m[1]}:${m[2]}`, JSON.parse(m[3]))
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const attrs = (a = {}) =>
  Object.entries(a)
    .map(([k, v]) => ` ${k}="${esc(v)}"`)
    .join('')
const VOID = new Set(['input', 'img', 'hr'])

const PROBE_TEXT = '<span>Aa</span><span>Bb</span>'
const renamed = []

function renderCell(cell, side) {
  const pick = (key, v3cls, ownV4) => {
    if (side === 'baseline') return v3cls
    const mapped = ownV4 ?? v4.get(key)
    if (mapped === undefined) throw new Error(`class v4 untuk sel ${key} tidak ditemukan`)
    // Peta rename per class hanya dari sel satu-class; combo membawa string utuhnya sendiri.
    if (ownV4 === undefined && mapped !== v3cls) renamed.push([v3cls, mapped])
    return mapped
  }

  if (cell.kind === 'nested') {
    let inner = PROBE_TEXT
    for (let i = cell.parts.length - 1; i >= 0; i--) {
      inner = `<div data-probe class="${esc(pick(`${cell.id}:${i}`, cell.parts[i]))}">${inner}</div>`
    }
    return `<div class="sg-cell sg-wide" data-cell="${cell.id}" title="${esc(cell.label)}">${inner}</div>`
  }

  const cls = cell.cls ? ` class="${esc(pick(cell.id, cell.cls, cell.v4))}"` : ''
  const body = cell.children ?? (cell.text != null ? esc(cell.text) : PROBE_TEXT)
  const el = VOID.has(cell.tag) ? `<${cell.tag} data-probe${cls}${attrs(cell.attrs)}>` : `<${cell.tag} data-probe${cls}${attrs(cell.attrs)}>${body}</${cell.tag}>`
  const wide = cell.kind === 'hazard' || cell.kind === 'font' ? ' sg-wide' : ''
  return `<div class="sg-cell${wide}" data-cell="${cell.id}" title="${esc(cell.label)}">${el}</div>`
}

// Gaya pembantu grid. Tanpa layer dan ditulis setelah CSS yang diuji, sehingga menang di KEDUA sisi —
// gaya ini tidak boleh ikut menjadi variabel yang dibandingkan.
// FREEZE dipasang di <head> SEBELUM render pertama, bukan disuntik setelah load: animasi yang sempat
// berjalan beberapa milidetik sebelum dijeda menghasilkan frame yang berbeda di kedua halaman dan
// muncul sebagai selisih palsu. Dengan delay negatif tetap sejak awal, frame-nya deterministik.
const HELPER = `
*,*::before,*::after{animation-play-state:paused!important;animation-delay:-0.7s!important;transition:none!important;caret-color:transparent!important}
.sg-grid{display:flex;flex-wrap:wrap;gap:0;padding:0;margin:0;background:#ffffff}
.sg-cell{position:relative;width:128px;height:84px;overflow:hidden;contain:strict;box-sizing:border-box;padding:6px;margin:0;background:#ffffff;flex:none}
.sg-cell.sg-wide{width:256px;height:168px}
`

// <body class="font-sans antialiased"> meniru resources/views/app.blade.php Laravel — dan root layout ubsc-landing
// yang dirender gate /styleguide — supaya warisan font-family dari body sama dengan halaman sungguhan.
function page(side, cssHref, pageCells, title) {
  const body = pageCells.map((c) => renderCell(c, side)).join('\n')
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="${cssHref}">
<style>${HELPER}</style>
</head>
<body class="font-sans antialiased">
<main class="sg-grid">
${body}
</main>
</body>
</html>
`
}

fs.rmSync(`${harnessDir}/out`, { recursive: true, force: true })
fs.mkdirSync(`${harnessDir}/out`, { recursive: true })

const pages = []
for (let k = 0; k * PAGE_SIZE < cells.length; k++) {
  const slice = cells.slice(k * PAGE_SIZE, (k + 1) * PAGE_SIZE)
  fs.writeFileSync(`${harnessDir}/out/baseline-${k}.html`, page('baseline', '/laravel.css', slice, `styleguide baseline ${k}`))
  fs.writeFileSync(`${harnessDir}/out/candidate-${k}.html`, page('candidate', '/candidate.css', slice, `styleguide kandidat ${k}`))
  pages.push({ page: k, first: slice[0].id, last: slice[slice.length - 1].id, cells: slice.length })
}
fs.writeFileSync(`${harnessDir}/out/pages.json`, JSON.stringify({ pageSize: PAGE_SIZE, pages }, null, 1))

// Berkas sumber yang dipindai Tailwind v4: SEMUA string class kandidat, MENTAH, satu per baris. Bukan HTML —
// atribut HTML meng-escape & menjadi &amp;, dan pemindai Tailwind membaca teks berkas apa adanya, sehingga
// class seperti xl:[&>*:nth-child(2)]:ml-[30px] tidak pernah ter-generate (terukur: margin anak hilang)
// padahal browser tetap men-decode atribut dan menerapkan class-nya. Di TSX sungguhan & ditulis mentah.
const rawClasses = new Set()
for (const cell of cells) {
  if (cell.kind === 'nested') cell.parts.forEach((_, i) => rawClasses.add(v4.get(`${cell.id}:${i}`)))
  else if (cell.cls) rawClasses.add(cell.v4 ?? v4.get(cell.id))
}
fs.writeFileSync(`${harnessDir}/out/candidate-source.txt`, [...rawClasses].join('\n'))

const uniq = [...new Map(renamed.map(([a, b]) => [`${a}=>${b}`, [a, b]])).values()]
fs.writeFileSync(`${harnessDir}/out/class-map.json`, JSON.stringify(uniq, null, 2))
console.log(`halaman dirakit: ${cells.length} sel dalam ${pages.length} halaman (${PAGE_SIZE}/halaman) · ${uniq.length} class di-rename codemod`)
