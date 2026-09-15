// Koreksi markup pada sumber scratch hasil migrasi, agar render v4 identik dengan Laravel (v3).
// Setiap koreksi adalah FUNGSI atas string class, diterapkan ke literal di berkas sumbernya, dan
// dicatat per berkas. Harness kemudian memverifikasi hasilnya lewat korpus berpasangan.
//
//   R0  berkas .ts tidak dimigrasi codemod (glob content v3 hanya *.tsx) -> terapkan peta rename codemod
//   R1  class MATI di v3 (tidak ada di CSS produksi Laravel) tapi HIDUP di v4 -> hapus
//   R2  varian X:text-{ukuran} setelah leading-* -> tambah X:leading-* sesuai hasil v3
//   R3  koreksi manual per string (terdokumentasi satu per satu, lihat MANUAL)
//
// Pemakaian: node corrections.mjs <scratch resources/js> <laravel resources/js> <oracle.css> <kandidat.out.css>
//            <class-map.json> <inventory.json> <v3ref dir> <laporan.json> [--apply]
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { DEAD_FILES, literalsOf, isClassString } from './corpus.mjs'

const [, , v4Dir, v3Dir, oraclePath, candidatePath, classMapPath, inventoryPath, v3refDir, reportPath, applyFlag] = process.argv
const APPLY = applyFlag === '--apply'

const classesIn = (css) => {
  const set = new Set()
  for (const m of css.matchAll(/\.((?:\\.|[\w-])+)/g)) set.add(m[1].replace(/\\(.)/g, '$1'))
  return set
}
const v3set = classesIn(fs.readFileSync(oraclePath, 'utf8'))
const v4set = classesIn(fs.readFileSync(candidatePath, 'utf8'))
const renameMap = new Map(JSON.parse(fs.readFileSync(classMapPath, 'utf8')))
const inv = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))
const known = new Set([...inv.utilities.map((u) => u.name), ...inv.bespoke.map((b) => b.name)])
const require = createRequire(`${v3refDir}/package.json`)
const v3FontSize = require('tailwindcss/stubs/config.full.js').theme.fontSize

// ===== R2: model urutan cascade v3 untuk line-height =====
const SCREENS = ['', 'sm', 'md', 'lg', 'xl', '2xl'] // '' = tanpa varian responsif
const LH_TO_LEADING = { '1rem': 'leading-4', '1.25rem': 'leading-5', '1.5rem': 'leading-6', '1.75rem': 'leading-7', '2rem': 'leading-8', '2.25rem': 'leading-9', '2.5rem': 'leading-10', 1: 'leading-none', '1': 'leading-none' }
const sizeLh = (size) => {
  const v = v3FontSize[size]
  if (!v) return null
  const lh = typeof v[1] === 'object' ? v[1].lineHeight : v[1]
  return String(lh)
}
// Pecah token jadi { screen, util }. Varian non-responsif (hover:, dsb.) di luar model R2 -> null.
const parse = (tok) => {
  const parts = tok.split(':')
  const util = parts.pop()
  if (parts.length === 0) return { screen: '', util }
  if (parts.length === 1 && SCREENS.includes(parts[0])) return { screen: parts[0], util }
  return null
}
const lhRole = (util) => {
  const m = util.match(/^text-(xs|sm|base|lg|xl|[2-9]xl)(?:\/(.+))?$/)
  if (m) return { kind: 'text', lh: m[2] ? `modifier:${m[2]}` : sizeLh(m[1]) }
  if (/^leading-/.test(util)) return { kind: 'leading', util }
  return null
}
// Pemenang line-height di breakpoint bp menurut v3: utilitas polos (text sebelum leading), lalu tiap
// screen aktif berurutan (text sebelum leading di screen yang sama). Yang TERAKHIR menang.
function v3Winner(tokens, bpIdx) {
  let win = null
  for (let s = 0; s <= bpIdx; s++) {
    for (const kind of ['text', 'leading']) {
      for (const t of tokens) {
        const p = parse(t)
        if (!p || p.screen !== SCREENS[s]) continue
        const r = lhRole(p.util)
        if (r && r.kind === kind) win = { tok: t, ...r }
      }
    }
  }
  return win
}
// Pemenang menurut v4: leading-* aktif mana pun menang (lewat --tw-leading); tanpa itu, text terakhir.
function v4Winner(tokens, bpIdx) {
  let lead = null, text = null
  for (let s = 0; s <= bpIdx; s++) {
    for (const t of tokens) {
      const p = parse(t)
      if (!p || p.screen !== SCREENS[s]) continue
      const r = lhRole(p.util)
      if (r?.kind === 'leading') lead = { tok: t, ...r }
      if (r?.kind === 'text') text = { tok: t, ...r }
    }
  }
  return lead ?? text
}
const sameLh = (a, b) => {
  if (!a || !b) return a === b
  if (a.kind === 'leading' && b.kind === 'leading') return a.util === b.util
  if (a.kind === 'text' && b.kind === 'text') return a.lh === b.lh
  // leading vs text: setara hanya bila leading-nya persis line-height text tsb
  const lead = a.kind === 'leading' ? a : b, text = a.kind === 'text' ? a : b
  return LH_TO_LEADING[text.lh] === lead.util
}

