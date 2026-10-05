// Debug sekali pakai: rekam request & navigasi halaman kandidat mode --next.
import { chromium } from 'playwright-core'

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()
const t0 = Date.now()
page.on('request', (r) => console.log(`${Date.now() - t0}ms req ${r.method()} ${r.url()} ${JSON.stringify(r.headers()['rsc'] ?? '')}`))
page.on('requestfinished', (r) => console.log(`${Date.now() - t0}ms done ${r.url()}`))
page.on('requestfailed', (r) => console.log(`${Date.now() - t0}ms FAIL ${r.url()} ${r.failure()?.errorText}`))
page.on('framenavigated', (f) => console.log(`${Date.now() - t0}ms nav ${f.url()}`))
page.on('console', (m) => console.log(`${Date.now() - t0}ms console.${m.type()} ${m.text().slice(0, 300)}`))
page.on('pageerror', (e) => console.log(`${Date.now() - t0}ms pageerror ${e.message.slice(0, 300)}`))
await page.goto(process.argv[2], { waitUntil: 'load', timeout: 60000 })
console.log(`${Date.now() - t0}ms LOAD`)
await page.waitForTimeout(8000)
await browser.close()
