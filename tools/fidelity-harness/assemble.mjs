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
   KOMPAT DEFAULT v3 — breakpoint, ring & drop-shadow
   ----------------------------------------------------------------------------
   breakpoint: v3 = px, v4 = rem. Dua akibat terukur: (1) varian arbitrer ber-px
     (min-[1440px], min-[1800px]) tidak lagi diurutkan setelah xl/2xl karena unitnya
     berbeda, sehingga xl: yang menang (terukur di SectionTwo/Four/Seven 1440px dan
     FacilityListSection 1800px); (2) pengunjung yang memperbesar font default browser
     melihat layout breakpoint yang berbeda dari Laravel.
   ring  : v3 = 3px biru-500 opasitas 0.5. v4 = currentColor (hitam pada teks hitam).
   drop-shadow: v4 mengganti nilai skalanya; v3 sm/md/lg/xl berupa DUA lapisan.
   ============================================================================ */
@theme {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;

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

  /* v3 hanya memberi tombol input file appearance + font inherit; v4 memasukkannya ke reset universal
     DAN reset form (warna, latar, radius, letter-spacing). Terukur: input file 30px -> 24px, tombol
     kehilangan latar abu-abu UA. Semua input file UBSC ber-class hidden, jadi ini murni paritas semantik. */
  ::file-selector-button {
    margin: revert;
    padding: revert;
    border: revert;
    border-radius: revert;
    background-color: revert;
    color: revert;
    letter-spacing: revert;
    opacity: revert;
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

  /* Prefiks yang di Laravel dipasang autoprefixer pada output @tailwindcss/forms. Tanpa optimize (lihat
     postcss.config.mjs repo Next) Tailwind v4 tidak memasang prefiks, dan Safari masih membutuhkan
     -webkit-user-select. Chromium memperlakukannya sebagai alias bernilai sama — harness tidak berubah. */
  input:where([type='checkbox']),
  input:where([type='radio']) {
    -webkit-user-select: none;
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

// 5b2. Blok kompat warna border yang dipasang codemod menyasar `*, ::after, ::before, ::backdrop,
//      ::file-selector-button`. Preflight v3 hanya menyasar `*, ::before, ::after` — tombol input file dan
//      ::backdrop di Laravel memakai warna border UA (terukur: border tombol file hitam -> gray-200).
root.walkRules((rule) => {
  if (!rule.selectors.includes('::file-selector-button')) return
  if (!rule.nodes.some((n) => n.type === 'decl' && n.prop === 'border-color' && /--color-gray-200/.test(n.value))) return
  rule.selectors = rule.selectors.filter((s) => s !== '::backdrop' && s !== '::file-selector-button')
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

// 5c2. Prefiks autoprefixer yang masih dibutuhkan target Tailwind v4 (Safari 16.4+). Build Laravel menjalankan
//      autoprefixer atas CSS bespoke; di repo Next tidak ada lagi (optimize Lightning CSS dimatikan karena presisi
//      angka). Dari seluruh selisih prefiks oracle vs kandidat, hanya user-select yang masih bermakna: Safari tidak
//      mengenal user-select tanpa prefiks. Chromium memperlakukan -webkit-user-select sebagai alias bernilai sama.
for (const n of bespoke) {
  n.walkDecls?.('user-select', (decl) => {
    if (!decl.parent.some((d) => d.type === 'decl' && d.prop === '-webkit-user-select')) decl.cloneBefore({ prop: '-webkit-user-select' })
  })
}

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

// Varian hover v3: `:hover` apa adanya. v4 membungkus hover: dalam @media (hover: hover), sehingga di perangkat
// sentuh gaya hover yang "menempel" setelah tap — perilaku yang dilihat pengunjung mobile Laravel — hilang.
const HOVER_VARIANT = `
/* Varian hover v3: tanpa @media (hover: hover). Lihat catatan 5d di assemble.mjs. */
@custom-variant hover (&:hover);
`
css = css.slice(0, anchor) + HOVER_VARIANT + PALETTE + COMPAT_THEME + css.slice(anchor)
css = css.replace(/(\n@layer base \{)/, `\n${PREFLIGHT_COMPAT}\n$1`)
css += `\n${GRADIENT}\n${LINE_HEIGHT}\n${DROP_SHADOW}`

if (harnessSource) css = css.replace("@import 'tailwindcss';", `@import 'tailwindcss' source(none);\n@source '${harnessSource}';`)

fs.writeFileSync(outPath, css)
console.log(`kandidat ditulis: ${outPath} (${css.split('\n').length} baris, bespoke-layer=${bespokeLayer})`)

// ===== 6. Berkas final untuk repo Next (--emit-dir) =====
// Kandidat monolitik di atas adalah yang diukur harness. Repo Next memakai isi yang SAMA, dipecah supaya
// ubsc-admin bisa memakai fondasi tanpa CSS bespoke landing:
//
//   tailwind-v3-compat.css     plugin, varian, palet & default v3, kompat preflight          (landing + admin)
//   ubsc-base.css              @theme brand hasil codemod, @font-face, @layer base Laravel     (landing + admin)
//   ubsc-bespoke.css           CSS bespoke landing, di-import dengan layer(utilities)           (landing saja)
//   tailwind-v3-utilities.css  variabel prose v3, @utility gradien/text/drop-shadow v3          (landing + admin)
//
// Urutan import di entry mereproduksi urutan kandidat. Satu-satunya node yang berpindah posisi adalah @theme
// brand (dari sebelum kompat preflight ke sesudahnya) — @theme tidak mengeluarkan CSS di posisinya, dan tidak
// ada variabel yang didefinisikan dua kali, sehingga keluaran kompilasi identik (diverifikasi pipeline.sh).
const emitDir = opt['emit-dir']
if (emitDir) {
  const parsed = postcss.parse(css)
  const header = []
  const brandTheme = []
  const preflightLayers = []
  const baseNodes = []
  const tail = []
  let bespokeWrapper = null
  let seenLaravelBase = false
  let pendingComments = []
  const take = (arr, node) => {
    arr.push(...pendingComments, node)
    pendingComments = []
  }
  for (const node of parsed.nodes) {
    if (node.type === 'comment') {
      pendingComments.push(node)
      continue
    }
    if (node.type === 'atrule' && (node.name === 'import' || node.name === 'source')) {
      pendingComments = []
      continue
    }
    if (node.type === 'atrule' && (node.name === 'plugin' || node.name === 'custom-variant')) take(header, node)
    else if (node.type === 'atrule' && node.name === 'theme') {
      // Palet v3, default ring/drop-shadow, dan line-height v3 dikenali dari variabelnya; sisanya @theme brand.
      const body = node.toString()
      if (/--color-slate-50:|--default-ring-width|--drop-shadow-xs/.test(body)) take(header, node)
      else if (/--text-xs--line-height/.test(body)) take(tail, node)
      else take(brandTheme, node)
    } else if (node.type === 'atrule' && node.name === 'layer' && node.params === 'base') {
      if (/html,\s*body/.test(node.toString())) {
        take(baseNodes, node)
        seenLaravelBase = true
      } else take(preflightLayers, node)
    } else if (node.type === 'atrule' && node.name === 'font-face') take(baseNodes, node)
    else if (node.type === 'atrule' && node.name === 'layer' && node.params === 'utilities' && seenLaravelBase && !bespokeWrapper) {
      pendingComments = []
      bespokeWrapper = node
    } else if (node.type === 'atrule' && node.name === 'utility') take(tail, node)
    else throw new Error(`node tingkat atas tidak dikenali saat memecah kandidat: ${node.toString().slice(0, 120)}`)
  }
  if (!bespokeWrapper) throw new Error('blok bespoke @layer utilities tidak ditemukan')

  // Variabel prose (akhir blok bespoke) dipisah ke berkas utilitas kompat; sisanya = bespoke murni.
  const bespokeChildren = bespokeWrapper.nodes.map((n) => n.clone())
  const proseStart = bespokeChildren.findIndex((n) => n.type === 'comment' && /TYPOGRAPHY — variabel warna prose/.test(n.text))
  if (proseStart < 0) throw new Error('penanda variabel prose tidak ditemukan')
  const bespokeOnly = bespokeChildren.slice(0, proseStart)
  const proseNodes = bespokeChildren.slice(proseStart)

  const banner = (title, lines) => `/* ============================================================================\n   ${title}\n   ----------------------------------------------------------------------------\n${lines.map((l) => `   ${l}`).join('\n')}\n   DIHASILKAN tools/fidelity-harness/assemble.mjs --emit-dir. Jangan disunting tangan: ubah assemble.mjs\n   atau sumbernya, jalankan ulang pipeline, dan pastikan gate harness tetap bersih.\n   ============================================================================ */\n`
  // Dirender lewat root baru: at-rule tanpa blok (@plugin, @custom-variant) hanya mendapat titik koma penutup
  // bila ditulis sebagai anak sebuah root — toString() per node menghasilkan "@plugin 'a'\n@plugin 'b'" yang
  // dibaca parser sebagai SATU at-rule.
  const render = (nodes) => {
    const out = postcss.root()
    for (const n of nodes) {
      const clone = n.clone()
      clone.raws.before = '\n\n'
      out.append(clone)
    }
    out.raws.semicolon = true
    return out.toString().replace(/^\n+/, '')
  }
  const proseLayer = postcss.atRule({ name: 'layer', params: 'utilities' })
  for (const n of proseNodes) proseLayer.append(n)

  const files = {
    'tailwind-v3-compat.css': banner('KOMPAT TAILWIND v3 — plugin, varian, palet & default v3, preflight', ['Membuat Tailwind v4 merender identik dengan CSS produksi Laravel (Tailwind v3.4).', 'Setiap blok berisi alasan terukurnya sendiri.']) + '\n' + render([...header, ...preflightLayers]) + '\n',
    'ubsc-base.css': banner('FONDASI UBSC — token brand, @font-face, base Laravel', ['@theme hasil konversi tailwind.config.js Laravel, font @font-face mentah (BUKAN next/font —', 'Rewrite.md), dan @layer base dari resources/css/app.css.']) + '\n' + render([...brandTheme, ...baseNodes]) + '\n',
    'ubsc-bespoke.css': banner('CSS BESPOKE LANDING — dari resources/css/app.css Laravel', ['Di-import globals.css dengan layer(utilities): di v3 CSS ini ditulis SETELAH utilitas,', 'jadi saat spesifisitas seri bespoke yang menang. Kasus seri dengan VARIAN dikoreksi di markup (R3).']) + '\n' + render(bespokeOnly) + '\n',
    'tailwind-v3-utilities.css': banner('KOMPAT TAILWIND v3 — utilitas', ['Variabel warna prose v3, gradien sRGB, line-height skala font v3, drop-shadow dua lapis.']) + '\n' + render([proseLayer, ...tail]) + '\n'
  }
  fs.mkdirSync(emitDir, { recursive: true })
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(`${emitDir}/${name}`, content)
  console.log(`berkas final ditulis ke ${emitDir}: ${Object.keys(files).join(', ')}`)
}
