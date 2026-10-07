// ===== Saklar fitur (build-time) =====
// NEXT_PUBLIC_* di-inline saat `next build`: mengubah nilainya butuh rebuild + restart, bukan restart saja.

/** Penjualan membership di landing. Mati hanya bila NEXT_PUBLIC_MEMBERSHIP_ENABLED tepat 'false'. */
export const MEMBERSHIP_ENABLED = process.env.NEXT_PUBLIC_MEMBERSHIP_ENABLED !== 'false'
