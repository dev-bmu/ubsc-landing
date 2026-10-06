// Structured data schema.org. `<` di-escape supaya teks CMS (judul artikel, dsb.) tidak bisa menutup
// tag <script> lebih awal — JSON.stringify sendiri tidak meng-escape-nya.
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}
