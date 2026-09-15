# Fidelity harness — gate Fase 2 (design system)

Membuktikan CSS Tailwind v4 kandidat merender **identik** dengan CSS produksi Laravel (Tailwind v3).
Status dan temuannya: [`ubsc-api/docs/fase-2.md`](../../../ubsc-api/docs/fase-2.md).

## Cara kerjanya

Dua halaman dengan DOM identik — hanya string class yang berbeda:

- **baseline**: class v3 + `public/build/assets/app-*.css` Laravel (oracle)
- **kandidat**: class v4 hasil codemod `@tailwindcss/upgrade` + CSS v4 kandidat

Isi sel: setiap utilitas yang ter-generate di build Laravel (3.678), class & selector bespoke,
38 `@keyframes`, elemen polos (preflight + forms plugin), dan **korpus string `className` asli** dari
TSX Laravel (4.323 string dari 155 berkas hidup) — korpus inilah yang menemukan interpolasi gradien,
class mati-di-v3, dan konflik urutan cascade yang tidak terlihat dari sel satu-class.

Vonis = **pixel diff** (pixelmatch). Diagnosis = **computed style** setiap elemen (473 properti,
termasuk `::before`/`::after`/`::placeholder`), dengan konversi OKLCH→sRGB matematis dan aturan
kesetaraan yang terdokumentasi satu per satu di `compare.html`.

| Berkas | Peran |
| --- | --- |
| `extract.mjs` | inventaris class dari CSS produksi Laravel |
| `gen-cells.mjs` | daftar sel + `Styleguide.tsx` (umpan codemod) |
| `build-pages.mjs` | `baseline.html` / `candidate.html` |
| `assemble.mjs` | merakit CSS v4 kandidat dari output codemod + kompat terukur |
| `server.mjs`, `compare.html`, `walk.mjs` | server statis, pembanding in-browser, driver Playwright |
| `analyze.mjs`, `show-diff.mjs`, `bare-report.mjs` | triase laporan |
| `corpus.mjs`, `corrections.mjs`, `dead-classes.mjs` | korpus berpasangan + mesin koreksi markup (R0–R3) |
| `pipeline.sh` | seluruh alur, dari inventaris sampai laporan |

`reference/` menyimpan input yang mahal dibuat ulang: `app.v4-codemod.css` (output codemod),
`candidate-c2.css` (kandidat terbaik saat ini), `prose-v3-vars.css` + generatornya, dan hasil uji kering
mesin koreksi.

## Prasyarat

- Node 24, Edge atau Chrome terpasang (dipakai lewat `playwright-core` — **tidak** mengunduh browser)
- Salinan scratch Laravel `resources/` + `tailwindcss@3.4.19` (baseline codemod)
- `tailwindcss@3.4.19` terpisah sebagai referensi nilai v3 (palet, skala font, drop-shadow)

## Status & keterbatasan yang diketahui

- **Path masih absolut ke direktori scratch sesi pengerjaan** (`pipeline.sh`, variabel `SP`). Harus
  disesuaikan sebelum dijalankan di mesin lain.
- **Viewport 390px gagal**: halaman 8.323 sel setinggi ratusan ribu piksel dan `page.screenshot`
  Chromium timeout. Perlu paginasi sel (mis. 800 sel per halaman) sebelum ketiga viewport bisa jalan.
- Varian yang butuh interaksi (`hover:`, `focus:`, `group-hover:`) tidak dipicu walker.
