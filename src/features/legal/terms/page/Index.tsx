import { LegalShell } from '@/components/legal/LegalShell'
import { routes } from '@/config/routes'

// Port 1:1 dari resources/js/Pages/Legal/Terms.tsx. Statis penuh, tanpa data — Server Component.
export function LegalTermsPage() {
  return (
    <LegalShell title="Syarat & Ketentuan" updated="8 Juli 2026">
      <p>
        Selamat datang di layanan reservasi fasilitas olahraga UBSC (Universitas Brawijaya Sport Center), Jl. Veteran, Kota Malang, Jawa Timur. Dengan
        menggunakan situs ini dan melakukan reservasi, Anda menyetujui syarat dan ketentuan berikut.
      </p>

      <h2>1. Layanan</h2>
      <p>
        UBSC menyediakan reservasi lapangan dan fasilitas olahraga secara daring. Ketersediaan slot ditentukan oleh pengelola dan dapat berubah
        sewaktu-waktu.
      </p>

      <h2>2. Akun</h2>
      <p>
        Reservasi memerlukan akun terdaftar. Anda bertanggung jawab menjaga kerahasiaan akun dan atas seluruh aktivitas yang terjadi di dalamnya. Data
        yang Anda berikan harus benar dan terkini.
      </p>

      <h2>3. Reservasi & Pembayaran</h2>
      <ul>
        <li>Harga tampil dalam Rupiah (IDR) dan sudah final saat checkout.</li>
        <li>Pembayaran diproses melalui penyedia pembayaran resmi (Xendit). Reservasi dikonfirmasi setelah pembayaran berhasil diverifikasi.</li>
        <li>Slot yang belum dibayar dapat dilepas kembali setelah batas waktu pembayaran berakhir.</li>
      </ul>

      <h2>4. Pembatalan</h2>
      <p>
        Ketentuan pembatalan dan pengembalian dana diatur dalam <a href={routes.legalRefund()}>Kebijakan Pembatalan & Pengembalian Dana</a>.
      </p>

      <h2>5. Aturan Fasilitas</h2>
      <p>
        Pengguna wajib mematuhi jadwal, kapasitas, dan tata tertib fasilitas. Pengelola berhak menolak atau membatalkan reservasi yang melanggar
        aturan.
      </p>

      <h2>6. Batasan Tanggung Jawab</h2>
      <p>
        UBSC tidak bertanggung jawab atas cedera, kehilangan, atau kerusakan barang pribadi selama penggunaan fasilitas, sepanjang diizinkan oleh
        hukum yang berlaku.
      </p>

      <h2>7. Kontak</h2>
      <p>
        Pertanyaan terkait syarat ini dapat dikirim ke {/* eslint-disable-next-line no-restricted-syntax -- mailto:, bukan URL halaman */}
        <a href="mailto:info@ubsc.id">info@ubsc.id</a> atau WhatsApp admin pada jam operasional.
      </p>
    </LegalShell>
  )
}
