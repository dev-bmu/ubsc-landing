// ===== PostCSS =====
// Tailwind v4: tidak ada tailwind.config.js dan tidak ada autoprefixer terpisah. Token desain UBSC ada di
// src/styles (urutan import di src/app/globals.css).
//
// optimize: false WAJIB — terukur di gate Fase 2 (ubsc-api/docs/fase-2.md). Di build produksi @tailwindcss/postcss
// menjalankan Lightning CSS, yang menyimpan angka sebagai f32 dan menulis ulang 1.1428571em menjadi 1.14286em.
// Setiap margin/line-height prose bergeser di bawah 1/64px, lalu MENUMPUK: dokumen prose-sm 40 bagian turun 5px
// dari Laravel, prose 0,6px. Tanpa optimize, CSS yang dikirim sama dengan yang diukur harness; Next tetap
// meminifikasinya dengan cssnano-simple.
const config = {
  plugins: {
    '@tailwindcss/postcss': { optimize: false }
  }
}

export default config
