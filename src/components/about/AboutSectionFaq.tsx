import { SectionDivider } from '@/components/landing/SectionDivider'
import { FaqItem } from '@/components/about/FaqItem'

interface FaqItemData {
  id: number
  number: string
  question: string
  answer: string
}

const DUMMY_FAQS: FaqItemData[] = [
  {
    id: 1,
    number: '01',
    question: 'Siapa saja yang dapat menggunakan fasilitas UB Sport Center?',
    answer:
      'UB Sport Center dapat digunakan oleh sivitas akademika Universitas Brawijaya maupun masyarakat umum. Setiap pengguna wajib mengikuti ketentuan penggunaan fasilitas serta melakukan pemesanan sesuai prosedur yang telah ditetapkan.'
  },
  {
    id: 2,
    number: '02',
    question: 'Bagaimana cara melakukan pemesanan fasilitas?',
    answer:
      'Pemesanan fasilitas dilakukan melalui website resmi UB Sport Center dengan memilih jenis fasilitas, jadwal penggunaan, dan durasi pemakaian. Setelah melakukan pemesanan, pengguna diwajibkan menyelesaikan proses pembayaran agar reservasi dapat dikonfirmasi.'
  },
  {
    id: 3,
    number: '03',
    question: 'Apakah pemesanan harus dilakukan terlebih dahulu?',
    answer:
      'Ya, pemesanan harus dilakukan terlebih dahulu melalui sistem untuk memastikan ketersediaan fasilitas, mengatur jadwal penggunaan secara tertib, serta menghindari terjadinya benturan jadwal antar pengguna.'
  },
  {
    id: 4,
    number: '04',
    question: 'Metode pembayaran apa saja yang tersedia?',
    answer: 'Kami menerima berbagai metode pembayaran termasuk tunai, transfer bank, dan pembayaran digital (QRIS, e-wallet).'
  },
  {
    id: 5,
    number: '05',
    question: 'Apakah jadwal penggunaan dapat diubah atau dibatalkan?',
    answer:
      'Perubahan atau pembatalan jadwal penggunaan dapat dilakukan sesuai dengan kebijakan yang berlaku. Ketentuan terkait batas waktu, syarat, dan kemungkinan pengembalian dana dapat dilihat pada halaman syarat dan ketentuan.'
  },
  {
    id: 6,
    number: '06',
    question: 'Apakah UB Sport Center melayani kegiatan atau event?',
    answer:
      'UB Sport Center melayani penggunaan fasilitas untuk kegiatan olahraga, pelatihan, kompetisi, maupun event tertentu, baik dari lingkungan Universitas Brawijaya maupun pihak eksternal, dengan pengajuan dan persetujuan sesuai prosedur yang berlaku.'
  }
]

/**
 * Port dari resources/js/Components/About/AboutSectionFaq.tsx.
 *
 * Server Component: tidak ada hook/handler; interaktivitasnya ada di FaqItem (client leaf).
 *
 * classPairs: tidak ada (spec-AboutSectionFaq.json kosong).
 */
export function AboutSectionFaq() {
  return (
    <section className="w-full bg-white" id="about-faq">
      <div className="max-w mx-auto px-6 py-8 sm:px-10 sm:py-12 lg:px-16 lg:py-16 xl:px-24 xl:py-24">
        <SectionDivider number="05" title="General FAQs" subtitle="02 aboutpage" theme="light" />

        <div className="mt-10 grid grid-cols-1 gap-12 xl:grid-cols-12 xl:items-start xl:gap-8">
          <div className="xl:sticky xl:top-24 xl:col-span-4">
            <h2 className="font-bdo text-[clamp(2rem,2.7vw,52px)] leading-[1.1] font-medium tracking-[-0.017em] text-black">General FAQs</h2>
            <p className="mt-6 font-bdo text-[clamp(1.25rem,1.24vw,20px)] leading-relaxed font-normal text-black/50">
              UB Sport Center berkomitmen untuk menghadirkan lingkungan yang profesional dan nyaman melalui.
            </p>
          </div>

          <div className="flex flex-col border-t border-black/10 xl:col-span-8">
            {DUMMY_FAQS.map((faq) => (
              <FaqItem key={faq.id} number={faq.number} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
