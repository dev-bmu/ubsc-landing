import { AboutSectionContact } from '@/components/about/AboutSectionContact'
import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { NewsHero, type NewsSlide } from '@/components/news/NewsHero'
import { ServicesSectionArtikel } from '@/components/news/ServicesSectionArtikel'
import { ServicesSectionNews } from '@/components/news/ServicesSectionNews'
import { getNews } from '@/services/server'
import type { NewsDto } from '@/types/contracts/contracts'

// ===== Komposisi halaman /news (Server Component) =====
// Padanan PublicNewsController@index + Pages/NewsPage.tsx Laravel. Pohon DOM-nya persis
// NewsPage.tsx:60-71, tanpa satu wrapper pun ditambah atau dikurangi:
//
//   <main class="relative">
//     <Navbar activeSection="News"/>
//     <NewsHero slides={...}/>
//     <div id="news-content"/>        <- id-nya memang kembar dengan <section id="news-content">
//     <ServicesSectionNews news={beritaItems}/>    milik ServicesSectionNews; itu apa adanya di
//     <ServicesSectionArtikel articles={artikelItems}/>  Laravel dan sengaja TIDAK "diperbaiki".
//     <AboutSectionContact sectionNumber="03" .../>
//   </main>
//   <Footer/>   (DI LUAR <main>)
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
    image: item.image || '/assets/images/comingsoon.avif'
  }))

  // Cast is safe — API only returns "Berita" or "Artikel" for category
  const beritaItems = news.filter((n) => n.category === 'Berita') as never[]
  const artikelItems = news.filter((n) => n.category === 'Artikel') as never[]

  return (
    <>
      <main className="relative">
        <Navbar activeSection="News" />
        <NewsHero slides={heroSlides.length > 0 ? heroSlides : undefined} />
        <div id="news-content" />
        <ServicesSectionNews news={beritaItems} />
        <ServicesSectionArtikel articles={artikelItems} />
        <AboutSectionContact sectionNumber="03" sectionTitle="Informasi" sectionSubtitle="03 news page" />
      </main>
      <Footer />
    </>
  )
}
