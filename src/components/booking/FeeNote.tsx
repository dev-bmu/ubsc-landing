import { rupiah } from '@/lib/calendar'
import type { BookingFacilityIndexDto } from '@/types/contracts/contracts'

export type BookingFees = Pick<BookingFacilityIndexDto, 'adminFee' | 'uniqueCodeMax'>

/**
 * Tambahan di atas harga, ditampilkan SEBELUM tombol bayar supaya nominal transfer di langkah
 * berikutnya tidak mengejutkan. Kode unik baru diketahui setelah checkout, jadi yang disebut di sini
 * hanya batas atasnya.
 */
export function FeeNote({ fees, className }: { fees: BookingFees; className?: string }) {
  return (
    <p className={className}>
      + {fees.adminFee > 0 ? `biaya admin ${rupiah(fees.adminFee)} + ` : ''}kode unik (maks. {rupiah(fees.uniqueCodeMax)}), sekali per transaksi
    </p>
  )
}