function correctR2(tokens) {
  const out = [...tokens]
  const added = []
  for (let bp = 1; bp < SCREENS.length; bp++) {
    const w3 = v3Winner(tokens, bp) // selalu dihitung dari token ASLI (semantik v3)
    const w4 = v4Winner(out, bp)
    if (sameLh(w3, w4) || !w3 || w3.kind !== 'text') continue
    const leading = LH_TO_LEADING[w3.lh]
    if (!leading) return { tokens, skipped: `line-height v3 "${w3.lh}" tidak punya padanan leading-*` }
    const tok = `${SCREENS[bp]}:${leading}`
    out.push(tok)
    added.push(tok)
  }
  return { tokens: out, added }
}

// ===== R3: koreksi manual — setiap entri wajib punya alasan terukur =====
const MANUAL = [
  {
    // Terukur di harness (1280px): v3 border-bottom-right-radius 0px, v4 24px. Dua utilitas di varian sm yang
    // sama menulis sudut kanan-bawah; urutan v3 memenangkan rounded-r-none, v4 memenangkan rounded-b-[24px].
    // Longhand bl-[24px] menyatakan hasil v3 secara eksplisit tanpa bergantung urutan.
    match: 'sm:rounded-b-[24px] sm:rounded-r-none',
    replace: 'sm:rounded-bl-[24px] sm:rounded-r-none',
    why: 'urutan intra-varian: v3 rounded-r-none menang di sudut kanan-bawah'
  }
]

// ===== Terapkan per berkas =====
const report = { R0: [], R1: [], R2: [], R2skipped: [], R3: [] }
const files = []
const walk = (d) => {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name)
    if (f.isDirectory()) walk(p)
    else if (/\.tsx?$/.test(f.name)) files.push(path.relative(v4Dir, p))
  }
}
walk(v4Dir)

for (const rel of files) {
  if (DEAD_FILES.some((re) => re.test(rel))) continue
  const v4Path = path.join(v4Dir, rel)
  const v3Path = path.join(v3Dir, rel)
  if (!fs.existsSync(v3Path)) continue
  const src4 = fs.readFileSync(v4Path, 'utf8')
  const l3 = literalsOf(fs.readFileSync(v3Path, 'utf8'))
  const l4 = literalsOf(src4)
  if (l3.length !== l4.length) continue

  let next = src4
  const isTs = /\.ts$/.test(rel) && !/\.d\.ts$/.test(rel)
  for (let i = 0; i < l4.length; i++) {
    if (!isClassString(l3[i], known)) continue
    const t3 = l3[i].trim().split(/\s+/)
    let t4 = l4[i].trim().split(/\s+/)
    if (t3.length !== t4.length) continue
    const before = t4.join(' ')

    // R0 — berkas .ts yang dilewati codemod
    if (isTs) {
      t4 = t4.map((t, k) => {
        const r = renameMap.get(t3[k])
        if (r && r !== t) report.R0.push({ file: rel, from: t, to: r })
        return r ?? t
      })
    }
    // R1 — mati di v3, hidup di v4
    const keep = []
    t4.forEach((t, k) => {
      if (!v3set.has(t3[k]) && v4set.has(t)) report.R1.push({ file: rel, token: t3[k], v4: t, string: l3[i].trim() })
      else keep.push(t)
    })
    t4 = keep
    // R2 — tipografi responsif
    const r2 = correctR2(t4)
    if (r2.skipped) report.R2skipped.push({ file: rel, string: before, why: r2.skipped })
    else if (r2.added.length) report.R2.push({ file: rel, string: before, added: r2.added })
    t4 = r2.tokens ?? t4
    // R3 — manual
    let after = t4.join(' ')
    for (const m of MANUAL) {
      if (after.includes(m.match)) {
        after = after.replace(m.match, m.replace)
        report.R3.push({ file: rel, match: m.match, replace: m.replace, why: m.why })
      }
    }

    if (after !== before) {
      // Ganti HANYA literal ini, di posisinya: literal yang sama bisa muncul lagi dan dikoreksi sendiri.
      const idx = next.indexOf(l4[i])
      if (idx >= 0) next = next.slice(0, idx) + l4[i].replace(before, after) + next.slice(idx + l4[i].length)
    }
  }
  if (APPLY && next !== src4) fs.writeFileSync(v4Path, next)
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 1))
const uniq = (arr, key) => new Set(arr.map(key)).size
console.log(`R0 rename berkas .ts : ${report.R0.length}`)
console.log(`R1 class mati di v3  : ${report.R1.length} kemunculan, ${uniq(report.R1, (r) => r.token)} token unik`)
console.log(`R2 tipografi resp.   : ${report.R2.length} string (${report.R2skipped.length} dilewati)`)
console.log(`R3 manual            : ${report.R3.length}`)
console.log(APPLY ? 'DITERAPKAN ke sumber scratch.' : '(uji kering — tambahkan --apply untuk menulis)')
