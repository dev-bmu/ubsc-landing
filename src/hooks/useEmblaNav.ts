import type { EmblaCarouselType } from 'embla-carousel'
import { useCallback } from 'react'

/** Port 1:1 dari resources/js/hooks/useEmblaNav.ts. Dipakai CarouselNavButtons. */
export function useEmblaNav(emblaApi: EmblaCarouselType | undefined) {
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  return { scrollPrev, scrollNext }
}
