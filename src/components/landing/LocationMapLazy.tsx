'use client'

import dynamic from 'next/dynamic'
import { useRef } from 'react'
import { useNearViewport } from '@/hooks/useNearViewport'

const LocationMap = dynamic(() => import('@/components/landing/LocationMap').then((m) => m.LocationMap), { ssr: false })

interface LocationMapLazyProps {
  cooperativeGestures?: boolean
  scrollZoom?: boolean
}

/**
 * Defers the maplibre-gl chunk (~1.03 MB JS + ~70 KB CSS) and the WebGL
 * context it creates until the map is about to scroll into view. Both call
 * sites sit in the last third of their page, so on a first paint neither the
 * download, the GL context, nor the basemap tile cascade happens at all.
 */
export function LocationMapLazy(props: LocationMapLazyProps) {
  const holderRef = useRef<HTMLDivElement>(null)
  const near = useNearViewport(holderRef)

  return (
    <div ref={holderRef} className="h-full w-full">
      {near && <LocationMap {...props} />}
    </div>
  )
}
