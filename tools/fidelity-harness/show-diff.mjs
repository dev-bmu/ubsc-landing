// Tampilkan nilai MENTAH + ternormalisasi untuk sel yang label-nya cocok dengan pola.
import fs from 'node:fs'

const [, , reportPath, pattern, propPattern = '.', max = '6'] = process.argv
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
const re = new RegExp(pattern)
const pr = new RegExp(propPattern)
let n = 0
for (const vp of report.viewports) {
  for (const d of vp.style.diffs) {
    if (!re.test(d.label) || !pr.test(d.prop)) continue
    console.log(`\n[${vp.width}px] ${d.label}\n  prop ${d.prop}${d.pseudo || ''}`)
    console.log(`  v3 mentah : ${d.a}`)
    console.log(`  v4 mentah : ${d.b}`)
    console.log(`  v3 norm   : ${d.na}`)
    console.log(`  v4 norm   : ${d.nb}`)
    if (++n >= Number(max)) process.exit(0)
  }
}
