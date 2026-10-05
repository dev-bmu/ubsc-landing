import { type RefObject, useEffect, useState } from 'react'

/** Input that only a person produces. `scroll` is handled separately. */
const WAKE_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart']

/**
 * True once `ref` has come within `rootMargin` of the viewport, and stays true.
 *
 * Observation is held until the visitor first interacts with the page, because
 * an IntersectionObserver created before then measures a collapsed document:
 * the sections below the fold get their height from images that are themselves
 * lazy, so they are still zero-height at `load`. Observed from that state, a
 * target 15,000px down reports as intersecting and every deferred thing on the
 * page arms at once — precisely the cost the gate exists to prevent.
 *
 * Waiting for interaction is safe for anything below the fold: it cannot be
 * seen without scrolling, and any scroll, key, or pointer input releases it.
 *
 * Port 1:1 dari resources/js/hooks/useNearViewport.ts. JANGAN disederhanakan:
 * hook inilah yang menahan chunk maplibre (LocationMapLazy) dan video footer
 * supaya tidak ikut diunduh saat first paint.
 */
export function useNearViewport(ref: RefObject<Element | null>, rootMargin = '400px 0px'): boolean {
  const [near, setNear] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || near) return

    if (!('IntersectionObserver' in window)) {
      setNear(true)
      return
    }

    let observer: IntersectionObserver | null = null
    let started = false

    // A `scroll` event does not prove the visitor scrolled: resetting the
    // page to the top on mount fires one too, at scrollY 0, which was
    // enough to open this gate a few ms after load.
    const onScroll = () => {
      if (window.scrollY > 0) start()
    }

    const start = () => {
      if (started) return
      started = true
      window.removeEventListener('scroll', onScroll)
      for (const type of WAKE_EVENTS) {
        window.removeEventListener(type, start)
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return
          setNear(true)
          observer?.disconnect()
        },
        { rootMargin }
      )
      observer.observe(node)
    }

    // Already scrolled (restored position, in-page anchor, short page).
    if (window.scrollY > 0) {
      start()
    } else {
      window.addEventListener('scroll', onScroll, { passive: true })
      for (const type of WAKE_EVENTS) {
        window.addEventListener(type, start, { once: true, passive: true })
      }
    }

    return () => {
      window.removeEventListener('scroll', onScroll)
      for (const type of WAKE_EVENTS) {
        window.removeEventListener(type, start)
      }
      observer?.disconnect()
    }
  }, [near, ref, rootMargin])

  return near
}
