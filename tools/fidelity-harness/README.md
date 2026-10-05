# Fidelity harness — gate Fase 2 (design system)

Membuktikan CSS Tailwind v4 yang dikirim ke `ubsc-landing` dan `ubsc-admin` merender **identik** dengan CSS produksi
Laravel (Tailwind v3). Status, temuan, dan hasil gate: [`ubsc-api/docs/fase-2.md`](../../../ubsc-api/docs/fase-2.md).

## Cara kerjanya

Pasangan halaman dengan DOM identik — hanya string class dan stylesheet yang berbeda:

- **baseline**: class v3 + `public/build/assets/app-*.css` Laravel (oracle)
- **kandidat**: class v4 + CSS dari berkas final `src/styles/*.css` (tepat yang dikirim ke repo Next)

Isi sel: setiap utilitas yang ter-generate di build Laravel (3.678), class & selector bespoke, 38 `@keyframes`, elemen
polos (preflight + forms plugin), dan **korpus string `className` asli** (4.251 string dari 155 berkas hidup) yang sisi
v4-nya diambil dari sumber migrasi (codemod + koreksi) — teks yang benar-benar di-port di Fase 4–8.

- **Vonis** = pixel diff (pixelmatch), di setiap batas `@media` yang ada di kedua CSS (360…1800px).
- **Diagnosis** = computed style setiap elemen (473 properti, termasuk `::before`/`::after`/`::placeholder`), dengan
  konversi warna matematis dan aturan kesetaraan yang terdokumentasi satu per satu di `compare.html`. Target gate: **0**
  selisih computed, bukan hanya 0 piksel — pixelmatch bertoleransi warna, computed style tidak.
- **Drift dokumen panjang** (`drift.mjs`): sel kecil tidak melihat selisih < 1/64px per elemen yang menumpuk sepanjang
  dokumen. Prose LegalShell/RichEditor dan tumpukan tipografi korpus dirender panjang; posisi setiap elemen harus sama.
- **Analisis statis** untuk yang tidak bisa dirender diam: pasangan cascade berbalik pada varian state
  (`cascade-ties.mjs`), hasil `cn()`/tailwind-merge (`cn-parity.mjs`), pola format angka/tanggal (`format-parity.mjs`).

## Menjalankan

```bash
# sekali: direktori kerja (salinan Laravel, codemod bertag, referensi v3). Repo Laravel hanya dibaca.
WORK=/tmp/ubsc-harness LARAVEL="C:/IT BMU/BMU-LANDINGPAGE/UBSC-LARAVEL" bash bootstrap.sh

# 1. kandidat + koreksi markup + walker di semua breakpoint (Tailwind CLI)
WORK=... LARAVEL=... PORT=4620 bash pipeline.sh final 360,390,430,640,768,1024,1100,1280,1440,1536,1800 --apply-corrections
cp candidates/final.emit/*.css ../../src/styles/          # lalu di ubsc-admin: npm run sync:design-system

# 2. analisis statis
node cascade-ties.mjs $WORK/laravel-built.min.css candidates/final.out.css $WORK/corpus.json $LARAVEL/resources/css/app.css reference/cascade-ties.json
node cn-parity.mjs $LARAVEL/resources/js $WORK/upgrade/resources/js $LARAVEL/node_modules/tailwind-merge ../../node_modules/typescript reference/cn-parity.json
node format-parity.mjs ../../../ubsc-api/shared/format.ts reference/format-parity.json $LARAVEL/resources/js
node export-class-map.mjs $WORK/corpus.json $WORK/gen/out/class-map.json $WORK/corrections-applied.json reference/class-migration.json

# 3. gate resmi /styleguide: build produksi Next yang sesungguhnya (postcss, cssnano-simple, globals.css asli)
node styleguide-route.mjs install $WORK/gen/out ../..
(cd ../.. && npm run build && npx next start -p 3000 -H 127.0.0.1) &
node server.mjs $WORK/gen/out $WORK/laravel-built.min.css $LARAVEL/public --next=http://127.0.0.1:3000 4613 &
node walk.mjs http://127.0.0.1:4613 $WORK/run-next 360,390,430,640,768,1024,1100,1280,1440,1536,1800 --concurrency=4 --expect-candidate=next:http://127.0.0.1:3000
MSYS_NO_PATHCONV=1 node drift.mjs http://127.0.0.1:4613 $WORK/corpus.json /_next/static/css/<hash>.css 360,390,768,1280,1800
node styleguide-route.mjs remove ../..                       # route TIDAK PERNAH di-commit; build ulang setelahnya
```

