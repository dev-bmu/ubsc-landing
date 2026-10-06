'use client'

import { Check, Link as LinkIcon } from 'lucide-react'
import { useState } from 'react'

// Tombol "Salin tautan" di baris bagikan halaman artikel. Satu-satunya bagian halaman detail yang butuh klien.
export function CopyLinkButton({ url, className }: { url: string; className: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard ditolak (konteks tidak aman / izin): tidak ada yang bisa dilakukan selain diam.
    }
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? <Check size={16} aria-hidden /> : <LinkIcon size={16} aria-hidden />}
      <span aria-live="polite">{copied ? 'Tautan disalin' : 'Salin tautan'}</span>
    </button>
  )
}
