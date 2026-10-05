// Membangun daftar sel styleguide dari inventaris oracle.
// Satu sumber kebenaran untuk kedua sisi: baseline (class v3) dan kandidat (class v4 hasil codemod).
// Keluaran:
//   cells.json         — daftar sel (id, jenis, class v3, struktur; combo juga membawa class v4)
//   Styleguide.tsx     — class v3 dalam className={"..."}; umpan untuk codemod @tailwindcss/upgrade
//
// Pemakaian: node gen-cells.mjs <inventory.json> <out-dir> [korpus.json]
import fs from 'node:fs'

const [, , inventoryPath, outDir] = process.argv
const inv = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))

const cells = []
let n = 0
const id = (p) => `${p}${n++}`

// ===== 1. Elemen polos: preflight, base layer, plugin forms =====
// Selisih preflight v3 -> v4 (warna border default, placeholder, cursor button, hr) hidup di sini.
const bare = [
  { tag: 'div', attrs: { style: 'border-width:2px;border-style:solid' }, text: 'border default' },
  { tag: 'button', attrs: { type: 'button' }, text: 'Tombol polos' },
  { tag: 'input', attrs: { type: 'text', placeholder: 'placeholder teks' } },
  { tag: 'input', attrs: { type: 'email', placeholder: 'email@contoh.id' } },
  { tag: 'input', attrs: { type: 'password', value: 'rahasia' } },
  { tag: 'input', attrs: { type: 'checkbox', checked: 'checked' } },
  { tag: 'input', attrs: { type: 'radio', checked: 'checked' } },
  { tag: 'textarea', attrs: { placeholder: 'textarea placeholder' } },
  { tag: 'select', children: '<option>Opsi satu</option><option>Opsi dua</option>' },
  { tag: 'hr' },
  { tag: 'h1', text: 'Judul H1' },
  { tag: 'h2', text: 'Judul H2' },
  { tag: 'h3', text: 'Judul H3' },
  { tag: 'p', text: 'Paragraf dasar BDO Grotesk' },
  { tag: 'a', attrs: { href: '#' }, text: 'Tautan polos' },
  { tag: 'ul', children: '<li>Satu</li><li>Dua</li>' },
  { tag: 'ol', children: '<li>Satu</li><li>Dua</li>' },
  { tag: 'table', children: '<tr><td>a</td><td>b</td></tr>' },
  { tag: 'img', attrs: { alt: 'gambar', width: '40', height: '20' } },
  { tag: 'code', text: 'kode()' },
  { tag: 'kbd', text: 'Ctrl' },
  { tag: 'small', text: 'kecil' },
  { tag: 'strong', text: 'tebal' },
  { tag: 'svg', attrs: { width: '24', height: '24', viewBox: '0 0 24 24' }, children: '<circle cx="12" cy="12" r="8" />' },
  // Preflight v4 me-reset margin+padding di SEMUA elemen; v3 hanya di elemen tertentu.
  // Elemen dengan margin/padding bawaan UA di bawah ini yang membedakan keduanya.
  { tag: 'table', children: '<thead><tr><th>Kolom</th><th>B</th></tr></thead><tbody><tr><td>isi</td><td>2</td></tr></tbody>' },
  { tag: 'fieldset', children: '<legend>Legenda</legend><input type="text" value="x">' },
  { tag: 'details', attrs: { open: 'open' }, children: '<summary>Ringkasan</summary><p>isi detail</p>' },
  { tag: 'figure', children: '<figcaption>keterangan</figcaption>' },
  { tag: 'blockquote', text: 'kutipan' },
  { tag: 'dl', children: '<dt>Istilah</dt><dd>definisi</dd>' },
  { tag: 'pre', text: 'pre  teks' },
  { tag: 'p', children: 'H<sub>2</sub>O x<sup>2</sup> <abbr title="singkatan">abbr</abbr> <mark>tanda</mark>' },
  { tag: 'progress', attrs: { value: '40', max: '100' } },
  { tag: 'meter', attrs: { value: '0.6' } },
  { tag: 'button', attrs: { type: 'button', disabled: 'disabled' }, text: 'Nonaktif' },
  { tag: 'div', attrs: { role: 'button' }, text: 'role=button' },
  { tag: 'input', attrs: { type: 'file' } },
  { tag: 'input', attrs: { type: 'number', value: '12' } },
  { tag: 'input', attrs: { type: 'search', placeholder: 'cari' } },
  { tag: 'input', attrs: { type: 'date', value: '2026-09-14' } },
  { tag: 'input', attrs: { type: 'range', value: '30' } },
  { tag: 'input', attrs: { placeholder: 'input tanpa type' } },
  { tag: 'select', attrs: { multiple: 'multiple' }, children: '<option>Satu</option><option>Dua</option>' },
  { tag: 'dialog', attrs: { open: 'open' }, text: 'dialog terbuka' },
  { tag: 'menu', children: '<li>menu</li>' }
]
for (const b of bare) cells.push({ id: id('b'), kind: 'bare', label: `<${b.tag}>`, ...b })

