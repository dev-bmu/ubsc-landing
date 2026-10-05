'use client'

import gambar1 from '@/assets/icons/testimonial-ub-sport-center.avif'
import author1 from '@/assets/icons/ulasan-malang-tennis-academy-ubsc.avif'
import { SectionDivider } from '@/components/landing/SectionDivider'
import { useEmblaNav } from '@/hooks/useEmblaNav'
import type { ReviewDto, TestimonialDto } from '@/types/contracts/contracts'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface PublicTestimonial {
  id: string
  image: string | null
  quote: string
  authorName: string
  authorRole: string
  authorLogo: string | null
}

export interface PublicReview {
  id: number
  reviewer_name: string
  rating: number
  text: string
}

const DUMMY_TESTIMONIALS: PublicTestimonial[] = [
  {
    id: '1',
    image: gambar1.src,
    quote:
      '                 “Malang Tenis Academy mengapresiasi kualitas fasilitas lapangan tenis di UB Sport Center yang terjaga baik dan memenuhi standar latihan serta pembinaan atlet profesional.',
    authorName: 'Malang Tennis Academy',
    authorRole: 'Footbal Club',
    authorLogo: author1.src
  },
  {
    id: '2',
    image: gambar1.src,
    quote: 'UB Sport Center menyediakan fasilitas olahraga yang lengkap dan berkualitas.',
    authorName: 'Atlet UB',
    authorRole: 'Atlet',
    authorLogo: author1.src
  }
]

const FIXED_STATS = [
  { value: '122+', label: 'Jumlah Ulasan', sublabel: 'Pelayanan Terpercaya' },
  { value: '99%', label: 'Tingkat Kepuasan', sublabel: 'Kualitas Terjamin' }
]

// Rantai fallback berkas statis per author_name (port Testimonial::imageUrl() Laravel, Testimonial.php:44-59):
// media -> aset statis -> null. Path public (aset sudah ada di public/assets/icons). authorLogo TIDAK punya fallback.
const TESTIMONIAL_IMAGE_FALLBACK: Record<string, string> = {
  'ub football club': '/assets/icons/testimonial-ub-sport-center.avif',
  'malang tennis academy': '/assets/icons/ulasan-malang-tennis-academy-ubsc.avif',
  'brawijaya badminton club': '/assets/icons/testimonial-ub-sport-center.avif'
}

interface SectionSevenProps {
  testimonials?: TestimonialDto[]
  reviews?: ReviewDto[]
  sectionNumber?: string
  sectionTitle?: string
  sectionSubtitle?: string
}

