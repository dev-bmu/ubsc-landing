// Server statis untuk harness. Kedua halaman berbagi /fonts dan /assets dari public/ Laravel,
// sehingga satu-satunya variabel yang berbeda adalah stylesheet-nya.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const [, , harnessDir, laravelPublic, candidateCssPath, portArg] = process.argv
const port = Number(portArg || 4599)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript',
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

http
  .createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (url === '/laravel.css') return send(res, `${harnessDir}/../laravel-built.min.css`)
    // CSS kandidat dibaca ulang tiap permintaan: iterasi cukup kompilasi ulang, tanpa restart server.
    if (url === '/candidate.css') return send(res, candidateCssPath)
    if (url === '/baseline.html' || url === '/candidate.html') return send(res, `${harnessDir}/out${url}`)
    if (url === '/compare.html') return send(res, `${harnessDir}/compare.html`)
    // Selebihnya (fonts, assets gambar yang dirujuk url() di CSS bespoke) dari public/ Laravel.
    const safe = path.normalize(url).replace(/^([/\\])+/, '')
    return send(res, path.join(laravelPublic, safe))
  })
  .listen(port, () => console.log(`harness server :${port}`))