// ===== 2. Font: setiap family x setiap weight yang dideklarasikan @font-face =====
const fontFaces = [
  ['font-clash', [400, 500, 600, 700]],
  ['font-bdo', [300, 400, 500, 600, 700]],
  ['font-archivo', [600, 700]]
]
for (const [family, weights] of fontFaces) {
  for (const w of weights) {
    cells.push({ id: id('f'), kind: 'font', label: `${family} ${w}`, tag: 'div', cls: family, attrs: { style: `font-weight:${w};font-size:20px` }, text: 'UB Sport Center 123' })
  }
}

// ===== 3. Setiap utilitas Tailwind yang ter-generate di build Laravel =====
for (const u of inv.utilities) {
  cells.push({ id: id('u'), kind: 'utility', label: u.name, tag: 'div', cls: u.name, responsive: u.media.length > 0, text: null })
}

// ===== 4. Class bespoke (dari resources/css/app.css) =====
for (const b of inv.bespoke) {
  cells.push({ id: id('s'), kind: 'bespoke', label: b.name, tag: 'div', cls: b.name, text: null })
}

// ===== 5. Selector bespoke bertingkat — dibangun ulang jadi markup bersarang =====
// '.a .b > .c' -> <div class="a"><div class="b"><div class="c">…</div></div></div>
for (const sel of inv.complexBespoke) {
  const parts = sel
    .replace(/\s*>\s*/g, ' ')
    .trim()
    .split(/\s+/)
    .map((p) => p.split('.').filter(Boolean).join(' '))
  cells.push({ id: id('c'), kind: 'nested', label: sel, parts })
}

// ===== 6. Keyframes: satu sel per @keyframes, animasi dipasang lewat style inline yang sama di kedua sisi =====
for (const k of inv.keyframes) {
  cells.push({ id: id('k'), kind: 'keyframes', label: `@keyframes ${k}`, tag: 'div', attrs: { style: `animation:${k} 2s linear infinite;width:40px;height:40px;background:#0b1e3b` } })
}

// ===== 7. Kasus hazard yang disebut Rewrite.md, dirakit dari class yang memang ada di build =====
const hazards = [
  { label: 'maplibregl popup content (@apply ...! mati di v3)', cls: 'maplibregl-popup-content', text: 'popup' },
  { label: 'maplibregl popup tip', cls: 'maplibregl-popup-tip', text: 'tip' },
  { label: 'animate-in fade-in-0 zoom-in-95 (map.tsx)', cls: 'animate-in fade-in-0 zoom-in-95', text: 'animasi masuk' },
  {
    label: 'prose (LegalShell / RichEditor)',
    cls: 'prose',
    children: '<h2>Syarat</h2><p>Paragraf <a href="#">tautan</a> dan <strong>tebal</strong>.</p><ul><li>poin</li></ul><blockquote>kutipan</blockquote>'
  },
  { label: 'prose-sm', cls: 'prose prose-sm', children: '<h3>Kecil</h3><p>isi prose-sm</p>' }
]
for (const h of hazards) cells.push({ id: id('h'), kind: 'hazard', tag: 'div', ...h })

// ===== 8. String className ASLI — korpus berpasangan v3 (Laravel) <-> v4 (sumber migrasi) =====
// Sel satu-class tidak bisa mendeteksi dua hal: interpolasi gradien (bg-gradient-to-r saja tidak
// merender apa pun tanpa from-/to-) dan interaksi class bespoke + utilitas pada properti yang sama
// (yang menentukan apakah cascade layer CSS bespoke setara dengan v3). Korpus pemakaian nyata menutup
// keduanya.
//
// Sisi v4 sel combo adalah literal dari SUMBER MIGRASI (codemod + koreksi R0–R3, lihat corpus.mjs dan
// corrections.mjs) — teks yang benar-benar di-port di Fase 4–8 — bukan hasil codemod ulang atas
// Styleguide.tsx. Karena itu combo tidak ikut Styleguide.tsx.
const corpusPath = process.argv[4]
if (corpusPath) {
  const { pairs, misaligned } = JSON.parse(fs.readFileSync(corpusPath, 'utf8'))
  if (misaligned.length) throw new Error(`korpus punya ${misaligned.length} berkas tidak sejajar — sel combo tidak lengkap`)
  for (const pair of pairs) {
    cells.push({ id: id('x'), kind: 'combo', label: pair.v3, tag: 'div', cls: pair.v3, v4: pair.v4, files: pair.files })
  }
}

// ===== Keluaran =====
fs.writeFileSync(`${outDir}/cells.json`, JSON.stringify(cells))

// Styleguide.tsx: SATU className per sel supaya pemetaan v3 -> v4 bisa dibaca balik per id.
// Combo tidak ikut — class v4-nya sudah dibawa sel dari sumber migrasi.
const lines = cells
  .filter((c) => (c.cls || c.parts) && c.kind !== 'combo')
  .map((c) => {
    if (c.parts) return c.parts.map((p, i) => `      <div data-cell="${c.id}" data-depth="${i}" className={${JSON.stringify(p)}} />`).join('\n')
    return `      <div data-cell="${c.id}" className={${JSON.stringify(c.cls)}} />`
  })
fs.writeFileSync(`${outDir}/Styleguide.tsx`, `export default function Styleguide() {\n  return (\n    <>\n${lines.join('\n')}\n    </>\n  )\n}\n`)

const byKind = cells.reduce((acc, c) => ((acc[c.kind] = (acc[c.kind] || 0) + 1), acc), {})
console.log('total sel:', cells.length, byKind)