| Berkas | Peran |
| --- | --- |
| `bootstrap.sh` | membuat `$WORK`: oracle, repo migrasi (tag `baseline-v3` → `codemod`), worktree codemod, referensi v3 |
| `pipeline.sh` | inventaris → korpus → sel → kandidat → koreksi → walker |
| `extract.mjs` | inventaris class dari CSS produksi Laravel |
| `corpus.mjs` | pasangan string className v3 (Laravel) ↔ v4 (sumber migrasi) |
| `gen-cells.mjs`, `build-pages.mjs` | daftar sel, halaman baseline/kandidat berpaginasi, daftar class mentah untuk Tailwind |
| `assemble.mjs` | merakit CSS v4 dari output codemod + kompat terukur; `--emit-dir` menulis berkas final terpecah |
| `corrections.mjs` | koreksi markup R0–R4 pada sumber migrasi |
| `server.mjs`, `compare.html`, `walk.mjs` | server (juga mode `--next` untuk gate `/styleguide`), pembanding in-browser, driver Playwright |
| `styleguide-route.mjs` | memasang/mencopot route `/styleguide` sekali-pakai di `ubsc-landing` |
| `drift.mjs` | uji penumpukan posisi pada dokumen panjang (oracle vs kandidat CLI atau CSS build Next) |
| `cascade-ties.mjs`, `cn-parity.mjs`, `format-parity.mjs` | analisis statis (state, tailwind-merge, format) |
| `analyze.mjs`, `show-diff.mjs`, `bare-report.mjs`, `dead-classes.mjs` | triase laporan |
| `mapping-agreement.mjs` | memeriksa codemod memigrasi string yang sama secara identik di kode asli dan di `Styleguide.tsx` |
| `export-class-map.mjs` | `reference/class-migration.json` — peta className v3 → v4 untuk porting |

`reference/` menyimpan hasil yang mahal atau berisiko dibuat ulang: peta migrasi class, laporan koreksi dan analisis
statis, dan generator variabel prose v3 (`gen-prose.cjs`, dipakai `bootstrap.sh`).

## Prasyarat & catatan

- Node 24, Edge atau Chrome terpasang (`playwright-core`, **tidak** mengunduh browser; `HARNESS_BROWSER` untuk path lain).
- Codemod dipatok `@tailwindcss/upgrade@4.3.3`; Tailwind CLI kandidat mengikuti versi `tailwindcss` harness, yang harus
  sama persis dengan versi di kedua repo Next (dipin tanpa `^`). Upgrade Tailwind = jalankan ulang seluruh gate.
- Satu viewport ± 35 detik untuk 8.251 sel (28 halaman × 300 sel, paralel); mode `--next` ± 2 menit dengan
  `--concurrency=4`. Halaman sempit sangat tinggi — jangan jalankan pekerjaan berat lain bersamaan.
- Pakai port berbeda per server (`PORT=` untuk pipeline). `walk.mjs --expect-candidate` menolak mengukur server lama.
- Git Bash mengubah argumen berawalan `/` menjadi path Windows — `MSYS_NO_PATHCONV=1` untuk `drift.mjs /_next/...`.
- Varian yang butuh interaksi (`hover:`, `focus:`, `group-hover:`) tidak dipicu walker — itulah tugas `cascade-ties.mjs`.
