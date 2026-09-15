// Selisih per elemen polos (preflight + forms plugin), dikelompokkan per tag+atribut.
import fs from 'node:fs'

const [, , reportPath, cellsPath] = process.argv
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
const cells = new Map(JSON.parse(fs.readFileSync(cellsPath, 'utf8')).map((c) => [c.id, c]))
const NOISE = /perspective|transform-origin|inline-size|block-start|block-end|inline-start|inline-end|rule-color|emphasis|fill-color|stroke-color|decoration-color|caret|outline-color/

for (const vp of report.viewports) {
  const groups = new Map()
  for (const d of vp.style.diffs) {
    const c = cells.get(d.cell)
    if (!c || c.kind !== 'bare') continue
    const key = `<${c.tag}${Object.entries(c.attrs || {}).map(([k, v]) => ` ${k}="${v}"`).join('')}>`
    if (!groups.has(key)) groups.set(key, new Set())
    if (!NOISE.test(d.prop)) groups.get(key).add(`${d.prop}${d.pseudo || ''}: ${d.na}  ->  ${d.nb}`)
  }
  console.log(`\n===== ${vp.width}px — elemen polos berbeda: ${groups.size} =====`)
  for (const [k, v] of groups) {
    console.log(`■ ${k}`)
    for (const x of [...v].slice(0, 10)) console.log(`    ${x.length > 180 ? x.slice(0, 180) + '…' : x}`)
  }
}
