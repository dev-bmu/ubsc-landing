/**
 * Buka dokumen HTML siap cetak (invoice/kuitansi dari API) di tab baru; tombol "Cetak / Simpan PDF" ada
 * di dalamnya. Tab dibuka SINKRON di handler klik — browser memblokir window.open setelah await — lalu
 * diisi begitu HTML-nya datang. false = popup diblokir atau gagal memuat.
 */
export async function openPrintable(load: () => Promise<string>): Promise<boolean> {
  const tab = window.open('', '_blank')
  if (!tab) return false
  tab.document.write('<p style="font-family:sans-serif;padding:24px;color:#5b6472">Memuat invoice…</p>')
  try {
    const html = await load()
    tab.document.open()
    tab.document.write(html)
    tab.document.close()
    return true
  } catch {
    tab.close()
    return false
  }
}
