import { FadeIn } from '@/components/landing/FadeIn'
import { FlashToast } from '@/components/landing/FlashToast'
import { Footer } from '@/components/landing/Footer'
import { Hero } from '@/components/landing/Hero'
import { Navbar } from '@/components/landing/Navbar'
import { SectionEight } from '@/components/landing/SectionEight'
import { SectionFive } from '@/components/landing/SectionFive'
import { SectionFour } from '@/components/landing/SectionFour'
import { SectionSeven } from '@/components/landing/SectionSeven'
import { SectionSix } from '@/components/landing/SectionSix'
import { SectionThree } from '@/components/landing/SectionThree'
import { SectionTwo } from '@/components/landing/SectionTwo'
import { getHome } from '@/services/server'
import type { HomeDto } from '@/types/contracts/contracts'

// ===== Komposisi beranda (Server Component) =====
// Padanan HomeController@index + HomePage.tsx Laravel. Struktur wrapper mengikuti HomePage.tsx:132-170
// PERSIS (pohon DOM yang diukur gate fidelity):
//
//   <main class="landing-page-canvas relative">
//     <Navbar/>                                                  Batch C — Navbar DULU
//     <div class="home-hero-section-reveal">
//       <Hero/>                                                  Batch B
//       <div class="home-section-two-curtain"><SectionTwo/></div> Batch D (curtain 1)
//     </div>
//     <div class="home-post-section-two-flow">
//       <FadeIn lightweight><SectionThree/></FadeIn>             Batch E
//       <SectionFour/>  (TIDAK dibungkus FadeIn — curtain 2)     Batch E
//       <div class="home-post-section-four-flow">
//         <FadeIn><SectionFive..SectionEight/></FadeIn>          Batch F/G
//       </div>
//     </div>
//   </main>
//   <Footer/>  (DI LUAR <main>)                                  Batch G
//   <FlashToast/>                                                Batch G
//
// Data PUBLIK diambil server-side sekali; yang per-user (pending_payment) menyusul di Navbar lewat
// TanStack Query. Halaman HARUS tetap 200 walau ubsc-api mati — section fasilitas yang kosong disembunyikan.
export async function HomePage() {
  let home: HomeDto | null = null
  try {
    home = await getHome({ revalidate: 300, tags: ['home'] })
  } catch {
    home = null
  }

  return (
    <>
      <main className="landing-page-canvas relative">
        <Navbar activeSection="Home" announcements={home?.announcements} />
        <div className="home-hero-section-reveal">
          <Hero gymTraffic={home?.gymTraffic} />
          <div className="home-section-two-curtain">
            <SectionTwo membershipPlans={home?.membershipPlans} promos={home?.promos} sponsors={home?.sponsors} gymTraffic={home?.gymTraffic} />
          </div>
        </div>
        <div className="home-post-section-two-flow">
          <FadeIn lightweight>
            <SectionThree />
          </FadeIn>
          <SectionFour facilities={home?.facilities} />
          <div className="home-post-section-four-flow">
            <FadeIn>
              <SectionFive news={home?.news} reels={home?.reels} />
            </FadeIn>
            <FadeIn>
              <SectionSix facilities={home?.facilities} />
            </FadeIn>
            <FadeIn>
              <SectionSeven testimonials={home?.testimonials} reviews={home?.reviews} />
            </FadeIn>
            <FadeIn>
              <SectionEight />
            </FadeIn>
          </div>
        </div>
      </main>
      <Footer />
      <FlashToast />
    </>
  )
}
