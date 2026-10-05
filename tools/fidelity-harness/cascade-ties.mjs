// Analisis statis urutan cascade per elemen, v3 (oracle) vs v4 (kandidat).
//
// Walker hanya merender keadaan diam di beberapa lebar layar. Dua jenis selisih lolos dari situ:
//  - varian STATE (hover:, focus:, group-hover:, disabled:, data-*, aria-*) yang tidak pernah dipicu, dan
//  - varian responsif di lebar yang tidak diukur, dan urutan antar-utilitas pada lebar itu.
// Penyebab berbaliknya pemenang antar-versi:
//  - v3: utilitas polos < CSS bespoke < varian. Kandidat v4: bespoke di @layer utilities SETELAH seluruh
//    utilitas — setiap seri spesifisitas bespoke-vs-varian berbalik.
//  - urutan internal utilitas v4 berbeda dari v3 (rounded-r-none vs rounded-b-[24px], R3).
//  - spesifisitas varian berubah (group-hover v3 = 0,3,0; v4 = 0,2,0 lewat :where).
//  - line-height v4 dibaca lewat var(--tw-leading, ...): leading-* SELALU menang (R2).
//
// Untuk setiap string className nyata (korpus), setiap pasangan rule yang bisa aktif bersamaan dan menulis
// properti yang sama (atau keluarga transform yang sama) dengan nilai berbeda: tentukan pemenang EFEKTIF
// di v3 dan di v4. Pasangan yang pemenangnya berbeda dilaporkan.
//
// Pemakaian: node cascade-ties.mjs <oracle.css> <kandidat.out.css> <korpus.json> <app.css Laravel> <laporan.json>
import fs from 'node:fs'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'

const [, , oraclePath, candidatePath, corpusPath, appCssPath, outPath] = process.argv
// Class bespoke = setiap nama class yang ditulis tangan di resources/css/app.css Laravel, termasuk yang hanya
// muncul di selector ber-pseudo atau bertingkat (inventory.json hanya memuat selector sederhana).
const BESPOKE = new Set([...fs.readFileSync(appCssPath, 'utf8').matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]))

// ===== Spesifisitas (Selectors 4: :where = 0, :is/:not/:has = argumen paling spesifik) =====
const PSEUDO_ELEMENTS = new Set(['before', 'after', 'placeholder', 'first-line', 'first-letter', 'marker', 'selection', 'backdrop', 'file-selector-button'])
function specificity(node) {
  let a = 0, b = 0, c = 0
  node.each((n) => {
    if (n.type === 'id') a++
    else if (n.type === 'class' || n.type === 'attribute') b++
    else if (n.type === 'tag' && n.value !== '*') c++
    else if (n.type === 'pseudo') {
      const name = n.value.replace(/^:+/, '').toLowerCase()
      if (name === 'where') return
      if (['is', 'not', 'has', 'matches'].includes(name)) {
        let best = [0, 0, 0]
        for (const arg of n.nodes) {
          const s = specificity(arg)
          if (cmpSpec(s, best) > 0) best = s
        }
        a += best[0]
        b += best[1]
        c += best[2]
      } else if (n.value.startsWith('::') || PSEUDO_ELEMENTS.has(name)) c++
      else b++
    }
  })
  return [a, b, c]
}
function cmpSpec(x, y) {
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]
}

