// Driver gate Fase 2: computed-style (diagnosis) + pixel diff (vonis), per halaman sel, per viewport.
// Pemakaian: node walk.mjs <baseUrl> <outDir> [lebar,lebar,...] [--pages=0,3,7] [--concurrency=4] [--expect-candidate=<kandidat.out.css | next:http://…>]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright-core'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const [, , baseUrl, outDir, widthsArg, ...flags] = process.argv
const opt = Object.fromEntries(flags.map((f) => f.replace(/^--/, '').split('=')))
const WIDTHS = (widthsArg || '390,768,1280').split(',').map(Number)
const CONCURRENCY = Number(opt.concurrency || Math.max(2, Math.min(6, Math.floor(os.cpus().length / 3))))
const EDGE = process.env.HARNESS_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const CHUNK = 3200

fs.mkdirSync(outDir, { recursive: true })
const who = await (await fetch(`${baseUrl}/whoami`)).json()
// Mode --next: kandidat berupa origin build Next ("next:http://…"), bukan berkas CSS.
const expected = opt['expect-candidate']?.startsWith('next:') ? opt['expect-candidate'] : opt['expect-candidate'] && path.resolve(opt['expect-candidate'])
if (expected && expected !== who.candidate) {
  console.error(`server di ${baseUrl} menyajikan ${who.candidate}, bukan ${expected} — hentikan server lama dulu`)
  process.exit(3)
}
console.log(`kandidat: ${who.candidate}`)
const manifest = await (await fetch(`${baseUrl}/pages.json`)).json()
const PAGES = opt.pages ? opt.pages.split(',').map(Number) : manifest.pages.map((p) => p.page)
const browser = await chromium.launch({ executablePath: EDGE, args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text'] })

// FREEZE sudah ada di <head> halaman sejak render pertama (build-pages.mjs). Konteks baru per halaman:
// Playwright memberi tiap konteks proses renderer sendiri, jadi halaman bisa diproses paralel.
// Satu kali coba ulang dengan batas lebih longgar: di mode --next halaman kandidat melewati proxy + server Next, dan
// saat mesin sibuk `load` sesekali melewati 30 detik. Kegagalan kedua tetap dilempar.
async function openPage(url, width) {
  for (let attempt = 1; ; attempt++) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    try {
      await page.goto(url, { waitUntil: 'load', timeout: attempt === 1 ? 30000 : 120000 })
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(150)
      return page
    } catch (error) {
      await context.close()
      if (attempt > 1) throw error
      console.warn(`  ! ${url} gagal dimuat (${error.message.split('\n')[0]}), mencoba ulang`)
    }
  }
}

async function cellRects(page) {
  return page.$$eval('[data-cell]', (els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect()
      return { id: e.dataset.cell, label: e.title, x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) }
    })
  )
}

// Screenshot fullPage pada halaman sempit (tinggi puluhan ribu piksel) sesekali melewati batas waktu saat mesin
// sibuk. Satu kali coba ulang; kegagalan kedua tetap dilempar supaya tidak ada halaman yang diam-diam dilewati.
async function shot(page, clip) {
  try {
    return await page.screenshot({ clip, fullPage: true, timeout: 180000 })
  } catch (error) {
    console.warn(`  ! screenshot gagal (${error.message.split('\n')[0]}), mencoba ulang`)
    return page.screenshot({ clip, fullPage: true, timeout: 180000 })
  }
}

async function pixelDiff(width, pageNo) {
  const pa = await openPage(`${baseUrl}/baseline-${pageNo}.html`, width)
  const pb = await openPage(`${baseUrl}/candidate-${pageNo}.html`, width)
  const rects = await cellRects(pa)
  const totalH = await pa.evaluate(() => document.documentElement.scrollHeight)
  const totalHB = await pb.evaluate(() => document.documentElement.scrollHeight)
  const perCell = new Map()
  let mismatched = 0

  // Indeks baris: sel dikelompokkan per y supaya pemetaan piksel -> sel tidak O(n) per piksel.
  const rows = new Map()
  for (const r of rects) {
    const key = Math.floor(r.y / 84)
    if (!rows.has(key)) rows.set(key, [])
    rows.get(key).push(r)
  }
  const findCell = (x, y) => {
    for (const k of [Math.floor(y / 84), Math.floor(y / 84) - 1, Math.floor(y / 84) - 2]) {
      for (const r of rows.get(k) || []) if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return r
    }
    return null
  }

  for (let y = 0; y < totalH; y += CHUNK) {
    const h = Math.min(CHUNK, totalH - y)
    const clip = { x: 0, y, width, height: h }
    const [ba, bb] = await Promise.all([shot(pa, clip), shot(pb, clip)])
    const ia = PNG.sync.read(ba)
    const ib = PNG.sync.read(bb)
    const diff = new PNG({ width: ia.width, height: ia.height })
    const n = pixelmatch(ia.data, ib.data, diff.data, ia.width, ia.height, { threshold: 0.1, includeAA: true, diffColor: [255, 0, 0], alpha: 0 })
    mismatched += n
    if (n > 0) {
      for (let py = 0; py < diff.height; py++) {
        for (let px = 0; px < diff.width; px++) {
          const i = (py * diff.width + px) * 4
          if (diff.data[i] === 255 && diff.data[i + 1] === 0 && diff.data[i + 2] === 0) {
            const c = findCell(px, py + y)
            const key = c ? c.id : `(di luar sel, halaman ${pageNo})`
            if (!perCell.has(key)) perCell.set(key, { id: key, label: c ? c.label : '', page: pageNo, px: 0 })
            perCell.get(key).px++
          }
        }
      }
      fs.writeFileSync(`${outDir}/diff-${width}-p${pageNo}-${y}.png`, PNG.sync.write(diff))
    }
  }
  await pa.context().close()
  await pb.context().close()
  return { heightBaseline: totalH, heightCandidate: totalHB, mismatched, cells: [...perCell.values()] }
}

