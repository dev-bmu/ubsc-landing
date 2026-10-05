// Paritas cn(): tailwind-merge 2 atas class v3 (Laravel) vs tailwind-merge 3 atas class v4 (sumber migrasi).
//
// cn() = twMerge(clsx(...)). twMerge MEMBUANG class yang dianggap bertabrakan dengan class setelahnya. Aturan
// tabrakan tailwind-merge 3 mengikuti nama dan grup utilitas Tailwind v4 (shadow-xs, rounded-xs, bg-linear-*,
// outline-hidden, ...), jadi string yang sama bisa kehilangan class yang berbeda — perbedaan visual yang tidak
// terlihat di CSS sama sekali.
//
// Setiap panggilan cn() dipasangkan antara berkas Laravel dan berkas migrasinya menurut urutan kemunculan.
// Argumen diurai menjadi KOMBINASI yang bisa terjadi saat runtime: `a ? "x" : "y"` = x atau y, `c && "x"` = x
// atau kosong, objek clsx `{ "x": c }` = x atau kosong. Setiap kombinasi (dibatasi 256 per panggilan) di-merge
// di kedua sisi; hasil v3 dipetakan ke nama v4 lewat pasangan literal (token per posisi) lalu dibandingkan.
// Menggabungkan semua literal sekaligus tidak jujur: cabang ternary yang tidak pernah aktif bersamaan akan
// "bertabrakan" dan menghasilkan positif palsu.
//
// Pemakaian: node cn-parity.mjs <laravel resources/js> <migrasi resources/js> <tailwind-merge v2 dir> <typescript dir> <laporan.json>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { twMerge as twMerge3 } from 'tailwind-merge'
import { DEAD_FILES } from './corpus.mjs'

const [, , v3Dir, v4Dir, merge2Dir, tsDir, outPath] = process.argv
const require = createRequire(import.meta.url)
const { twMerge: twMerge2 } = require(merge2Dir)
const ts = require(tsDir)

function walk(dir, base = dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) walk(p, base, out)
    else if (/\.tsx?$/.test(f.name) && !/\.d\.ts$/.test(f.name)) out.push(path.relative(base, p))
  }
  return out
}

const MAX_COMBOS = 256

/**
 * Alternatif runtime sebuah ekspresi argumen: array of array literal. Setiap literal diberi indeks global
 * (urutan kemunculan di panggilan) supaya literal v3 dan v4 bisa dipasangkan.
 */
