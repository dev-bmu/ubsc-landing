import { AboutSectionContact } from '@/components/about/AboutSectionContact'
import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { NewsHero, type NewsSlide } from '@/components/news/NewsHero'
import { ServicesSectionArtikel } from '@/components/news/ServicesSectionArtikel'
import { ServicesSectionNews } from '@/components/news/ServicesSectionNews'
import { routes } from '@/config/routes'
import { getNews } from '@/services/server'
import type { NewsDto } from '@/types/contracts/contracts'

// ===== Komposisi halaman /news (Server Component) =====
// Padanan PublicNewsController@index + Pages/NewsPage.tsx Laravel (NewsPage.tsx:60-71):
//
//   <main class="relative">
//     <Navbar activeSection="News"/>
//     <NewsHero slides={...}/>
//     <ServicesSectionNews news={beritaItems}/>    <- <section id="news-content">, target HeroBottomBar
//     <ServicesSectionArtikel articles={artikelItems}/>
//     <AboutSectionContact sectionNumber="03" .../>
//   </main>
//   <Footer/>   (DI LUAR <main>)
//
// <div id="news-content"/> warisan Laravel DIHAPUS: id-nya kembar dengan section di bawahnya, dan
// getElementById tetap mendarat di posisi yang sama (section itu persis setelahnya).
//
// Catatan port:
//   - <Head> Inertia DIHAPUS — metadata sudah ada di src/app/news/page.tsx.
//   - `usePage().props.news` -> getNews() di server: SELURUH berita terbit, bukan 7 teratas milik
//     beranda (HomeDto.news). Payload Laravel juga tidak punya `categories` di halaman ini.
//   - `as never[]` dipertahankan verbatim dari Laravel (NewsPage.tsx:38-39): NewsDto.description
//     adalah `string | null` sedangkan prop kedua section menuntut `description: string`, dan
//     Laravel menutupnya dengan cast yang sama. NewsCard sendiri menerima `string | null | undefined`,
//     jadi cast ini murni urusan tipe dan tidak mengubah apa pun saat render.
//   - Halaman HARUS tetap 200 walau ubsc-api mati: getNews() melempar, ditangkap, dan daftarnya jatuh
//     ke [] sehingga NewsHero/ServicesSectionNews/ServicesSectionArtikel memakai fallback statis
//     masing-masing (DUMMY_NEWS_SLIDES, DUMMY_NEWS, DUMMY_ARTIKEL). Pola sama dengan features/home.
export async function NewsPage() {
  let news: NewsDto[] = []
  try {
    news = await getNews()
  } catch {
    news = []
  }

  const heroSlides: NewsSlide[] = news.slice(0, 3).map((item) => ({
    id: item.id,
    badge: item.category,
    title: item.title,
    description: item.description ?? '',
    date: item.date,
    image: item.image || '/assets/images/comingsoon.avif',
    href: routes.newsArticle(item)
  }))

  // Dipilah menurut section dari API (slug kategori), bukan nama kategori — kategori selain
  // Berita/Artikel ikut ke section 'berita', sama dengan URL-nya (/berita/<slug>).
  const beritaItems = news.filter((n) => n.section === 'berita') as never[]
  const artikelItems = news.filter((n) => n.section === 'artikel') as never[]

  return (
    <>
      <main className="relative">
        <Navbar activeSection="News" />
        <NewsHero slides={heroSlides.length > 0 ? heroSlides : undefined} />
        <ServicesSectionNews news={beritaItems} />
        <ServicesSectionArtikel articles={artikelItems} />
        <AboutSectionContact sectionNumber="03" sectionTitle="Informasi" sectionSubtitle="03 news page" />
      </main>
      <Footer />
    </>
  )
}
