// Merakit CSS kandidat v4 dari hasil codemod + perbaikan yang terukur oleh harness.
// Pemakaian: node assemble.mjs <codemod-app.css> <v3ref-dir> <out.css> [--bespoke-layer=utilities|none] [--harness-source=path]
import fs from 'node:fs'
import { createRequire } from 'node:module'
import postcss from 'postcss'

const [, , codemodCssPath, v3refDir, outPath, ...flags] = process.argv
const opt = Object.fromEntries(flags.map((f) => f.replace(/^--/, '').split('=')))
const bespokeLayer = opt['bespoke-layer'] || 'utilities'
const harnessSource = opt['harness-source']

const require = createRequire(`${v3refDir}/package.json`)
const v3colors = require('tailwindcss/colors')

// ===== 1. Palet v3 (hex) =====
// Tailwind v4 mengganti nilai palet bawaan ke OKLCH; sebagian warna (amber-300, blue-600, green-400, ...)
// bahkan keluar dari gamut sRGB. Mengembalikan nilai hex v3 membuat SEMUA utilitas warna identik
// dengan Laravel tanpa menyentuh satu pun nama class.
const FAMILIES = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const paletteLines = []
for (const fam of FAMILIES) {
  for (const [shade, hex] of Object.entries(v3colors[fam])) paletteLines.push(`  --color-${fam}-${shade}: ${hex};`)
}
paletteLines.push(`  --color-black: ${v3colors.black};`, `  --color-white: ${v3colors.white};`)

const PALETTE = `
/* ============================================================================
   PALET v3 — nilai hex dari tailwindcss@3.4.19 (lib/public/colors.js)
   ----------------------------------------------------------------------------
   Tailwind v4 mengganti nilai palet bawaan ke OKLCH. Hasil terukur (harness Fase 2):
   104 utilitas warna UBSC keluar dari gamut sRGB (mis. amber-300 rgb(252,211,77) ->
   rgb(255,210,48)), 23 bergeser jelas (checkbox forms plugin blue-600 rgb(37,99,235) ->
   rgb(21,93,252)). Menimpa variabelnya dengan nilai v3 mengembalikan tampilan Laravel
   untuk seluruh class warna — tanpa mengubah satu pun nama class.
   ============================================================================ */
@theme {
${paletteLines.join('\n')}
}
`

// ===== 2. Kompat skala & default yang berubah di v4 =====
// Nilai v3 dari tailwindcss@3.4.19 stubs/config.full.js. Nama v4 mengikuti rename codemod:
// v3 drop-shadow-sm -> v4 drop-shadow-xs, v3 drop-shadow -> v4 drop-shadow-sm, dst.
const COMPAT_THEME = `
/* ============================================================================
   KOMPAT DEFAULT v3 — ring & drop-shadow
   ----------------------------------------------------------------------------
   ring  : v3 = 3px biru-500 opasitas 0.5. v4 = currentColor (hitam pada teks hitam).
   drop-shadow: v4 mengganti nilai skalanya; v3 sm/md/lg/xl berupa DUA lapisan.
   ============================================================================ */
@theme {
  --default-ring-width: 3px;
  --default-ring-color: rgb(59 130 246 / 0.5);

  --drop-shadow-xs: 0 1px 1px rgb(0 0 0 / 0.05);
  --drop-shadow-sm: 0 1px 2px rgb(0 0 0 / 0.1), 0 1px 1px rgb(0 0 0 / 0.06);
  --drop-shadow-md: 0 4px 3px rgb(0 0 0 / 0.07), 0 2px 2px rgb(0 0 0 / 0.06);
  --drop-shadow-lg: 0 10px 8px rgb(0 0 0 / 0.04), 0 4px 3px rgb(0 0 0 / 0.1);
  --drop-shadow-xl: 0 20px 13px rgb(0 0 0 / 0.03), 0 8px 5px rgb(0 0 0 / 0.08);
  --drop-shadow-2xl: 0 25px 25px rgb(0 0 0 / 0.15);
}
`

