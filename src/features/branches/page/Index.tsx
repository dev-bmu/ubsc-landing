import { BranchHero } from '@/components/branches/BranchHero'
import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'
import { BRANCHES, otherBranches } from '@/config/branches'
import { routes } from '@/config/routes'

// ===== /branches/[slug] — port 1:1 dari resources/js/Pages/Branches/Show.tsx =====
// Server Component. TIDAK ada fetch: data cabang statis di src/config/branches.ts (di Laravel
// di-hardcode dalam closure route). `usePage().props.branchItem / otherBranches` diganti lookup
// lokal dari `slug` yang dioper route shell; shell (src/app/branches/[slug]/page.tsx) sudah
// memanggil notFound() untuk slug asing + dynamicParams=false, jadi di sini slug pasti valid.
//
// <Head> Inertia DIHAPUS — title/description ada di generateMetadata route shell.
// Rename snake->camel mengikuti DTO: category_badge->categoryBadge, operating_hours->operatingHours,
// gmaps_embed_url->gmapsEmbedUrl, images_array->imagesArray.
// href literal -> builder routes.facilities() / routes.branches(slug).
export function BranchShowPage({ slug }: { slug: string }) {
  const branchItem = BRANCHES[slug]
  const others = otherBranches(slug)

  return (
    <>
      <main className="relative bg-white">
        <Navbar activeSection="About" />

        {/* ── MODULE 1: Hero Banner ── */}
        <BranchHero branch={branchItem} />

        {/* ── MODULE 2: Metadata Cards ── */}
        <div className="mx-auto mt-10 max-w-[1440px] px-6 sm:mt-12 xl:mt-14 xl:px-20">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:gap-6">
            {[
              {
                label: 'Address',
                value: branchItem.address
              },
              {
                label: 'Operating Hours',
                value: branchItem.operatingHours
              },
              {
                label: 'Contact',
                value: branchItem.contact
              }
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-black/5 bg-[#F7F7F7] p-5">
                <p className="font-bdo text-[10px] font-medium tracking-[0.14em] text-black/40 uppercase">{card.label}</p>
                <p className="mt-2 line-clamp-2 font-bdo text-sm leading-snug font-medium text-black sm:text-base sm:leading-6">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── MODULE 3: Content & Maps ── */}
        <div className="mx-auto mt-10 max-w-[1200px] px-6 sm:mt-12 xl:mt-14 xl:px-8">
          <div className="w-full rounded-3xl bg-[#F7F7F7] p-6 sm:p-12 xl:p-16">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <h3 className="mb-6 font-bdo text-lg font-semibold text-black sm:text-xl">Tentang Cabang Ini</h3>
                <div className="max-w-none space-y-6 font-bdo text-sm leading-relaxed font-normal text-gray-600 sm:text-base sm:leading-6">
                  {branchItem.description
                    .split('\n')
                    .filter(Boolean)
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>
              </div>
              <div className="lg:col-span-5">
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-200 shadow-inner lg:aspect-4/5">
                  {branchItem.gmapsEmbedUrl ? (
                    <iframe src={branchItem.gmapsEmbedUrl} className="h-full w-full border-0" allowFullScreen loading="lazy" title="Google Maps" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="font-bdo text-sm text-gray-400">Peta tidak tersedia</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MODULE 4: Other Branches ── */}
        {others.length > 0 && (
          <div className="mx-auto mt-16 max-w-[1440px] px-6 pb-24 sm:mt-20 xl:mt-24 xl:px-20">
            <div className="flex items-end justify-between">
              <h2 className="font-bdo text-[clamp(1.5rem,2.4vw,2.5rem)] font-semibold tracking-[-0.04em] text-black">Cabang Lainnya</h2>
              <a
                href={routes.facilities()}
                className="font-bdo text-xs font-semibold tracking-[0.12em] text-black/50 uppercase transition-colors hover:text-black sm:text-sm"
              >
                LIHAT SEMUA ↗
              </a>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:mt-12">
              {others.map((branch) => (
                <a key={branch.id} href={routes.branches(branch.slug)} className="group flex flex-col">
                  <div className="relative mb-4 aspect-16/11 w-full overflow-hidden rounded-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element -- foto cabang adalah aset statis di public/assets, bukan gambar CMS /uploads */}
                    <img
                      src={branch.image || '/assets/images/comingsoon.avif'}
                      alt={branch.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="line-clamp-2 font-bdo text-lg font-semibold text-black">{branch.title}</h3>
                  <p className="mt-1 line-clamp-2 font-bdo text-sm text-gray-500">{branch.address}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
