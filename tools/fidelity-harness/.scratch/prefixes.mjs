// Debug: deklarasi/nilai/selector berawalan vendor per berkas CSS.
import fs from 'node:fs'
import postcss from 'postcss'
const files = process.argv.slice(2)
const sets = files.map((f) => {
  const root = postcss.parse(fs.readFileSync(f, 'utf8'))
  const s = new Map()
  root.walkDecls((d) => {
    const key = /^-(webkit|moz|ms|o)-/.test(d.prop) ? `prop ${d.prop}` : /-(webkit|moz|ms)-/.test(d.value) ? `value ${d.prop}: ${d.value.match(/-(webkit|moz|ms)-[a-z-]+/)[0]}` : null
    if (key) s.set(key, (s.get(key) || 0) + 1)
  })
  root.walkRules((r) => { const m = r.selector.match(/::?-(webkit|moz|ms)-[a-z-]+/g); if (m) for (const x of m) s.set(`selector ${x}`, (s.get(`selector ${x}`) || 0) + 1) })
  root.walkAtRules((a) => { if (/-(webkit|moz|ms)-/.test(a.params)) s.set(`@${a.name} ${a.params.match(/-(webkit|moz|ms)-[a-z-]+/)[0]}`, (s.get(`@${a.name} ${a.params.match(/-(webkit|moz|ms)-[a-z-]+/)[0]}`) || 0) + 1) })
  return s
})
const keys = [...new Set(sets.flatMap((s) => [...s.keys()]))].sort()
console.log(['kunci', ...files.map((f) => f.split(/[\/]/).pop())].join(' | '))
for (const k of keys) { const row = sets.map((s) => s.get(k) || 0); if (new Set(row).size > 1) console.log(`${k} | ${row.join(' | ')}`) }