// ===== 2b. Line-height skala font v3 =====
// v4 mengganti line-height bawaan text-* dari rem absolut ke rasio tanpa satuan, dan membuat text-*
// membaca --tw-leading (sehingga leading-* SELALU menang). Dua perilaku v3 yang hilang, terukur di
// korpus nyata:
//  (1) "sm:text-xs xl:text-[20px]" — v3 16px (rem absolut milik text-xs tetap), v4 26.7px (rasio ikut ukuran baru).
//  (2) "leading-tight xl:text-2xl" — v3 32px (varian text-2xl ditulis setelah leading-tight), v4 30px.
const v3FontSize = require('tailwindcss/stubs/config.full.js').theme.fontSize
const LINE_HEIGHT = `
/* ============================================================================
   LINE-HEIGHT SKALA FONT v3
   ----------------------------------------------------------------------------
   v4: line-height text-* = rasio tanpa satuan + dibaca lewat var(--tw-leading, ...).
   v3: rem absolut, dan urutan CSS (bukan --tw-leading) yang menentukan pemenang
   antara text-* dan leading-*. Keduanya dikembalikan di sini.
   ============================================================================ */
@theme {
${Object.entries(v3FontSize)
  .map(([k, [, lh]]) => `  --text-${k}--line-height: ${typeof lh === 'object' ? lh.lineHeight : lh};`)
  .join('\n')}
}
${Object.keys(v3FontSize)
  .map((k) => `@utility text-${k} {\n  font-size: var(--text-${k});\n  line-height: var(--text-${k}--line-height);\n}`)
  .join('\n')}
`

// ===== 2c. drop-shadow dua lapis =====
// Utilitas inti menulis --tw-drop-shadow: drop-shadow(var(--drop-shadow-sm)). Dengan nilai tema dua lapis
// hasilnya drop-shadow(a, b) — sintaks TIDAK VALID, filter jatuh ke `none` (terukur: bayangan hilang).
// @utility berikut menulis ulang --tw-drop-shadow sebagai rangkaian drop-shadow() yang sah.
const v3Drop = require('tailwindcss/stubs/config.full.js').theme.dropShadow
const V4_DROP_NAME = { sm: 'xs', DEFAULT: 'sm', md: 'md', lg: 'lg', xl: 'xl', '2xl': '2xl' }
const FILTER_CHAIN = 'var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)'
const DROP_SHADOW = `
/* drop-shadow v3 dua lapis — lihat catatan 2c di assemble.mjs */
${Object.entries(v3Drop)
  .filter(([k, v]) => Array.isArray(v) && V4_DROP_NAME[k])
  .map(([k, layers]) => `@utility drop-shadow-${V4_DROP_NAME[k]} {\n  --tw-drop-shadow: ${layers.map((l) => `drop-shadow(${l})`).join(' ')};\n  filter: ${FILTER_CHAIN};\n}`)
  .join('\n')}
`

// ===== 3. Gradien diinterpolasi di sRGB seperti v3 =====
const DIRS = { t: 'top', tr: 'top right', r: 'right', br: 'bottom right', b: 'bottom', bl: 'bottom left', l: 'left', tl: 'top left' }
const GRADIENT = `
/* ============================================================================
   GRADIEN — interpolasi sRGB seperti v3
   ----------------------------------------------------------------------------
   v4 bg-linear-to-* memakai "to <arah> in oklab" di browser yang mendukung; v3
   menginterpolasi di sRGB. Titik tengah gradien multi-stop bergeser (101 string class
   UBSC memakai gradien). @utility di bawah menimpa utilitas bawaan dengan nama yang
   sama — keluarannya ditulis setelah utilitas inti, jadi menang pada spesifisitas sama.
   ============================================================================ */
${Object.entries(DIRS)
  .map(([k, dir]) => `@utility bg-linear-to-${k} {\n  --tw-gradient-position: to ${dir} in srgb;\n  background-image: linear-gradient(var(--tw-gradient-stops));\n}`)
  .join('\n')}
`

// ===== 4. Kompat preflight =====
const PREFLIGHT_COMPAT = `
/* ============================================================================
   KOMPAT PREFLIGHT v3 -> v4
   ----------------------------------------------------------------------------
   - Warna placeholder: v3 gray-400; v4 currentColor 50%.
   - Cursor button: v3 pointer; v4 default.
   - Padding sel tabel: preflight v4 me-reset padding di SEMUA elemen, v3 tidak
     menyentuh td/th sehingga padding bawaan UA (1px) tetap berlaku. Terukur: <table>
     2 kolom 4px lebih sempit dan 2px lebih pendek di v4.
   ============================================================================ */
@layer base {
  input::placeholder,
  textarea::placeholder {
    color: var(--color-gray-400);
  }

  button:not(:disabled),
  [role='button']:not(:disabled) {
    cursor: pointer;
  }

  td,
  th {
    padding: 1px;
  }

  /* v3 tidak me-reset tombol di dalam input file; v4 memasukkannya ke reset universal
     (terukur: input file 30px -> 24px). */
  ::file-selector-button {
    margin: revert;
    padding: revert;
    border: revert;
  }

  /* v3 preflight: [type=search] appearance textfield (menang atas forms plugin yang
     spesifisitasnya lebih rendah). Dipakai kotak cari DataTable, Topbar, CheckIn. */
  [type='search'] {
    -webkit-appearance: textfield;
    appearance: textfield;
    outline-offset: -2px;
  }

  /* v3 tidak mengosongkan latar input; v4 men-transparan-kan semua input. Tipe yang
     TIDAK ditangani forms plugin kehilangan latar putih UA-nya. */
  input:where([type='range'], [type='color'], [type='file']) {
    background-color: revert;
  }

  /* Padding option & margin dialog bawaan UA — dihapus reset universal v4, dipertahankan v3.
     Belum dipakai UBSC; disertakan agar semantik preflight v3 utuh untuk kode berikutnya. */
  option {
    padding: revert;
  }

  dialog {
    margin: revert;
  }
}
`

