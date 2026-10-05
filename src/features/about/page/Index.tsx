import { AboutBranches } from '@/components/about/AboutBranches'
import { AboutHero } from '@/components/about/AboutHero'
import { AboutHistory } from '@/components/about/AboutHistory'
import { AboutSectionContact } from '@/components/about/AboutSectionContact'
import { AboutSectionFaq } from '@/components/about/AboutSectionFaq'
import { AboutSectionMap } from '@/components/about/AboutSectionMap'
import { AboutServices } from '@/components/about/AboutServices'
import { AboutVisionMission } from '@/components/about/AboutVisionMission'
import { FadeIn } from '@/components/landing/FadeIn'
import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { SectionSeven } from '@/components/landing/SectionSeven'

// ===== Komposisi /about (Server Component) =====
// Padanan Pages/AboutPage.tsx Laravel. Halaman ini TIDAK mengambil data sama sekali
// (Inertia::render('AboutPage') tanpa prop), jadi tidak ada fetch, tidak ada try/catch fallback,
// dan tidak ada hook — murni RSC. Yang interaktif hanya daun-daunnya (AboutHero, AboutHistory,
// AccordionItem, FaqItem, Navbar, FadeIn, SectionSeven) yang membawa 'use client' sendiri.
//
// Urutan wrapper mengikuti AboutPage.tsx PERSIS:
//
//   <main class="relative">
//     <Navbar activeSection="About"/>
//     <AboutHero/>
//     <FadeIn><AboutHistory/></FadeIn>
//     <AboutBranches/>                      (pembungkusnya FadeIn lightweight ada DI DALAM komponen)
//     <FadeIn><AboutServices/></FadeIn>
//     <FadeIn><AboutVisionMission/></FadeIn>
//     <FadeIn><AboutSectionFaq/></FadeIn>
//     <FadeIn><SectionSeven/></FadeIn>
//     <FadeIn><AboutSectionContact/></FadeIn>
//     <AboutSectionMap/>                    (TIDAK dibungkus FadeIn)
//   </main>
//   <Footer/>                               (DI LUAR <main>)
//
// <Head> Inertia dihapus: metadata /about sudah ada di route shell src/app/about/page.tsx.
// SectionSeven dipanggil tanpa prop, sama seperti Laravel — komponennya jatuh ke DUMMY_TESTIMONIALS.
// Tidak ada <FlashToast/> di sini karena AboutPage Laravel pun tidak punya.
export function AboutPage() {
  return (
    <>
      <main className="relative">
        <Navbar activeSection="About" />
        <AboutHero />
        <FadeIn>
          <AboutHistory />
        </FadeIn>
        <AboutBranches />
        <FadeIn>
          <AboutServices />
        </FadeIn>
        <FadeIn>
          <AboutVisionMission />
        </FadeIn>
        <FadeIn>
          <AboutSectionFaq />
        </FadeIn>
        <FadeIn>
          <SectionSeven />
        </FadeIn>
        <FadeIn>
          <AboutSectionContact />
        </FadeIn>
        <AboutSectionMap />
      </main>
      <Footer />
    </>
  )
}
