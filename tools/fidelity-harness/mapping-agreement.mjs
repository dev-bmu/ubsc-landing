// Apakah codemod memigrasi string className yang sama secara identik di kode asli vs di Styleguide.tsx?
import fs from 'node:fs'

const [, , corpusPath, cellsPath, v4TsxPath] = process.argv
const { pairs } = JSON.parse(fs.readFileSync(corpusPath, 'utf8'))
const cells = JSON.parse(fs.readFileSync(cellsPath, 'utf8')).filter((c) => c.kind === 'combo')
const sg = new Map()
for (const m of fs.readFileSync(v4TsxPath, 'utf8').matchAll(/data-cell="([^"]+)" className=\{("(?:[^"\\]|\\.)*")\}/g)) sg.set(m[1], JSON.parse(m[2]))
const sgByV3 = new Map(cells.map((c) => [c.cls, sg.get(c.id)]))

let same = 0, differ = 0, missing = 0
const samples = []
for (const p of pairs) {
  const viaSg = sgByV3.get(p.v3)
  if (viaSg === undefined) { missing++; continue }
  if (viaSg === p.v4) same++
  else {
    differ++
    if (samples.length < 8) samples.push({ v3: p.v3, real: p.v4, styleguide: viaSg, files: p.files })
  }
}
console.log(`pasangan dibandingkan: ${same + differ} · identik: ${same} · BERBEDA: ${differ} · tidak ada di styleguide: ${missing}`)
for (const s of samples) {
  const t3 = s.v3.split(' '), tr = s.real.split(' '), ts = s.styleguide.split(' ')
  const diffIdx = tr.map((t, i) => (t !== ts[i] ? i : -1)).filter((i) => i >= 0)
  console.log(`\n  berkas: ${s.files[0]}`)
  for (const i of diffIdx.slice(0, 4)) console.log(`    token v3 "${t3[i]}" -> asli "${tr[i]}" | styleguide "${ts[i]}"`)
}
