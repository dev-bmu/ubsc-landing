// Server statis untuk harness. Kedua sisi berbagi /fonts dan /assets dari public/ Laravel, sehingga
// satu-satunya variabel yang berbeda adalah stylesheet dan string class-nya.
//
// Pemakaian:
//   node server.mjs <out-dir> <laravel-built.min.css> <laravel public/> <kandidat.out.css> [port]
//   node server.mjs <out-dir> <laravel-built.min.css> <laravel public/> --next=http://127.0.0.1:3000 [port]
//
// Mode --next (gate /styleguide): halaman kandidat BUKAN berkas statis + CSS kandidat, melainkan route
// /styleguide/<k> yang dirender build produksi ubsc-landing dengan globals.css aslinya. Halaman itu di-proxy
// ke origin yang sama dengan baseline, karena compare.html membaca DOM kedua iframe dan browser memblokir
// akses DOM lintas origin.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const nextArg = args.find((a) => a.startsWith('--next='))
const positional = args.filter((a) => !a.startsWith('--'))
const [outDir, laravelCss, laravelPublic] = positional
const NEXT_ORIGIN = nextArg ? nextArg.slice('--next='.length) : null
const candidateCssPath = NEXT_ORIGIN ? null : positional[3]
const port = Number((NEXT_ORIGIN ? positional[3] : positional[4]) || 4599)
const HERE = path.dirname(fileURLToPath(import.meta.url))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4'
}

function send(res, file) {
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404).end('tidak ada')
      return
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' })
    res.end(buf)
  })
}

// Setiap percobaan dibatasi 20 detik dan diulang sekali: permintaan yang menggantung ke server Next membuat event
// `load` iframe tidak pernah datang dan walker berhenti karena timeout tanpa petunjuk. Yang lambat dicatat.
async function proxy(res, url) {
  const started = Date.now()
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const upstream = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) })
      const body = Buffer.from(await upstream.arrayBuffer())
      const headers = { 'Cache-Control': 'no-store' }
      const type = upstream.headers.get('content-type')
      if (type) headers['Content-Type'] = type
      res.writeHead(upstream.status, headers)
      res.end(body)
      if (Date.now() - started > 2000) console.warn(`proxy lambat ${Date.now() - started}ms (percobaan ${attempt}): ${url}`)
      return
    } catch (error) {
      console.warn(`proxy gagal percobaan ${attempt} setelah ${Date.now() - started}ms: ${url} — ${error.message}`)
      if (attempt === 2) res.writeHead(502).end(`proxy gagal: ${error.message}`)
    }
  }
}

http
  .createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    // Identitas server: walker memeriksanya supaya tidak pernah mengukur server lama yang masih memegang port
    // dengan CSS kandidat lain (terjadi sekali: port bentrok, server baru mati, walker diam-diam mengukur c3).
    if (url === '/whoami') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
      return res.end(JSON.stringify({ outDir, candidate: NEXT_ORIGIN ? `next:${NEXT_ORIGIN}` : path.resolve(candidateCssPath) }))
    }
    if (url === '/laravel.css') return send(res, laravelCss)
    if (NEXT_ORIGIN) {
      const page = url.match(/^\/candidate-(\d+)\.html$/)
      if (page) return proxy(res, `${NEXT_ORIGIN}/styleguide/${page[1]}`)
      if (url.startsWith('/_next/')) return proxy(res, `${NEXT_ORIGIN}${req.url}`)
    } else if (url === '/candidate.css') {
      // CSS kandidat dibaca ulang tiap permintaan: iterasi cukup kompilasi ulang, tanpa restart server.
      return send(res, candidateCssPath)
    }
    if (/^\/(baseline|candidate)-\d+\.html$/.test(url) || url === '/pages.json') return send(res, path.join(outDir, url))
    if (url === '/compare.html') return send(res, path.join(HERE, 'compare.html'))
    // Selebihnya (fonts, assets gambar yang dirujuk url() di CSS bespoke) dari public/ Laravel.
    const safe = path.normalize(url).replace(/^([/\\])+/, '')
    if (safe.startsWith('..')) return res.writeHead(400).end('path tidak valid')
    return send(res, path.join(laravelPublic, safe))
  })
  .listen(port, () => console.log(`harness server :${port}${NEXT_ORIGIN ? ` (kandidat = ${NEXT_ORIGIN}/styleguide)` : ''}`))