// ===== Indeks rule: class pada compound subjek -> rule =====
const LAYER_RANK = { theme: 1, base: 2, components: 3, utilities: 4 }
const tagSubjectBespoke = new Set()
function indexCss(path, collectTagSubjects) {
  const root = postcss.parse(fs.readFileSync(path, 'utf8'))
  const byClass = new Map()
  let order = 0
  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return
    const conds = []
    let layer = 5 // tanpa layer = paling kuat untuk deklarasi normal
    for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
      if (p.type === 'atrule' && p.name === 'layer') layer = LAYER_RANK[p.params.trim()] ?? layer
      else if (p.type === 'atrule') conds.push(`@${p.name} ${p.params}`)
    }
    const decls = []
    rule.each((d) => d.type === 'decl' && decls.push({ prop: d.prop, value: d.value.trim(), important: d.important }))
    if (!decls.length) return
    const ord = order++
    selectorParser((sels) => {
      sels.each((sel) => {
        const nodes = sel.nodes
        let start = 0
        nodes.forEach((n, i) => n.type === 'combinator' && (start = i + 1))
        const subject = nodes.slice(start)
        const classes = subject.filter((n) => n.type === 'class').map((n) => n.value)
        const text = sel.toString().trim()
        if (!classes.length) {
          // Rule bespoke yang subjeknya tag/universal di bawah ancestor bespoke: tidak bisa dicocokkan dari string
          // class saja — didaftar untuk ditinjau manual.
          if (collectTagSubjects && nodes.some((n) => n.type === 'class' && BESPOKE.has(n.value))) tagSubjectBespoke.add(text)
          return
        }
        const pseudoNode = subject.find((n) => n.type === 'pseudo' && (n.value.startsWith('::') || PSEUDO_ELEMENTS.has(n.value.replace(/^:+/, ''))))
        const entry = {
          selector: text,
          classes,
          pseudoEl: pseudoNode ? `::${pseudoNode.value.replace(/^:+/, '')}` : '',
          states: subject.filter((n) => n.type === 'pseudo' && n !== pseudoNode).map((n) => n.toString()),
          ancestors: nodes.slice(0, start).map((n) => n.toString()).join(''),
          conds,
          layer,
          spec: specificity(sel),
          order: ord,
          decls
        }
        for (const cls of classes) {
          if (!byClass.has(cls)) byClass.set(cls, [])
          byClass.get(cls).push(entry)
        }
      })
    }).processSync(rule.selector)
  })
  return byClass
}

const V3 = indexCss(oraclePath, true)
const V4 = indexCss(candidatePath, false)

const channel = (prop) => (['transform', 'translate', 'rotate', 'scale'].includes(prop) ? 'transform*' : prop)

function rulesFor(index, classSet) {
  const seen = new Set()
  const out = []
  for (const cls of classSet) {
    for (const r of index.get(cls) || []) {
      const key = `${r.order}|${r.selector}`
      if (seen.has(key) || !r.classes.every((c) => classSet.has(c))) continue
      seen.add(key)
      out.push(r)
    }
  }
  return out
}

// Kondisi yang tidak pernah aktif di aplikasi: varian dark (.dark tidak pernah dipasang), cetak, reduced motion.
const neverActive = (r) => /\.dark\b|prefers-color-scheme:\s*dark|\bprint\b|prefers-reduced-motion/.test(`${r.ancestors} ${r.states.join(' ')} ${r.conds.join(' ')} ${r.selector}`)
// Batas lebar dari @media, sintaks v3 (min-width: 768px) maupun v4 (width >= 48rem / width < 40rem). Dalam px.
const toPx = (num, unit) => (unit === 'rem' || unit === 'em' ? Number(num) * 16 : Number(num))
function bounds(r) {
  let lo = 0
  let hi = 99999
  for (const c of r.conds) {
    for (const m of c.matchAll(/min-width:\s*([\d.]+)(px|rem|em)/g)) lo = Math.max(lo, toPx(m[1], m[2]))
    for (const m of c.matchAll(/max-width:\s*([\d.]+)(px|rem|em)/g)) hi = Math.min(hi, toPx(m[1], m[2]))
    for (const m of c.matchAll(/width\s*>=\s*([\d.]+)(px|rem|em)/g)) lo = Math.max(lo, toPx(m[1], m[2]))
    for (const m of c.matchAll(/width\s*>\s*([\d.]+)(px|rem|em)/g)) lo = Math.max(lo, toPx(m[1], m[2]))
    for (const m of c.matchAll(/width\s*<=\s*([\d.]+)(px|rem|em)/g)) hi = Math.min(hi, toPx(m[1], m[2]))
    for (const m of c.matchAll(/width\s*<\s*([\d.]+)(px|rem|em)/g)) hi = Math.min(hi, toPx(m[1], m[2]) - 0.02)
  }
  return [lo, hi]
}
// Dibulatkan: v3 max-width 767.98px dan v4 width < 48rem adalah batas yang sama.
const minW = (r) => Math.round(bounds(r)[0])
const maxW = (r) => Math.round(bounds(r)[1])
const compatible = (x, y) => Math.max(minW(x), minW(y)) < Math.min(maxW(x), maxW(y))