export function SectionSeven({
  testimonials = DUMMY_TESTIMONIALS,
  sectionNumber = '07',
  sectionTitle = 'Testimoni',
  sectionSubtitle = '01 homepage'
}: SectionSevenProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

  // Track active slide for the author pill (outside Embla)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    onSelect() // sync on mount
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  const { scrollPrev, scrollNext } = useEmblaNav(emblaApi)

  const activeItem = testimonials[activeIndex % testimonials.length]

  return (
    <section id="testimonials" className="w-full bg-white px-6 pt-12 pb-12 sm:px-10 lg:px-20">
      <div className="mx-auto">
        <SectionDivider number={sectionNumber} title={sectionTitle} subtitle={sectionSubtitle} theme="light" />
      </div>

      <div className="mt-10 mb-8 flex items-center gap-4 lg:relative lg:z-20 lg:mb-[-1.8rem]">
        <span className="section-label-diamond" />
        <span className="font-bdo text-[clamp(1.16rem,1.32vw,1.45rem)] font-medium tracking-tight text-gray-900 lg:text-[1.25rem]">
          Apa Kata Mereka?
        </span>
      </div>

      <div className="block lg:hidden">
        <div className="mb-6 flex flex-row items-center gap-6">
          <div className="h-40 w-28 shrink-0 overflow-hidden rounded-[5px] bg-gray-200 md:h-52 md:w-36">
            {/* eslint-disable-next-line @next/next/no-img-element -- foto testimoni dari media API (TestimonialDto.image) atau aset /assets fallback; carousel butuh elemen polos */}
            <img
              src={activeItem.image ?? TESTIMONIAL_IMAGE_FALLBACK[activeItem.authorName?.toLowerCase()] ?? undefined}
              alt={activeItem.authorName}
              className="h-full w-full object-cover"
              draggable={false}
              loading="lazy"
            />
          </div>
          <div className="flex flex-row gap-5">
            {FIXED_STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-start">
                <span className="font-regular text-left font-bdo text-2xl tracking-tight text-gray-900 md:text-3xl">{stat.value}</span>
                <span className="mt-1 text-left font-bdo text-xs font-semibold text-gray-800">{stat.label}</span>
                <span className="font-regular text-left font-bdo text-[10px] text-gray-500">{stat.sublabel}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Nav buttons */}
        <div className="mb-6 flex justify-start gap-3">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous testimonial"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-900 text-gray-900 transition-colors duration-200 hover:bg-gray-200"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next testimonial"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white transition-colors duration-200 hover:bg-gray-700"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <blockquote className="mb-8">
          <p className="section-two-headline-weight indent-8 font-bdo text-[clamp(2.05rem,8.15vw,2.82rem)] leading-[1.01] font-medium tracking-[-0.058em] text-gray-900 sm:indent-16 md:text-[clamp(2.08rem,4.5vw,2.6rem)]">
            &ldquo;{activeItem.quote}&rdquo;
          </p>
        </blockquote>
        <div className="inline-flex items-center gap-4 rounded-2xl bg-white px-4 py-3 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
            {activeItem.authorLogo ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo author dari media API (TestimonialDto.authorLogo); butuh elemen img polos
              <img src={activeItem.authorLogo} alt={activeItem.authorName} className="h-full object-contain" />
            ) : (
              <span className="text-sm font-bold text-gray-400 lg:text-xl">{activeItem.authorName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-clash text-xs leading-tight font-medium text-gray-900 lg:text-base lg:leading-6">{activeItem.authorName}</span>
            <span className="font-regular mt-0.5 font-clash text-xs text-gray-500">{activeItem.authorRole}</span>
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {testimonials.map((item) => (
              <div key={item.id} className="min-w-0 flex-[0_0_100%]">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
                  <div className="pt-16 lg:col-span-4">
                    <div className="aspect-5/6 w-2/3 overflow-hidden rounded-[5px] bg-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element -- foto testimoni dari media API (TestimonialDto.image) atau aset /assets fallback; carousel butuh elemen polos */}
                      <img
                        src={item.image ?? TESTIMONIAL_IMAGE_FALLBACK[item.authorName?.toLowerCase()] ?? undefined}
                        alt={item.authorName}
                        className="h-full w-full object-cover"
                        draggable={false}
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <div className="relative flex flex-col lg:col-span-8">
                    <blockquote className="absolute top-16 left-0 z-10 mb-4 w-full lg:-left-8 lg:w-[calc(100%+2rem)] xl:-left-16 xl:w-[calc(100%+4rem)] 2xl:-left-24 2xl:w-[calc(100%+6rem)]">
                      <p className="section-two-headline-weight indent-8 font-bdo text-[clamp(2.2rem,3.8vw,2.7rem)] leading-[1.01] font-medium tracking-[-0.058em] text-gray-900 sm:indent-16 lg:indent-32 xl:indent-32 xl:text-[clamp(2.05rem,2.38vw,2.36rem)] min-[1440px]:text-[clamp(2.45rem,2.82vw,2.7rem)] 2xl:text-[clamp(3.5rem,3.3vw,4.1rem)]">
                        &ldquo;{item.quote}&rdquo;
                      </p>
                    </blockquote>
                    {/* <div className="pt-24" /> */}
                    {/* ...existing content below quote (if any) ... */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="flex items-center gap-3 lg:col-span-4 lg:mt-[33px]">
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous testimonial"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-900 text-gray-900 transition-colors duration-200 hover:bg-gray-200"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next testimonial"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white transition-colors duration-200 hover:bg-gray-700"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="lg:col-span-8 lg:-ml-8 lg:w-[calc(100%+2rem)] xl:-ml-16 xl:w-[calc(100%+4rem)] 2xl:-ml-24 2xl:w-[calc(100%+6rem)]">
            <div className="mb-8 border-t border-gray-200" />
            <div className="grid max-w-[1100px] grid-cols-[minmax(250px,1.45fr)_minmax(135px,.72fr)_minmax(135px,.72fr)] items-center gap-[clamp(2rem,4vw,5rem)]">
              <div className="inline-flex min-w-0 items-center gap-4 rounded-[5px] bg-[#F7F7F7] px-2 py-2">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[5px] bg-gray-100">
                  {activeItem.authorLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- logo author dari media API (TestimonialDto.authorLogo); butuh elemen img polos
                    <img src={activeItem.authorLogo} alt={activeItem.authorName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-gray-400">{activeItem.authorName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-clash text-[clamp(0.875rem,1.04vw,20px)] leading-tight font-medium text-gray-900">
                    {activeItem.authorName}
                  </span>
                  <span className="font-regular mt-0.5 font-clash text-[clamp(0.75rem,0.83vw,16px)] text-gray-500">{activeItem.authorRole}</span>
                </div>
              </div>
              {FIXED_STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="font-regular font-bdo text-[clamp(1.25rem,2.08vw,40px)] tracking-tight text-gray-900">{stat.value}</span>
                  <span className="mt-1 font-bdo text-[clamp(0.75rem,0.73vw,14px)] font-semibold text-gray-800">{stat.label}</span>
                  <span className="font-regular font-bdo text-xs text-gray-500">{stat.sublabel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
