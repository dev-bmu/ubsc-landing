import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname
})

// ===== R10: URL halaman hanya boleh dari routes.ts =====
// Di Laravel, 47 file memanggil route() global Ziggy. Penggantinya adalah src/config/routes.ts, dan aturan
// ini yang menjaga supaya tidak ada yang diam-diam kembali menulis URL mentah di komponen.
// Aturannya sengaja tidak pintar: secara sintaksis, href="/pricing" dan href="https://instagram.com/..."
// sama-sama Literal dan tidak bisa dibedakan. Jadi tautan eksternal, mailto:, dan tel: memang ikut kena —
// matikan per baris dengan eslint-disable-next-line, jangan melonggarkan aturannya.
const HREF_MESSAGE =
  'URL tidak boleh ditulis sebagai string literal di prop href. Pakai builder dari src/config/routes.ts (mis. routes.news.detail(slug)) supaya URL halaman punya satu sumber kebenaran dan ikut dijaga typedRoutes. Untuk tautan eksternal (http/https), mailto:, atau tel:, tambahkan // eslint-disable-next-line no-restricted-syntax pada baris itu.'

const eslintConfig = [
  {
    // src/types/contracts AUTO-GENERATED oleh `npm run sync:contracts` — isinya milik ubsc-api,
    // diperbaiki di sana, bukan di sini.
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'src/types/contracts/**', 'tools/fidelity-harness/**']
  },

  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // <Link href="/pricing"> dan <a href="/pricing">
          selector: "JSXAttribute[name.name='href'] > Literal",
          message: HREF_MESSAGE
        },
        {
          // Bentuk yang dibungkus kurung kurawal: <Link href={'/pricing'}>
          selector: "JSXAttribute[name.name='href'] > JSXExpressionContainer > Literal",
          message: HREF_MESSAGE
        }
      ]
    }
  },

  {
    // routes.ts justru satu-satunya tempat string URL halaman boleh ditulis — itu sumber kebenarannya.
    files: ['src/config/routes.ts'],
    rules: {
      'no-restricted-syntax': 'off'
    }
  }
]

export default eslintConfig
