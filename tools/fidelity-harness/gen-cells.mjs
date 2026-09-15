// Membangun daftar sel styleguide dari inventaris oracle.
// Satu sumber kebenaran untuk kedua sisi: baseline (class v3) dan kandidat (class v4 hasil codemod).
// Keluaran:
//   cells.json         — daftar sel (id, jenis, class v3, struktur)
//   Styleguide.tsx     — class v3 dalam className={"..."}; umpan untuk codemod @tailwindcss/upgrade
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

// ===== 8. String className ASLI dari TSX Laravel =====
// Sel satu-class tidak bisa mendeteksi dua hal: interpolasi gradien (bg-gradient-to-r saja tidak
// merender apa pun tanpa from-/to-) dan interaksi class bespoke + utilitas pada properti yang sama
// (yang menentukan apakah cascade layer CSS bespoke setara dengan v3). Korpus pemakaian nyata menutup
// keduanya. Codemod memetakan tiap string utuh, jadi urutan/penggabungan class ikut setia.
import path from 'node:path'
const laravelJs = process.argv[4]
if (laravelJs) {
  const known = new Set([...inv.utilities.map((u) => u.name), ...inv.bespoke.map((b) => b.name)])
  const files = []
  const walk = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name)
      if (f.isDirectory()) walk(p)
      else if (/\.tsx?$/.test(f.name)) files.push(p)
    }
  }
  walk(laravelJs)

  // Kode yang Rewrite.md nyatakan MATI ("Yang dihapus, tidak di-port") tidak ikut korpus: paritas
  // hanya perlu dibuktikan untuk kode yang benar-benar akan ada di aplikasi baru.
  const DEAD = [
    /Landing[\\/]FluidGlass(Cursor)?\.tsx$/,
    /Landing[\\/]MembershipModal\.tsx$/,
    /UserDashboard[\\/]UserDashboardModal\.tsx$/,
    /Landing[\\/](ArenaCard|ClassCard)\.tsx$/,
    /(FacilityRow|DoughnutPlaceholder|IdentityQueueCard)\.tsx$/,
    /Components[\\/](ApplicationLogo|Checkbox|DangerButton|Dropdown|InputLabel|Modal|NavLink|PrimaryButton|ResponsiveNavLink|SecondaryButton|TextInput)\.tsx$/,
    /Layouts[\\/](AuthenticatedLayout|GuestLayout)\.tsx$/,
    /Pages[\\/]Profile[\\/]/
  ]
  const live = files.filter((f) => !DEAD.some((re) => re.test(f)))
  console.error(`korpus: ${live.length} berkas hidup (${files.length - live.length} berkas mati dikeluarkan)`)

  const combos = new Set()
  for (const f of live) {
    let src = fs.readFileSync(f, 'utf8')
    // STAT_GRADIENT_* di tokens.ts: dead code (Rewrite.md) — v3 tidak pernah men-generate class-nya
    // karena glob content v3 hanya memindai *.tsx.
    if (/tokens\.ts$/.test(f)) src = src.replace(/STAT_GRADIENT_[A-Z]+:\s*\n?\s*"[^"]*",?/g, '')
    const lits = []
    for (const m of src.matchAll(/"([^"\n]{3,600})"|'([^'\n]{3,600})'/g)) lits.push(m[1] ?? m[2])
    for (const m of src.matchAll(/`([^`]{3,2000})`/g)) for (const part of m[1].split(/\$\{[^}]*\}/)) lits.push(part)
    for (const lit of lits) {
      const toks = lit.trim().split(/\s+/).filter(Boolean)
      if (toks.length < 2) continue
      if (toks.filter((t) => known.has(t)).length / toks.length < 0.6) continue
      combos.add(toks.join(' '))
    }
  }
  for (const c of [...combos].sort()) cells.push({ id: id('x'), kind: 'combo', label: c, tag: 'div', cls: c, text: null })
}

// ===== Keluaran =====
fs.writeFileSync(`${outDir}/cells.json`, JSON.stringify(cells))

// Styleguide.tsx: SATU className per sel supaya pemetaan v3 -> v4 bisa dibaca balik per id.
const lines = cells
  .filter((c) => c.cls || c.parts)
  .map((c) => {
    if (c.parts) return c.parts.map((p, i) => `      <div data-cell="${c.id}" data-depth="${i}" className={${JSON.stringify(p)}} />`).join('\n')
    return `      <div data-cell="${c.id}" className={${JSON.stringify(c.cls)}} />`
  })
fs.writeFileSync(`${outDir}/Styleguide.tsx`, `export default function Styleguide() {\n  return (\n    <>\n${lines.join('\n')}\n    </>\n  )\n}\n`)

const byKind = cells.reduce((acc, c) => ((acc[c.kind] = (acc[c.kind] || 0) + 1), acc), {})
console.log('total sel:', cells.length, byKind)
