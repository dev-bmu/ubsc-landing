import { AboutSectionContact } from '@/components/about/AboutSectionContact'
import { BookingFacilitiesSection } from '@/components/booking/BookingFacilitiesSection'
import { BookingHero } from '@/components/booking/BookingHero'
import { BookingReviewSection } from '@/components/booking/BookingReviewSection'
import type { BookingFees } from '@/components/booking/FeeNote'
import { BookingSection } from '@/components/booking/BookingSection'
import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { getApprovedReviews, getBookingFacilities } from '@/services/server'
import type { ApprovedReviewDto, BookingFacilityDto } from '@/types/contracts/contracts'

// ===== Komposisi /booking (Server Component) =====
// Padanan Pages/BookingPage.tsx Laravel. Urutan wrapper mengikuti sumber (BookingPage.tsx:57-67)
// PERSIS:
//
//   <main class="relative">
//     <Navbar activeSection="Booking"/>
//     <BookingHero/>
//     <BookingSection facilities/>
//     <BookingFacilitiesSection/>
//     <BookingReviewSection/>
//     <AboutSectionContact/>
//   </main>
//   <Footer/>   (DI LUAR <main>, sama seperti sumber)
//
// <Head> Inertia dihapus: metadata sudah ada di route shell src/app/booking/page.tsx, yang juga
// memegang `revalidate = 600`. <FlashToast/> SENGAJA tidak ditambahkan — BookingPage Laravel tidak
// punya padanannya (beranda punya, halaman ini tidak).
//
// ===== Pemisahan data (inti addendum Fase 6) =====
// PUBLIK, di sini (RSC): getBookingFacilities() + getApprovedReviews(). Keduanya melempar bila API
// gagal, jadi masing-masing dibungkus try/catch tersendiri dan jatuh ke array kosong — halaman tetap
// 200 walau ubsc-api mati, persis pola src/features/home/page/Index.tsx. Dipisah dua try agar satu
// endpoint yang mati tidak ikut mengosongkan yang lain.
//
// PER-USER, BUKAN di sini: `can_review` dan `existing_review` (Inertia mengirimnya bersama halaman)
// diambil BookingReviewSection lewat TanStack Query ke GET /api/customer/reviews/eligibility dengan
// enabled:!!user; seluruh alur pilih slot, POST booking, dan status pembayaran hidup di client leaf
// BookingSection/BookingListItem/ClassMonthPicker. Tidak ada satu pun permintaan ber-cookie yang
// dikirim dari sini, dan tidak ada useSearchParams() di seluruh subtree — dua hal itulah yang
// menjaga /booking tetap ISR 600s.
//
// Prop `facilities` Laravel adalah BackendFacility[] snake_case; di sini BookingFacilityDto[]
// (camelCase, id uuid string) dan renamenya dikerjakan BookingSection.
export async function BookingPage() {
  let facilities: BookingFacilityDto[] = []
  // Tanpa fasilitas tidak ada yang bisa dipesan, jadi nilai cadangan biaya tidak pernah tampil.
  let fees: BookingFees = { adminFee: 0, uniqueCodeMax: 0 }
  let approvedReviews: ApprovedReviewDto[] = []

  try {
    const index = await getBookingFacilities()
    facilities = index.facilities
    fees = { adminFee: index.adminFee, uniqueCodeMax: index.uniqueCodeMax }
  } catch {
    facilities = []
  }

  try {
    approvedReviews = (await getApprovedReviews()).reviews
  } catch {
    approvedReviews = []
  }

  return (
    <>
      <main className="relative">
        <Navbar activeSection="Booking" />
        <BookingHero />
        <BookingSection facilities={facilities} fees={fees} />
        <BookingFacilitiesSection facilities={facilities} />
        <BookingReviewSection approvedReviews={approvedReviews} />
        <AboutSectionContact />
      </main>
      <Footer />
    </>
  )
}
