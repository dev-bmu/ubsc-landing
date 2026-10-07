import { AboutSectionContact } from '@/components/about/AboutSectionContact'
import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { PricingAccordionSection } from '@/components/pricing/PricingAccordionSection'
import { PricingClassSection } from '@/components/pricing/PricingClassSection'
import { PricingFacilityList } from '@/components/pricing/PricingFacilityList'
import { PricingHero } from '@/components/pricing/PricingHero'
import { PricingInfo } from '@/components/pricing/PricingInfo'
import { MEMBERSHIP_ENABLED } from '@/config/features'
import { getFacilities, getMembershipPlans } from '@/services/server'
import type { FacilityDto, MembershipPlanDto } from '@/types/contracts/contracts'

// ===== Komposisi halaman /pricing (Server Component) =====
// Padanan PricingPage.tsx Laravel (resources/js/Pages/PricingPage.tsx:27-69). Pohon DOM-nya dibawa
// PERSIS, termasuk <main className="relative"> (BUKAN 'landing-page-canvas relative' milik beranda)
// dan <Footer/> yang berada DI LUAR <main>:
//
//   <main class="relative">
//     <Navbar activeSection="Pricing"/>
//     <PricingHero/>
//     <PricingInfo membershipPlans/>
//     <PricingFacilityList facilities/>
//     <PricingClassSection facilities/>
//     <PricingAccordionSection facilities/>
//     <AboutSectionContact sectionNumber="05" .../>
//   </main>
//   <Footer/>
//
// <Head> Inertia DIHAPUS — metadata sudah dideklarasikan di route shell src/app/pricing/page.tsx.
// FlashToast TIDAK dirender di sini karena PricingPage Laravel pun tidak merendernya (itu khusus beranda).
//
// Data: dua koleksi publik diambil server-side sekali, PARALEL. Keduanya melempar bila ubsc-api mati,
// jadi dipakai Promise.allSettled supaya kegagalan salah satu tidak menjatuhkan yang lain dan halaman
// tetap 200: PricingInfo jatuh ke FALLBACK_MEMBERSHIP_PLANS dan PricingAccordionSection disembunyikan
// (tanpa daftar contoh statis sejak 2026-09-28). PricingFacilityList dan PricingClassSection memang merender daftar kosong bila
// facilities kosong — persis perilaku Laravel dengan prop default `facilities = []`.
export async function PricingPage() {
  let membershipPlans: MembershipPlanDto[] | undefined
  let facilities: FacilityDto[] | undefined

  const [plansResult, facilitiesResult] = await Promise.allSettled([getMembershipPlans(), getFacilities()])
  if (plansResult.status === 'fulfilled') membershipPlans = plansResult.value
  if (facilitiesResult.status === 'fulfilled') facilities = facilitiesResult.value

  return (
    <>
      <main className="relative">
        <Navbar activeSection="Pricing" />
        <PricingHero />
        {MEMBERSHIP_ENABLED && <PricingInfo membershipPlans={membershipPlans} />}
        <PricingFacilityList facilities={facilities} />
        <PricingClassSection facilities={facilities} />
        <PricingAccordionSection facilities={facilities} />
        <AboutSectionContact sectionNumber="05" sectionTitle="Informasi" sectionSubtitle="05 pricing page" />
      </main>
      <Footer />
    </>
  )
}
