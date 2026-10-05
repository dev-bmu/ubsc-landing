import { LegalShell } from '@/components/legal/LegalShell'

// Port 1:1 dari resources/js/Pages/Legal/Privacy.tsx. Statis penuh, tanpa data — Server Component.
export function LegalPrivacyPage() {
  return (
    <LegalShell title="Kebijakan Privasi" updated="8 Juli 2026">
      <p>
        Kebijakan ini menjelaskan bagaimana UBSC (Universitas Brawijaya Sport Center) mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat
        menggunakan layanan reservasi kami.
      </p>

      <h2>1. Data yang Kami Kumpulkan</h2>
      <ul>
        <li>Nama, alamat email, dan nomor telepon.</li>
        <li>Riwayat reservasi dan transaksi pembayaran.</li>
        <li>Data teknis dasar (alamat IP, jenis perangkat) untuk keamanan.</li>
      </ul>

      <h2>2. Penggunaan Data</h2>
      <ul>
        <li>Memproses dan mengonfirmasi reservasi serta pembayaran.</li>
        <li>Menghubungi Anda terkait status reservasi.</li>
        <li>Meningkatkan keamanan dan kualitas layanan.</li>
      </ul>

      <h2>3. Pembayaran</h2>
      <p>
        Pembayaran diproses oleh Xendit sebagai penyedia pembayaran berlisensi. Kami tidak menyimpan nomor kartu atau kredensial pembayaran Anda di
        server kami.
      </p>

      <h2>4. Berbagi Data</h2>
      <p>
        Kami tidak menjual data pribadi Anda. Data hanya dibagikan kepada penyedia layanan yang diperlukan untuk menjalankan reservasi (misalnya
        penyedia pembayaran) sesuai hukum yang berlaku.
      </p>

      <h2>5. Keamanan</h2>
      <p>
        Kami menerapkan langkah teknis dan organisasi yang wajar untuk melindungi data Anda, termasuk enkripsi kata sandi dan koneksi terenkripsi.
      </p>

      <h2>6. Hak Anda</h2>
      <p>
        Anda dapat meminta akses, koreksi, atau penghapusan data pribadi Anda dengan menghubungi{' '}
        {/* eslint-disable-next-line no-restricted-syntax -- mailto:, bukan URL halaman */}
        <a href="mailto:info@ubsc.id">info@ubsc.id</a>.
      </p>
    </LegalShell>
  )
}
