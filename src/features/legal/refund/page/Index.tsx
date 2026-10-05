import { LegalShell } from '@/components/legal/LegalShell'

// Port 1:1 dari resources/js/Pages/Legal/Refund.tsx. Statis penuh, tanpa data — Server Component.
export function LegalRefundPage() {
  return (
    <LegalShell title="Kebijakan Pembatalan & Pengembalian Dana" updated="8 Juli 2026">
      <p>
        Kebijakan ini mengatur pembatalan reservasi dan pengembalian dana (refund) untuk layanan reservasi fasilitas UBSC (Universitas Brawijaya Sport
        Center).
      </p>

      <h2>1. Pembatalan oleh Pengguna</h2>
      <ul>
        <li>Pembatalan lebih dari 24 jam sebelum jadwal: dana dikembalikan 100% (dipotong biaya administrasi penyedia pembayaran, jika ada).</li>
        <li>Pembatalan kurang dari 24 jam sebelum jadwal: dana dikembalikan 50%.</li>
        <li>Tidak hadir tanpa pembatalan (no-show): tidak ada pengembalian dana.</li>
      </ul>

      <h2>2. Pembatalan oleh Pengelola</h2>
      <p>
        Apabila fasilitas tidak dapat digunakan karena alasan teknis, cuaca, atau pemeliharaan, Anda berhak atas pengembalian dana penuh atau
        penjadwalan ulang tanpa biaya tambahan.
      </p>

      <h2>3. Proses Pengembalian Dana</h2>
      <p>
        Permohonan refund diajukan melalui {/* eslint-disable-next-line no-restricted-syntax -- mailto:, bukan URL halaman */}
        <a href="mailto:info@ubsc.id">info@ubsc.id</a> dengan menyertakan nomor reservasi. Dana dikembalikan ke metode pembayaran asal dalam 7–14 hari
        kerja setelah disetujui.
      </p>

      <h2>4. Kontak</h2>
      <p>
        Untuk pertanyaan terkait pembatalan atau refund, hubungi tim kami di{' '}
        {/* eslint-disable-next-line no-restricted-syntax -- mailto:, bukan URL halaman */}
        <a href="mailto:info@ubsc.id">info@ubsc.id</a>.
      </p>
    </LegalShell>
  )
}
