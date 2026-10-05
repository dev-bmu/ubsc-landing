import type { HTMLAttributes } from 'react'

/**
 * Satu-satunya primitif Breeze yang ikut di-port (Rewrite.md:470): AuthModal memakainya dan ia
 * bagian dari tampilan, bukan sekadar scaffolding. Sisanya sengaja dibuang.
 *
 * Port 1:1 dari resources/js/Components/InputError.tsx — termasuk concat string dengan spasi
 * di ujung (`'text-sm text-red-600 ' + className`), bukan cn(): tidak ada class yang bertabrakan
 * di sini, dan mengganti ke cn() berarti mengubah string yang sudah diukur gate.
 *
 * Server component: tidak ada state, efek, maupun handler.
 */
export function InputError({ message, className = '', ...props }: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
  return message ? (
    <p {...props} className={'text-sm text-red-600 ' + className}>
      {message}
    </p>
  ) : null
}