function alternatives(n, lits) {
  const lit = (text) => {
    lits.push(text.trim())
    return [[lits.length - 1]]
  }
  const product = (lists) => lists.reduce((acc, alts) => acc.flatMap((a) => alts.map((b) => [...a, ...b])).slice(0, MAX_COMBOS), [[]])
  if (ts.isParenthesizedExpression(n) || ts.isAsExpression?.(n) || ts.isNonNullExpression(n)) return alternatives(n.expression, lits)
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return lit(n.text)
  if (ts.isTemplateExpression(n)) {
    // Bagian teks template + alternatif ekspresi di dalamnya, digabung berurutan.
    const parts = [lit(n.head.text)]
    for (const span of n.templateSpans) {
      parts.push(alternatives(span.expression, lits))
      parts.push(lit(span.literal.text))
    }
    return product(parts)
  }
  if (ts.isConditionalExpression(n)) return [...alternatives(n.whenTrue, lits), ...alternatives(n.whenFalse, lits)].slice(0, MAX_COMBOS)
  if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return [[], ...alternatives(n.right, lits)]
  if (ts.isBinaryExpression(n) && (n.operatorToken.kind === ts.SyntaxKind.BarBarToken || n.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) {
    return [...alternatives(n.left, lits), ...alternatives(n.right, lits)].slice(0, MAX_COMBOS)
  }
  if (ts.isArrayLiteralExpression(n)) return product(n.elements.map((e) => alternatives(e, lits)))
  if (ts.isObjectLiteralExpression(n)) {
    // clsx: { "kelas": kondisi } — setiap kunci opsional.
    return product(
      n.properties.map((p) => {
        if (ts.isPropertyAssignment(p) && (ts.isStringLiteral(p.name) || ts.isIdentifier(p.name))) return [[], ...lit(p.name.text)]
        return [[]]
      })
    )
  }
  // Variabel, pemanggilan fungsi, dsb.: nilainya tidak diketahui statis — dianggap kosong.
  return [[]]
}

/** Setiap panggilan cn(...) di berkas: literal per panggilan + kombinasi runtime (indeks literal). */
function cnCalls(file) {
  const src = fs.readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const calls = []
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'cn') {
      const literals = []
      const perArg = node.arguments.map((a) => alternatives(a, literals))
      const combos = perArg.reduce((acc, alts) => acc.flatMap((a) => alts.map((b) => [...a, ...b])).slice(0, MAX_COMBOS), [[]])
      calls.push({ line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1, literals, combos })
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return calls
}

const report = { files: 0, calls: 0, misaligned: [], differences: [] }

for (const rel of walk(v3Dir)) {
  if (DEAD_FILES.some((re) => re.test(rel))) continue
  const v4Path = path.join(v4Dir, rel)
  if (!fs.existsSync(v4Path)) continue
  const c3 = cnCalls(path.join(v3Dir, rel))
  if (!c3.length) continue
  const c4 = cnCalls(v4Path)
  report.files++
  if (c3.length !== c4.length) {
    report.misaligned.push({ file: rel, v3: c3.length, v4: c4.length })
    continue
  }

  for (let i = 0; i < c3.length; i++) {
    report.calls++
    const l3 = c3[i].literals
    const l4 = c4[i].literals
    if (l3.length !== l4.length) {
      report.misaligned.push({ file: rel, line: c3[i].line, reason: 'jumlah literal berbeda' })
      continue
    }

    // Peta token v3 -> v4 per literal. Literal yang jumlah tokennya diubah koreksi R1/R2 dipetakan serakah
    // (token sama dipertahankan urutannya); token yang hilang (R1) tidak punya padanan.
    const tokenMap = new Map()
    l3.forEach((lit, k) => {
      const a = lit.split(/\s+/)
      const b = l4[k].split(/\s+/)
      if (a.length === b.length) a.forEach((t, j) => tokenMap.set(t, b[j]))
      else {
        let j = 0
        for (const t of a) {
          const found = b.indexOf(t, j)
          if (found >= 0) {
            tokenMap.set(t, b[found])
            j = found + 1
          }
        }
      }
    })

    // Token v4 yang ditambahkan koreksi R2 (tidak punya asal v3) tidak bisa "diharapkan" dari sisi v3.
    const fromV3 = new Set([...tokenMap.values()])
    report.combos = (report.combos ?? 0) + c3[i].combos.length
    for (const combo of c3[i].combos) {
      const input3 = combo.map((k) => l3[k]).join(' ')
      const input4 = combo.map((k) => l4[k]).join(' ')
      const merged3 = twMerge2(input3).split(/\s+/).filter(Boolean)
      const merged4 = twMerge3(input4).split(/\s+/).filter(Boolean)
      const all4 = new Set(input4.split(/\s+/).filter(Boolean))
      const expected4 = new Set(merged3.map((t) => tokenMap.get(t)).filter((t) => t && all4.has(t)))
      const actual4 = new Set(merged4)
      const missing = [...expected4].filter((t) => !actual4.has(t))
      const extra = [...actual4].filter((t) => !expected4.has(t) && fromV3.has(t))
      if (missing.length || extra.length) {
        report.differences.push({ file: rel.replace(/\\/g, '/'), line: c3[i].line, v3: input3, v4: input4, dibuangV4TapiDipertahankanV3: missing, dipertahankanV4TapiDibuangV3: extra })
        break
      }
    }
  }
}

fs.writeFileSync(outPath, JSON.stringify(report, null, 1))
console.log(`berkas: ${report.files} · panggilan cn(): ${report.calls} · kombinasi runtime: ${report.combos} · tidak sejajar: ${report.misaligned.length} · hasil merge berbeda: ${report.differences.length}`)
for (const m of report.misaligned.slice(0, 10)) console.log('  ! tidak sejajar:', JSON.stringify(m))
for (const d of report.differences.slice(0, 40)) {
  console.log(`\n  ${d.file}:${d.line}`)
  if (d.dibuangV4TapiDipertahankanV3.length) console.log(`    dibuang tw-merge 3, dipertahankan tw-merge 2: ${d.dibuangV4TapiDipertahankanV3.join(' ')}`)
  if (d.dipertahankanV4TapiDibuangV3.length) console.log(`    dipertahankan tw-merge 3, dibuang tw-merge 2: ${d.dipertahankanV4TapiDibuangV3.join(' ')}`)
  console.log(`    v4: ${d.v4.slice(0, 220)}`)
}
