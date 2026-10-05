// Peta migrasi class Laravel (Tailwind v3) -> sistem baru (Tailwind v4), untuk porting komponen di Fase 4–8.
//
// Sumber migrasi di $WORK/upgrade (codemod 4.3.3 + koreksi R0–R4) bisa dibuat ulang dengan bootstrap.sh +
// pipeline.sh, tetapi bergantung pada npx mengunduh codemod versi yang sama. Berkas ini menyimpan HASILNYA:
//   pairs        setiap string className yang BERUBAH (v3 -> v4), beserta berkas asalnya
//   tokenRenames rename per class dari codemod (untuk string dinamis yang tidak ada di korpus)
//   deadTokens   class yang mati di v3 dan dihapus koreksi R1 — jangan dihidupkan lagi saat porting
//
// Pemakaian: node export-class-map.mjs <korpus.json> <class-map.json> <corrections-applied.json> <keluaran.json>
import fs from 'node:fs'

const [, , corpusPath, classMapPath, correctionsPath, outPath] = process.argv
const { pairs } = JSON.parse(fs.readFileSync(corpusPath, 'utf8'))
const renames = JSON.parse(fs.readFileSync(classMapPath, 'utf8'))
const corrections = JSON.parse(fs.readFileSync(correctionsPath, 'utf8'))

const changed = pairs.filter((p) => p.v3 !== p.v4).map((p) => ({ v3: p.v3, v4: p.v4, files: p.files }))
const deadTokens = [...new Set(corrections.R1.map((r) => r.token))].sort()

const out = {
  keterangan: 'Peta migrasi className Laravel v3 -> Tailwind v4 (codemod @tailwindcss/upgrade 4.3.3 + koreksi R0-R4). Dihasilkan tools/fidelity-harness/export-class-map.mjs.',
  ringkasan: { stringDiperiksa: pairs.length, stringBerubah: changed.length, renameCodemod: renames.length, tokenMati: deadTokens.length },
  koreksi: {
    R0: corrections.R0.length,
    R1: corrections.R1.length,
    R2: corrections.R2.length,
    R3: corrections.R3.map((r) => ({ file: r.file, match: r.match, replace: r.replace, why: r.why })),
    R4: corrections.R4.length
  },
  pairs: changed,
  tokenRenames: renames,
  deadTokens
}
fs.writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n')
console.log(`peta migrasi ditulis: ${outPath} — ${changed.length} string berubah, ${renames.length} rename, ${deadTokens.length} token mati`)
