// Merakit dua halaman dengan DOM IDENTIK — hanya string class yang berbeda:
//   out/baseline.html   class v3 + CSS produksi Laravel
//   out/candidate.html  class v4 (hasil codemod) + CSS v4 kandidat
// plus out/candidate-source.html untuk dipindai Tailwind v4 saat mengompilasi kandidat.
import fs from 'node:fs'

const [, , harnessDir] = process.argv
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
  const pick = (key, v3cls) => {
    if (side === 'baseline') return v3cls
    const mapped = v4.get(key)
    if (mapped === undefined) throw new Error(`class v4 untuk sel ${key} tidak ditemukan di Styleguide.v4.tsx`)
    if (mapped !== v3cls && side === 'candidate') renamed.push([v3cls, mapped])
    return mapped
  }

  if (cell.kind === 'nested') {
    let inner = PROBE_TEXT
    for (let i = cell.parts.length - 1; i >= 0; i--) {
      inner = `<div data-probe class="${esc(pick(`${cell.id}:${i}`, cell.parts[i]))}">${inner}</div>`
    }
    return `<div class="sg-cell sg-wide" data-cell="${cell.id}" title="${esc(cell.label)}">${inner}</div>`
  }

  const cls = cell.cls ? ` class="${esc(pick(cell.id, cell.cls))}"` : ''
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

function page(side, cssHref) {
  const body = cells.map((c) => renderCell(c, side)).join('\n')
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>styleguide ${side}</title>
<link rel="stylesheet" href="${cssHref}">
<style>${HELPER}</style>
</head>
<body>
<main class="sg-grid">
${body}
</main>
</body>
</html>
`
}

fs.mkdirSync(`${harnessDir}/out`, { recursive: true })
fs.writeFileSync(`${harnessDir}/out/baseline.html`, page('baseline', '/laravel.css'))
fs.writeFileSync(`${harnessDir}/out/candidate.html`, page('candidate', '/candidate.css'))
// Berkas sumber yang dipindai Tailwind v4 — isinya persis markup kandidat.
fs.copyFileSync(`${harnessDir}/out/candidate.html`, `${harnessDir}/out/candidate-source.html`)

const uniq = [...new Map(renamed.map(([a, b]) => [`${a}=>${b}`, [a, b]])).values()]
fs.writeFileSync(`${harnessDir}/out/class-map.json`, JSON.stringify(uniq, null, 2))
console.log(`halaman dirakit: ${cells.length} sel · ${uniq.length} class di-rename codemod`)
