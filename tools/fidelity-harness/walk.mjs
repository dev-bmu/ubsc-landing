// Driver gate Fase 2: computed-style (diagnosis) + pixel diff (vonis), 3 viewport.
// Pemakaian: node walk.mjs <baseUrl> <outDir> [lebar,lebar,...]
import fs from 'node:fs'
import { chromium } from 'playwright-core'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const [, , baseUrl, outDir, widthsArg] = process.argv
const WIDTHS = (widthsArg || '390,768,1280').split(',').map(Number)
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const CHUNK = 3200
const FREEZE = '*,*::before,*::after{animation-play-state:paused!important;animation-delay:-0.7s!important;transition:none!important;caret-color:transparent!important}'

fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({ executablePath: EDGE, args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text'] })

async function openFrozen(url, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: 'load' })
  await page.addStyleTag({ content: FREEZE })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(150)
  return page
}

async function cellRects(page) {
  return page.$$eval('[data-cell]', (els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect()
      return { id: e.dataset.cell, label: e.title, x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) }
    })
  )
}

async function pixelDiff(width) {
  const pa = await openFrozen(`${baseUrl}/baseline.html`, width)
  const pb = await openFrozen(`${baseUrl}/candidate.html`, width)
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
    const [ba, bb] = await Promise.all([pa.screenshot({ clip, fullPage: true }), pb.screenshot({ clip, fullPage: true })])
    const ia = PNG.sync.read(ba), ib = PNG.sync.read(bb)
    const diff = new PNG({ width: ia.width, height: ia.height })
    const n = pixelmatch(ia.data, ib.data, diff.data, ia.width, ia.height, { threshold: 0.1, includeAA: true, diffColor: [255, 0, 0], alpha: 0 })
    mismatched += n
    if (n > 0) {
      for (let py = 0; py < diff.height; py++) {
        for (let px = 0; px < diff.width; px++) {
          const i = (py * diff.width + px) * 4
          if (diff.data[i] === 255 && diff.data[i + 1] === 0 && diff.data[i + 2] === 0) {
            const c = findCell(px, py + y)
            const key = c ? c.id : '(di luar sel)'
            if (!perCell.has(key)) perCell.set(key, { id: key, label: c ? c.label : '', px: 0 })
            perCell.get(key).px++
          }
        }
      }
      fs.writeFileSync(`${outDir}/diff-${width}-${y}.png`, PNG.sync.write(diff))
    }
  }
  await pa.close()
  await pb.close()
  return { heightBaseline: totalH, heightCandidate: totalHB, mismatched, cells: [...perCell.values()].sort((a, b) => b.px - a.px) }
}

async function styleDiff(width) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
  await page.goto(`${baseUrl}/compare.html?w=${width}`)
  await page.waitForFunction(() => window.__done === true, null, { timeout: 900000, polling: 500 })
  const result = await page.evaluate(() => window.__result)
  await page.close()
  return result
}

const report = { generatedFor: WIDTHS, viewports: [] }
for (const w of WIDTHS) {
  const t0 = performance.now()
  const style = await styleDiff(w)
  const pixels = await pixelDiff(w)
  report.viewports.push({ width: w, style, pixels, seconds: Math.round((performance.now() - t0) / 1000) })

  const byProp = new Map()
  for (const d of style.diffs) byProp.set(d.prop, (byProp.get(d.prop) || 0) + 1)
  const cellsWithStyleDiff = new Set(style.diffs.map((d) => d.cell)).size
  console.log(`\n===== viewport ${w}px  (${report.viewports.at(-1).seconds} dtk) =====`)
  console.log(`  sel diuji            : ${style.cells} · properti per elemen: ${style.props}`)
  console.log(`  selisih computed     : ${style.diffs.length} di ${cellsWithStyleDiff} sel`)
  console.log(`  sel dengan piksel beda: ${pixels.cells.length} · total piksel beda: ${pixels.mismatched}`)
  console.log(`  tinggi halaman       : baseline ${pixels.heightBaseline}px · kandidat ${pixels.heightCandidate}px`)
  console.log(`  @keyframes berbeda   : ${style.keyframeDiffs.length}`)
  if (style.structural.length) console.log(`  ! STRUKTUR TIDAK SEJAJAR: ${style.structural.length}`)
  if (style.unparsed.length) console.log(`  ! token warna tak terurai: ${style.unparsed.slice(0, 5).join(' | ')}`)
  console.log('  properti paling sering berbeda:')
  for (const [p, n] of [...byProp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`    ${String(n).padStart(5)}  ${p}`)
}

fs.writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 1))
await browser.close()
console.log(`\nlaporan lengkap: ${outDir}/report.json`)
