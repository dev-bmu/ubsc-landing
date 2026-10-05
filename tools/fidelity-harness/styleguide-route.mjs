// Gate resmi Fase 2 (Rewrite.md): route /styleguide SEKALI PAKAI di ubsc-landing yang merender seluruh sel harness
// lewat build produksi Next — globals.css asli, @tailwindcss/postcss, minifier CSS Next — untuk di-screenshot-diff
// lawan Laravel. Harness lain mengompilasi kandidat dengan Tailwind CLI; gate ini membuktikan jalur build yang
// sungguh dikirim menghasilkan render yang sama.
//
// Route dan datanya TIDAK PERNAH di-commit: pasang, build, ukur, lalu cabut.
//
// Pemakaian:
//   node styleguide-route.mjs install <gen/out> <root ubsc-landing>
//   node styleguide-route.mjs remove <root ubsc-landing>
import fs from 'node:fs'
import path from 'node:path'

const [, , command, ...rest] = process.argv

function routeDir(landingRoot) {
  return path.join(landingRoot, 'src', 'app', 'styleguide')
}

if (command === 'remove') {
  const dir = routeDir(rest[0])
  fs.rmSync(dir, { recursive: true, force: true })
  console.log(`route /styleguide dicabut: ${dir}`)
  process.exit(0)
}

if (command !== 'install') {
  console.error('pemakaian: node styleguide-route.mjs install <gen/out> <root ubsc-landing> | remove <root ubsc-landing>')
  process.exit(2)
}

const [outDir, landingRoot] = rest
const { pages } = JSON.parse(fs.readFileSync(path.join(outDir, 'pages.json'), 'utf8'))
const dir = routeDir(landingRoot)
const cellsDir = path.join(dir, '[page]', '_cells')
fs.rmSync(dir, { recursive: true, force: true })
fs.mkdirSync(cellsDir, { recursive: true })

let helper = null
for (const { page } of pages) {
  const html = fs.readFileSync(path.join(outDir, `candidate-${page}.html`), 'utf8')
  const style = html.match(/<style>([\s\S]*?)<\/style>/)
  const main = html.match(/<main class="sg-grid">\n?([\s\S]*?)\n?<\/main>/)
  if (!style || !main) throw new Error(`candidate-${page}.html tidak berbentuk halaman harness`)
  helper ??= style[1]
  fs.writeFileSync(path.join(cellsDir, `${page}.html`), main[1])
}
fs.writeFileSync(path.join(cellsDir, 'helper.css'), helper)
// Daftar class mentah supaya deteksi sumber otomatis Tailwind v4 menemukan class sel — atribut HTML meng-escape &.
fs.copyFileSync(path.join(outDir, 'candidate-source.txt'), path.join(cellsDir, 'classes.txt'))

fs.writeFileSync(
  path.join(dir, '[page]', 'page.tsx'),
  `// SEKALI PAKAI — dihasilkan tools/fidelity-harness/styleguide-route.mjs untuk gate Fase 2. JANGAN di-commit.
import fs from 'node:fs'
import path from 'node:path'

const CELLS = path.join(process.cwd(), 'src', 'app', 'styleguide', '[page]', '_cells')

export const dynamicParams = false

export function generateStaticParams() {
  return Array.from({ length: ${pages.length} }, (_, page) => ({ page: String(page) }))
}

export default async function StyleguidePage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  const helper = fs.readFileSync(path.join(CELLS, 'helper.css'), 'utf8')
  const cells = fs.readFileSync(path.join(CELLS, \`\${page}.html\`), 'utf8')
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: helper }} />
      <main className="sg-grid" dangerouslySetInnerHTML={{ __html: cells }} />
    </>
  )
}
`
)
console.log(`route /styleguide/[0..${pages.length - 1}] dipasang di ${dir}`)
