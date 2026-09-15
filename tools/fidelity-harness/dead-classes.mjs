// Class yang ditulis di kode Laravel tapi TIDAK PERNAH menghasilkan CSS di Tailwind v3,
// padahal di v4 menghasilkan CSS. Laravel merender tanpa efeknya; port v4 akan tiba-tiba menampilkannya.
// Pemakaian: node dead-classes.mjs <oracle.css> <kandidat.out.css> <cells.json> <Styleguide.v4.tsx> <keluaran.json>
import fs from 'node:fs'

const [, , oraclePath, candidatePath, cellsPath, v4TsxPath, outPath] = process.argv

const classesIn = (css) => {
  const set = new Set()
  for (const m of css.matchAll(/\.((?:\\.|[\w-])+)/g)) set.add(m[1].replace(/\\(.)/g, '$1'))
  return set
}
const v3set = classesIn(fs.readFileSync(oraclePath, 'utf8'))
const v4set = classesIn(fs.readFileSync(candidatePath, 'utf8'))

const cells = JSON.parse(fs.readFileSync(cellsPath, 'utf8')).filter((c) => c.kind === 'combo')
const v4map = new Map()
for (const m of fs.readFileSync(v4TsxPath, 'utf8').matchAll(/data-cell="([^"]+)" className=\{("(?:[^"\\]|\\.)*")\}/g)) v4map.set(m[1], JSON.parse(m[2]))

const dead = new Map() // v3 token -> { v4, count, examples }
const unaligned = []
for (const c of cells) {
  const t3 = c.cls.split(/\s+/)
  const s4 = v4map.get(c.id)
  if (s4 === undefined) continue
  const t4 = s4.split(/\s+/)
  if (t3.length !== t4.length) {
    unaligned.push({ v3: c.cls, v4: s4 })
    continue
  }
  for (let i = 0; i < t3.length; i++) {
    if (v3set.has(t3[i]) || !v4set.has(t4[i])) continue
    const e = dead.get(t3[i]) || { v4: t4[i], count: 0, examples: [] }
    e.count++
    if (e.examples.length < 3) e.examples.push(c.cls)
    dead.set(t3[i], e)
  }
}

const rows = [...dead.entries()].sort((a, b) => b[1].count - a[1].count)
fs.writeFileSync(outPath, JSON.stringify({ dead: Object.fromEntries(rows), unaligned }, null, 2))

console.log(`class mati-di-v3 / hidup-di-v4: ${rows.length} token unik di ${cells.length} string className`)
for (const [t, e] of rows.slice(0, 60)) console.log(`  ${String(e.count).padStart(3)}×  ${t}${e.v4 !== t ? `  (v4: ${e.v4})` : ''}`)
if (rows.length > 60) console.log(`  … ${rows.length - 60} lagi`)
console.log(`string yang jumlah token-nya berubah oleh codemod (tidak bisa disejajarkan): ${unaligned.length}`)
for (const u of unaligned.slice(0, 5)) console.log(`  v3: ${u.v3}\n  v4: ${u.v4}`)
