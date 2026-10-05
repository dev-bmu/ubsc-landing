// Potret satu sel di halaman baseline & kandidat (diperbesar) untuk diperiksa mata.
// node crop-cell.mjs <baseUrl> <page> <cellId> <width> <outPrefix>
import { chromium } from 'playwright-core'

const [, , baseUrl, pageNo, cellId, width, outPrefix] = process.argv
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text'] })
for (const side of ['baseline', 'candidate']) {
  const ctx = await browser.newContext({ viewport: { width: Number(width), height: 900 }, deviceScaleFactor: 4 })
  const page = await ctx.newPage()
  await page.goto(`${baseUrl}/${side}-${pageNo}.html`)
  await page.evaluate(() => document.fonts.ready)
  const el = page.locator(`[data-cell="${cellId}"]`)
  await el.scrollIntoViewIfNeeded()
  await el.screenshot({ path: `${outPrefix}-${side}.png` })
  const info = await el.evaluate((cell) => {
    const probe = cell.querySelector('[data-probe]')
    const btn = getComputedStyle(probe, '::file-selector-button')
    const pick = (cs, props) => Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]))
    const props = ['color', 'background-color', 'border-top-width', 'border-top-style', 'border-top-color', 'border-radius', 'padding-left', 'padding-top', 'margin-right', 'margin-inline-end', 'font-size', 'font-family', 'font-weight', 'line-height', 'letter-spacing', 'appearance', 'opacity', 'height', 'width']
    return { input: pick(getComputedStyle(probe), props), button: pick(btn, props), html: cell.innerHTML.slice(0, 200) }
  })
  console.log(side, JSON.stringify(info, null, 1))
  await ctx.close()
}
await browser.close()
