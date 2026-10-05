'use client'

import { Map, MapMarker, MarkerContent, MarkerLabel, MarkerPopup } from '@/components/landing/map'
import { Clock, Star } from 'lucide-react'

/**
 * The branch-locator map, shared by the homepage (SectionEight) and the
 * about page (AboutSectionMap).
 *
 * This module is the maplibre-gl boundary: it is the ONLY landing component
 * that reaches @/components/landing/map, so bundlers keep maplibre (~1.07 MB
 * of JS plus its stylesheet) in a chunk of its own. Always reach it through
 * LocationMapLazy so that chunk is never on the first-paint path.
 */

const places = [
  {
    id: 1,
    name: 'Lapangan Sepak Bola UB',
    label: 'Football Field',
    category: 'Football Field',
    rating: 4.5,
    reviews: 54,
    hours: '06:00 AM - 10:00 PM',
    image: '/assets/images/fasilitas-arena-terbuka-dieng-ub-sport-center-malang.avif',
    lng: 112.59151096357927,
    lat: -7.9691905411073645
  },
  {
    id: 2,
    name: 'UBSC Cabang Transmart',
    label: 'Sport Facility',
    category: 'Sport Facility',
    rating: 4.4,
    reviews: 1570,
    hours: '9:00 AM - 10:00 PM',
    image: '/assets/images/cabang-eksklusif-transmart-ub-sport-center-malang.avif',
    lng: 112.61788923503353,
    lat: -7.956800793398481
  },
  {
    id: 3,
    name: 'UB Sports Center',
    label: 'Sport Facility',
    category: 'Sport Facility',
    rating: 4.4,
    reviews: 1189,
    hours: '6:00 AM - 10:00 PM',
    image: '/assets/images/ub-sport-center-kantor-pusat-malang.avif',
    lng: 112.61843891490952,
    lat: -7.955087591403217
  }
]

interface LocationMapProps {
  cooperativeGestures?: boolean
  scrollZoom?: boolean
}

export function LocationMap({ cooperativeGestures = false, scrollZoom = false }: LocationMapProps) {
  return (
    <Map center={[112.6206015734149, -7.967043987533171]} zoom={13} theme="light" cooperativeGestures={cooperativeGestures} scrollZoom={scrollZoom}>
      {places.map((place) => (
        <MapMarker key={place.id} longitude={place.lng} latitude={place.lat}>
          <MarkerContent>
            <div className="size-5 cursor-pointer rounded-full border-2 border-white bg-rose-500 shadow-lg transition-transform hover:scale-110" />
            <MarkerLabel position="bottom">{place.label}</MarkerLabel>
          </MarkerContent>
          <MarkerPopup className="w-62 p-0">
            <div className="relative h-32 w-48 overflow-hidden rounded-t-md">
              {/* eslint-disable-next-line @next/next/no-img-element -- gambar fasilitas dari public/ (path string), bukan gambar CMS /uploads; sengaja bukan next/image */}
              <img src={place.image} alt={place.name} className="object-cover" loading="lazy" />
            </div>
            <div className="space-y-2 p-3">
              <div>
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{place.category}</span>
                <h3 className="leading-tight font-semibold text-foreground">{place.name}</h3>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{place.rating}</span>
                  <span className="text-muted-foreground">({place.reviews.toLocaleString()})</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5" />
                <span>{place.hours}</span>
              </div>
            </div>
          </MarkerPopup>
        </MapMarker>
      ))}
    </Map>
  )
}