/** Pemenang kaskade di antara dua deklarasi aktif. true bila `a` menang. */
function beats(a, b, withLayers) {
  if (a.decl.important !== b.decl.important) return a.decl.important
  if (withLayers && a.rule.layer !== b.rule.layer) return a.decl.important ? a.rule.layer < b.rule.layer : a.rule.layer > b.rule.layer
  const s = cmpSpec(a.rule.spec, b.rule.spec)
  if (s !== 0) return s > 0
  return a.rule.order > b.rule.order
}

/**
 * Pemenang EFEKTIF: bila nilai pemenang membaca var(--tw-X, ...) yang ditulis rule lawan (dan tidak
 * ditulis pemenang sendiri), nilai yang tampil berasal dari rule lawan. Itulah semantik line-height v4.
 */
function effective(a, b, withLayers) {
  const aWins = beats(a, b, withLayers)
  const [w, l] = aWins ? [a, b] : [b, a]
  for (const m of w.decl.value.matchAll(/var\((--tw-[\w-]+)/g)) {
    const v = m[1]
    if (l.rule.decls.some((d) => d.prop === v) && !w.rule.decls.some((d) => d.prop === v)) return aWins ? 'b' : 'a'
  }
  return aWins ? 'a' : 'b'
}

const ownerOf = (rule) => {
  const bes = rule.classes.filter((c) => BESPOKE.has(c))
  return bes.length ? { kind: 'bespoke', key: rule.selector } : { kind: 'utility', key: rule.classes.find((c) => !BESPOKE.has(c)) }
}

/** Deklarasi v4 padanan: rule bespoke dengan selector sama, atau rule milik token v4 hasil pemetaan. */
function counterpart(r4, rule3, decl3, tokenMap, set4) {
  const own = ownerOf(rule3)
  let candidates
  if (own.kind === 'bespoke') {
    // Selector bespoke yang sama bisa muncul di beberapa blok (mis. versi reduced-motion ber-!important):
    // padanannya harus berkondisi media yang sama, bukan sekadar teks selector yang sama.
    candidates = r4.filter((r) => r.selector === rule3.selector && r.pseudoEl === rule3.pseudoEl && !neverActive(r) && minW(r) === minW(rule3) && maxW(r) === maxW(rule3))
  } else {
    const t4 = tokenMap.get(own.key)
    if (!t4 || !set4.has(t4)) return []
    candidates = r4.filter((r) => r.classes.includes(t4) && r.pseudoEl === rule3.pseudoEl && !neverActive(r) && minW(r) === minW(rule3) && maxW(r) === maxW(rule3))
  }
  return candidates.flatMap((r) => r.decls.filter((d) => channel(d.prop) === channel(decl3.prop) && !d.prop.startsWith('--')).map((d) => ({ rule: r, decl: d })))
}

const norm = (v) => v.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').trim()

const { pairs } = JSON.parse(fs.readFileSync(corpusPath, 'utf8'))
const findings = []
let examinedPairs = 0

for (const pair of pairs) {
  const t3 = pair.v3.split(' ')
  const t4 = pair.v4.split(' ')
  const set3 = new Set(t3)
  const set4 = new Set(t4)
  // Pemetaan token per posisi. Koreksi R1 menghapus token dan R2 menambah token di v4 — sejajarkan dengan
  // mencocokkan urutan sisa token secara serakah.
  const tokenMap = new Map()
  {
    let j = 0
    for (const tok of t3) {
      let k = j
      while (k < t4.length && t4[k] !== tok && !(k === j && t3.length === t4.length)) k++
      if (k < t4.length) {
        tokenMap.set(tok, t4[k])
        j = k + 1
      }
    }
    if (t3.length === t4.length) t3.forEach((tok, i) => tokenMap.set(tok, t4[i]))
  }
  const r3 = rulesFor(V3, set3).filter((r) => !neverActive(r))
  const r4 = rulesFor(V4, set4)
  const decls3 = r3.flatMap((rule) => rule.decls.filter((d) => !d.prop.startsWith('--')).map((decl) => ({ rule, decl })))

  for (let i = 0; i < decls3.length; i++) {
    for (let j = i + 1; j < decls3.length; j++) {
      const A = decls3[i]
      const B = decls3[j]
      if (A.rule === B.rule || A.rule.pseudoEl !== B.rule.pseudoEl || channel(A.decl.prop) !== channel(B.decl.prop)) continue
      if (!compatible(A.rule, B.rule)) continue
      const oa = ownerOf(A.rule)
      const ob = ownerOf(B.rule)
      if (oa.key === ob.key) continue
      if (norm(A.decl.value) === norm(B.decl.value) && A.decl.prop === B.decl.prop) continue
      // Pasangan yang hanya dibedakan lebar layar diuji EMPIRIS oleh walker di setiap breakpoint (lihat
      // breakpoints di laporan). Model berpasangan di sini tidak melihat token ketiga — mis. sm:leading-*
      // tambahan R2 — sehingga untuk kasus lebar ia hanya menghasilkan positif palsu. Yang dianalisis statis:
      // pasangan yang melibatkan STATE atau syarat ancestor, yang tidak pernah dipicu walker.
      const stateful = (r) => r.states.length > 0 || r.ancestors !== ''
      if (!stateful(A.rule) && !stateful(B.rule)) continue
      examinedPairs++

      const w3 = effective(A, B, false)
      const A4s = counterpart(r4, A.rule, A.decl, tokenMap, set4)
      const B4s = counterpart(r4, B.rule, B.decl, tokenMap, set4)
      if (!A4s.length || !B4s.length) continue

      for (const A4 of A4s) {
        for (const B4 of B4s) {
          // Keluarga transform: di v4 scale/translate/rotate TIDAK menimpa transform — keduanya dikomposisi.
          const composes = A4.decl.prop !== B4.decl.prop && channel(A4.decl.prop) === 'transform*'
          const w4 = composes ? 'keduanya' : effective(A4, B4, true)
          if (w3 === w4) continue
          const describe = (x, own) => ({ owner: own.kind === 'bespoke' ? own.key : own.key, decl: `${x.decl.prop}: ${x.decl.value}`, when: [...x.rule.conds, ...x.rule.states, x.rule.ancestors].filter(Boolean).join(' ') })
          findings.push({
            string: pair.v3,
            files: pair.files,
            a: describe(A, oa),
            b: describe(B, ob),
            v3: w3 === 'a' ? oa.key : ob.key,
            v4: w4 === 'keduanya' ? 'keduanya (dikomposisi)' : w4 === 'a' ? `${oa.key} (v4: ${A4.rule.selector})` : `${ob.key} (v4: ${B4.rule.selector})`,
            kind: `${oa.kind}-${ob.kind}`
          })
        }
      }
    }
  }
}

const uniq = [...new Map(findings.map((f) => [`${f.string}|${f.a.owner}|${f.a.decl}|${f.b.owner}|${f.b.decl}`, f])).values()]

// Seluruh batas lebar @media di kedua CSS — lebar yang WAJIB diukur walker supaya setiap kombinasi media
// pernah aktif (media adalah fungsi tangga: di antara dua batas, set rule yang aktif tidak berubah).
const breakpoints = new Set()
for (const index of [V3, V4]) {
  for (const rules of index.values()) {
    for (const r of rules) {
      const [lo, hi] = bounds(r)
      if (lo > 0) breakpoints.add(Math.round(lo))
      if (hi < 99999) breakpoints.add(Math.floor(hi))
    }
  }
}
const widths = [...breakpoints].sort((a, b) => a - b)
fs.writeFileSync(outPath, JSON.stringify({ examinedPairs, breakpoints: widths, tagSubjectBespoke: [...tagSubjectBespoke], findings: uniq }, null, 1))
console.log(`batas lebar @media (ukur walker di sini): ${widths.join(', ')}`)

const byStringCount = new Set(uniq.map((f) => f.string)).size
console.log(`pasangan deklarasi diperiksa: ${examinedPairs} · berbalik: ${uniq.length} di ${byStringCount} string`)
console.log(`rule bespoke bersubjek tag/universal (tinjau manual): ${tagSubjectBespoke.size}`)
const byKind = uniq.reduce((acc, f) => ((acc[f.kind] = (acc[f.kind] || 0) + 1), acc), {})
console.log('per jenis:', byKind)
for (const f of uniq.slice(0, 80)) {
  console.log(`\n  [${f.kind}] ${f.string.length > 150 ? f.string.slice(0, 150) + '…' : f.string}`)
  console.log(`    A ${f.a.owner} { ${f.a.decl} } ${f.a.when}`)
  console.log(`    B ${f.b.owner} { ${f.b.decl} } ${f.b.when}`)
  console.log(`    v3 menang: ${f.v3} · v4 menang: ${f.v4} · ${f.files[0]}`)
}