async function styleDiff(width, pageNo, withKeyframes) {
  const url = `${baseUrl}/compare.html?w=${width}&page=${pageNo}${withKeyframes ? '&keyframes=1' : ''}`
  for (let attempt = 1; ; attempt++) {
    const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
    const page = await context.newPage()
    try {
      await page.goto(url, { timeout: attempt === 1 ? 30000 : 120000 })
      await page.waitForFunction(() => window.__done === true, null, { timeout: 900000, polling: 500 })
      const result = await page.evaluate(() => window.__result)
      await context.close()
      return result
    } catch (error) {
      await context.close()
      if (attempt > 1) throw error
      console.warn(`  ! ${url} gagal (${error.message.split('\n')[0]}), mencoba ulang`)
    }
  }
}

/** Jalankan tugas dengan batas konkurensi, urutan hasil = urutan masukan. */
async function pool(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return results
}

const report = { generatedFor: WIDTHS, pages: PAGES, pageSize: manifest.pageSize, viewports: [] }
for (const w of WIDTHS) {
  const t0 = performance.now()
  const perPage = await pool(PAGES, CONCURRENCY, async (pageNo, i) => {
    const style = await styleDiff(w, pageNo, i === 0)
    const pixels = await pixelDiff(w, pageNo)
    return { page: pageNo, style, pixels }
  })

  const style = {
    cells: perPage.reduce((s, p) => s + p.style.cells, 0),
    props: perPage[0].style.props,
    diffs: perPage.flatMap((p) => p.style.diffs.map((d) => ({ ...d, page: p.page }))),
    structural: perPage.flatMap((p) => p.style.structural),
    keyframeDiffs: perPage.flatMap((p) => p.style.keyframeDiffs),
    keyframesChecked: perPage[0].style.keyframesChecked,
    unparsed: [...new Set(perPage.flatMap((p) => p.style.unparsed))]
  }
  const pixels = {
    mismatched: perPage.reduce((s, p) => s + p.pixels.mismatched, 0),
    heightMismatch: perPage.filter((p) => p.pixels.heightBaseline !== p.pixels.heightCandidate).map((p) => ({ page: p.page, baseline: p.pixels.heightBaseline, candidate: p.pixels.heightCandidate })),
    cells: perPage.flatMap((p) => p.pixels.cells).sort((a, b) => b.px - a.px)
  }
  report.viewports.push({ width: w, style, pixels, seconds: Math.round((performance.now() - t0) / 1000) })
  // Ditulis per viewport: sweep 11 lebar yang gagal di tengah jalan tetap meninggalkan hasil yang sudah diukur.
  fs.writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 1))

  const byProp = new Map()
  for (const d of style.diffs) byProp.set(d.prop, (byProp.get(d.prop) || 0) + 1)
  const cellsWithStyleDiff = new Set(style.diffs.map((d) => d.cell)).size
  console.log(`\n===== viewport ${w}px  (${report.viewports.at(-1).seconds} dtk, ${PAGES.length} halaman) =====`)
  console.log(`  sel diuji             : ${style.cells} · properti per elemen: ${style.props}`)
  console.log(`  selisih computed      : ${style.diffs.length} di ${cellsWithStyleDiff} sel`)
  console.log(`  sel dengan piksel beda: ${pixels.cells.length} · total piksel beda: ${pixels.mismatched}`)
  console.log(`  tinggi halaman beda   : ${pixels.heightMismatch.length} halaman`)
  console.log(`  @keyframes diperiksa  : ${style.keyframesChecked} · berbeda: ${style.keyframeDiffs.length}`)
  if (style.structural.length) console.log(`  ! STRUKTUR TIDAK SEJAJAR: ${style.structural.length}`)
  if (style.unparsed.length) console.log(`  ! token warna tak terurai: ${style.unparsed.slice(0, 5).join(' | ')}`)
  console.log('  properti paling sering berbeda:')
  for (const [p, n] of [...byProp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`    ${String(n).padStart(5)}  ${p}`)
}

await browser.close()
console.log(`\nlaporan lengkap: ${outDir}/report.json`)