// ===== 5. Transformasi CSS hasil codemod =====
const root = postcss.parse(fs.readFileSync(codemodCssPath, 'utf8'))

// 5a. @font-face dikeluarkan dari @layer utilities (codemod membungkusnya; font tidak ikut cascade layer).
root.walkAtRules('layer', (layer) => {
  if (layer.params !== 'utilities') return
  const onlyFonts = layer.nodes.every((n) => n.type === 'comment' || (n.type === 'atrule' && n.name === 'font-face'))
  if (onlyFonts) layer.replaceWith(layer.nodes)
})

// 5b. maplibregl @apply ...! — terbukti MATI di v3 (tidak satu rule pun ter-generate di build
//     Laravel) dan HIDUP di v4. Rewrite.md: port dalam keadaan di-comment.
root.walkRules((rule) => {
  if (!/maplibregl-popup-(content|tip)/.test(rule.selector)) return
  const text = rule.toString()
  rule.replaceWith(
    postcss.comment({
      text: `DI-COMMENT (Rewrite.md, hazard @apply ...!): aturan ini tidak menghasilkan CSS apa pun di Tailwind v3 —\n   build produksi Laravel tidak memuat satu pun rule maplibregl-popup — tapi HIDUP di v4 dan akan\n   mengubah popup peta. Bandingkan popup dengan situs Laravel dulu sebelum mengaktifkan.\n   ${text.replace(/\*\//g, '* /')}`
    })
  )
})

// 5c. CSS bespoke = semua node tingkat atas SETELAH @layer base terakhir.
const topNodes = root.nodes
const lastBaseIdx = topNodes.map((n, i) => (n.type === 'atrule' && n.name === 'layer' && n.params === 'base' ? i : -1)).filter((i) => i >= 0).pop()

// Variabel warna typography bernilai v3. Plugin mengimpor tailwindcss/colors LANGSUNG — di v4 itu
// resolve ke palet OKLCH dan melewati override @theme (terukur: prose rgb(55,65,81) -> rgb(54,65,83)).
// Dihasilkan oleh v3ref/gen-prose.cjs dari styles.js milik plugin sendiri, dengan warna v3.
const proseVars = fs.readFileSync(`${v3refDir}/prose-v3-vars.css`, 'utf8')
root.append(postcss.comment({ text: 'TYPOGRAPHY — variabel warna prose bernilai v3 (lihat catatan di assemble.mjs)' }))
root.append(postcss.parse(proseVars.replace(/^ {2}/gm, '')))

const bespoke = root.nodes.slice(lastBaseIdx + 1)
if (bespokeLayer === 'utilities') {
  const wrapper = postcss.atRule({ name: 'layer', params: 'utilities' })
  for (const n of bespoke) wrapper.append(n.clone())
  for (const n of bespoke) n.remove()
  wrapper.prepend(
    postcss.comment({
      text: 'CSS BESPOKE dalam @layer utilities — mereproduksi urutan cascade v3: di v3 semua CSS tanpa layer dan\n   bespoke ditulis setelah utilitas, jadi spesifisitas memutuskan dan bespoke menang saat seri. CSS tanpa layer\n   di v4 justru menang atas SEMUA utilitas, termasuk varian hover:/md: yang di v3 menang lewat spesifisitas.'
    })
  )
  root.append(wrapper)
}

// 5d. Sisipkan blok tambahan tepat setelah @custom-variant (sebelum @theme codemod).
let css = root.toString()
const anchor = css.indexOf('@theme {')
css = css.slice(0, anchor) + PALETTE + COMPAT_THEME + css.slice(anchor)
css = css.replace(/(\n@layer base \{)/, `\n${PREFLIGHT_COMPAT}\n$1`)
css += `\n${GRADIENT}\n${LINE_HEIGHT}\n${DROP_SHADOW}`

if (harnessSource) css = css.replace("@import 'tailwindcss';", `@import 'tailwindcss' source(none);\n@source '${harnessSource}';`)

fs.writeFileSync(outPath, css)
console.log(`kandidat ditulis: ${outPath} (${css.split('\n').length} baris, bespoke-layer=${bespokeLayer})`)
