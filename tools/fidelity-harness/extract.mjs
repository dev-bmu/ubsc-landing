// Inventaris dari CSS produksi Laravel (oracle): class apa saja yang benar-benar ter-generate.
import fs from 'node:fs'
import postcss from 'postcss'

const [, , oraclePath, sourceCssPath, outPath] = process.argv
const root = postcss.parse(fs.readFileSync(oraclePath, 'utf8'))
const sourceCss = fs.readFileSync(sourceCssPath, 'utf8')

// Class bespoke = yang ditulis tangan di resources/css/app.css (bukan hasil generate Tailwind).
const bespokeNames = new Set([...sourceCss.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]))

const unescapeCss = (s) => s.replace(/\\(.)/g, '$1')
const simple = new Map() // className -> { media: Set, bespoke }
const complex = new Set() // selector bespoke dengan kombinator
const keyframes = new Set()
let variantPseudo = 0

root.walkAtRules((r) => {
  if (/keyframes$/.test(r.name)) keyframes.add(r.params)
})

root.walkRules((rule) => {
  if (rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return
  const media = rule.parent?.type === 'atrule' && rule.parent.name === 'media' ? rule.parent.params : ''
  for (const sel of rule.selectors) {
    const m = sel.match(/^\.((?:\\.|[\w-])+)$/)
    if (m) {
      const name = unescapeCss(m[1])
      const entry = simple.get(name) || { media: new Set(), bespoke: bespokeNames.has(name) }
      if (media) entry.media.add(media)
      simple.set(name, entry)
      continue
    }
    // Varian pseudo-ELEMENT (before:/after:) — selector-nya diakhiri ::before / ::after.
    // Tanpa cabang ini varian itu terbuang diam-diam, padahal efeknya bisa diukur lewat
    // getComputedStyle(el, '::before').
    // Minifier Vite menulis ::before sebagai :before (satu titik dua), jadi terima keduanya.
    const pe = sel.match(/^\.((?:\\.|[\w-])+):{1,2}(before|after)$/)
    if (pe) {
      const name = unescapeCss(pe[1])
      const entry = simple.get(name) || { media: new Set(), bespoke: bespokeNames.has(name) }
      if (media) entry.media.add(media)
      simple.set(name, entry)
      continue
    }
    if (/^\.((?:\\.|[\w-])+)(:[\w-]+(\([^)]*\))?)+$/.test(sel)) {
      variantPseudo++
      continue
    }
    // Selector bespoke dengan kombinator (descendant/child) yang semua class-nya bespoke.
    const classes = [...sel.matchAll(/\.((?:\\.|[\w-])+)/g)].map((x) => unescapeCss(x[1]))
    const stripped = sel.replace(/\\./g, '')
    if (classes.length > 1 && classes.every((c) => bespokeNames.has(c)) && !/[:[]/.test(stripped)) complex.add(sel)
  }
})

const all = [...simple.entries()]
const out = {
  utilities: all.filter(([, v]) => !v.bespoke).map(([k, v]) => ({ name: k, media: [...v.media] })),
  bespoke: all.filter(([, v]) => v.bespoke).map(([k, v]) => ({ name: k, media: [...v.media] })),
  complexBespoke: [...complex],
  keyframes: [...keyframes].sort(),
  stats: { variantPseudoSkipped: variantPseudo }
}
fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
console.log('utilitas Tailwind  :', out.utilities.length, `(${out.utilities.filter((u) => u.media.length).length} responsif)`)
console.log('class bespoke      :', out.bespoke.length)
console.log('selector bespoke bertingkat:', out.complexBespoke.length)
console.log('@keyframes         :', out.keyframes.length, '->', out.keyframes.join(', '))
console.log('varian pseudo (dilewati walker):', variantPseudo)
