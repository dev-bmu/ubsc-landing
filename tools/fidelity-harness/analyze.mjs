// Mengelompokkan selisih dari report.json menjadi penyebab yang bisa ditindaklanjuti.
import fs from 'node:fs'

const [, , reportPath, widthArg] = process.argv
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
const vp = report.viewports.find((v) => v.width === Number(widthArg)) || report.viewports[0]
const { diffs, keyframeDiffs } = vp.style

// Properti turunan currentColor — kalau `color` beda, semuanya ikut beda. Tampilkan `color` saja.
const DERIVED = new Set([
  'outline-color', 'text-decoration-color', 'column-rule-color', 'row-rule-color', 'text-emphasis-color',
  '-webkit-text-fill-color', '-webkit-text-stroke-color', 'caret-color', 'border-block-start-color',
  'border-block-end-color', 'border-inline-start-color', 'border-inline-end-color', 'fill', 'stroke'
])
const pixelCells = new Map(vp.pixels.cells.map((c) => [c.id, c.px]))

// ===== Per sel: properti inti yang berbeda =====
const byCell = new Map()
for (const d of diffs) {
  if (DERIVED.has(d.prop)) continue
  const key = d.cell
  if (!byCell.has(key)) byCell.set(key, { cell: d.cell, label: d.label, props: [] })
  byCell.get(key).props.push(d)
}

// ===== Klasifikasi =====
const classify = (d) => {
  if (/color|background-image|shadow/.test(d.prop) && /rgba\(/.test(d.na) && /rgba\(/.test(d.nb)) {
    const ca = [...d.na.matchAll(/rgba\((\d+),(\d+),(\d+),(\d+)\)/g)].map((m) => m.slice(1, 5).map(Number))
    const cb = [...d.nb.matchAll(/rgba\((\d+),(\d+),(\d+),(\d+)\)/g)].map((m) => m.slice(1, 5).map(Number))
    if (ca.length && ca.length === cb.length && d.na.replace(/rgba\([^)]*\)(!oog)?/g, 'C') === d.nb.replace(/rgba\([^)]*\)(!oog)?/g, 'C')) {
      const delta = Math.max(...ca.flatMap((c, i) => c.map((x, k) => Math.abs(x - cb[i][k]))))
      const oog = /!oog/.test(d.nb) && !/!oog/.test(d.na)
      return delta <= 1 ? 'warna: selisih pembulatan (<=1)' : oog ? 'warna: v4 di luar gamut sRGB (P3)' : `warna: bergeser (maks delta ${delta > 8 ? '>8' : '2-8'})`
    }
  }
  return `properti: ${d.prop}`
}

const classes = new Map()
for (const c of byCell.values()) {
  for (const d of c.props) {
    const k = classify(d)
    if (!classes.has(k)) classes.set(k, { count: 0, cells: new Set(), sample: [] })
    const e = classes.get(k)
    e.count++
    e.cells.add(c.label)
    if (e.sample.length < 4) e.sample.push(`${c.label} [${d.prop}${d.pseudo || ''}]  ${d.na}  ->  ${d.nb}`)
  }
}

console.log(`viewport ${vp.width}px — ${byCell.size} sel dengan selisih inti\n`)
for (const [k, e] of [...classes.entries()].sort((a, b) => b[1].cells.size - a[1].cells.size)) {
  console.log(`■ ${k}  — ${e.cells.size} sel, ${e.count} selisih`)
  for (const s of e.sample) console.log(`    ${s.length > 220 ? s.slice(0, 220) + '…' : s}`)
}

console.log(`\n===== sel dengan PIKSEL berbeda (${vp.pixels.cells.length}) =====`)
for (const p of vp.pixels.cells.slice(0, 40)) {
  const core = byCell.get(p.id)
  const why = core ? [...new Set(core.props.map((d) => d.prop + (d.pseudo || '')))].slice(0, 5).join(', ') : '(tidak ada selisih computed — cek anti-alias / gambar)'
  console.log(`  ${String(p.px).padStart(6)} px  ${p.label}  ←  ${why}`)
}

console.log(`\n===== @keyframes berbeda (${keyframeDiffs.length}) =====`)
for (const k of keyframeDiffs) {
  console.log(`  ${k.name}: ${k.issue}`)
  if (k.a) {
    // tunjukkan frame pertama yang berbeda
    const fa = k.a.split(' '), fb = k.b.split(' ')
    const i = fa.findIndex((x, j) => x !== fb[j])
    console.log(`     baseline: ${(fa[i] || '').slice(0, 200)}`)
    console.log(`     kandidat: ${(fb[i] || '').slice(0, 200)}`)
  }
}
