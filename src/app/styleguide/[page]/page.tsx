// SEKALI PAKAI — dihasilkan tools/fidelity-harness/styleguide-route.mjs untuk gate Fase 2. JANGAN di-commit.
import fs from 'node:fs'
import path from 'node:path'

const CELLS = path.join(process.cwd(), 'src', 'app', 'styleguide', '[page]', '_cells')

export const dynamicParams = false

export function generateStaticParams() {
  return Array.from({ length: 28 }, (_, page) => ({ page: String(page) }))
}

export default async function StyleguidePage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  const helper = fs.readFileSync(path.join(CELLS, 'helper.css'), 'utf8')
  const cells = fs.readFileSync(path.join(CELLS, `${page}.html`), 'utf8')
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: helper }} />
      <main className="sg-grid" dangerouslySetInnerHTML={{ __html: cells }} />
    </>
  )
}
