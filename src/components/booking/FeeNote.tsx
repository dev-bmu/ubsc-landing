import { rupiah } from '@/lib/calendar'
import type { BookingFacilityIndexDto } from '@/types/contracts/contracts'

export type BookingFees = Pick<BookingFacilityIndexDto, 'uniqueCodeMin' | 'uniqueCodeMax'>

/**
 * Tambahan di atas harga, ditampilkan SEBELUM tombol bayar supaya nominal transfer di langkah
 * berikutnya tidak mengejutkan. Tanpa biaya admin (revisi client 2026-10-08); kode unik baru diketahui
 * setelah checkout, jadi yang disebut di sini hanya rentangnya.
 */
export function FeeNote({ fees, className }: { fees: BookingFees; className?: string }) {
  return (
    <p className={className}>
      + kode unik {rupiah(fees.uniqueCodeMin)}–{rupiah(fees.uniqueCodeMax)}, sekali per transaksi
    </p>
  )
}
