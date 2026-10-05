'use client'

import { useRef, useState } from 'react'
import { Maximize2, MoreVertical, Pause, Play, Volume2 } from 'lucide-react'

export interface ReelItem {
  // id disempitkan ke string (Laravel: string | number) agar cocok dengan ReelDto (id uuid string)
  // yang dioper ReelsSection tanpa map. DOM-neutral: id hanya dipakai sebagai React key.
  id: string
  thumbnail?: string
  title: string
  date: string
  videoUrl?: string
  isActive?: boolean
}

interface ReelCardProps {
  item: ReelItem
  featured?: boolean
  isActive?: boolean
}

/**
 * Port dari resources/js/Components/Landing/ReelCard.tsx.
 *
 * 'use client': useRef + useState untuk toggle play/pause elemen <video> (onClick handler).
 *
 * Perubahan terhadap sumber:
 *   - default export -> named export `ReelCard`; `interface ReelItem` dipertahankan (camelCase = ReelDto).
 *   - classPair (spec-ReelCard.json): `flex-shrink-0` -> `shrink-0` pada shell kartu.
 *   - <img> thumbnail memicu @next/next/no-img-element -> eslint-disable (gambar CMS /uploads).
 *
 * `video.src` = item.videoUrl (URL /uploads dari API, dilayani lewat rewrite yang sudah ada) —
 * dibiarkan sebagai src apa adanya.
 */
export function ReelCard({ item, featured = false, isActive }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const thumbUrl = item.thumbnail

  const togglePlay = () => {
    const vid = videoRef.current
    if (!vid) return
    if (playing) {
      vid.pause()
      setPlaying(false)
    } else {
      vid.play()
      setPlaying(true)
      vid.muted = false
      vid.volume = 1
    }
  }

  return (
    <div
      className={[
        'group relative shrink-0 cursor-pointer overflow-hidden rounded-[10px] bg-neutral-800',
        featured || isActive
          ? 'h-[300px] w-[170px] sm:h-[560px] sm:w-[334px] xl:h-[604px] xl:w-[360px]'
          : 'h-[260px] w-[148px] sm:h-[510px] sm:w-[304px] xl:h-[551px] xl:w-[328px]'
      ].join(' ')}
      onClick={item.videoUrl ? togglePlay : undefined}
    >
      {item.videoUrl ? (
        <video
          ref={videoRef}
          src={item.videoUrl}
          poster={thumbUrl}
          playsInline
          loop
          controls={false}
          muted={false}
          preload="none"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
          onEnded={() => setPlaying(false)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- thumbnail reel dari item.thumbnail (gambar CMS /uploads), butuh <img> polos bukan next/image
        <img
          src={thumbUrl}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
          draggable={false}
        />
      )}

      {!featured && (
        <div
          className={[
            'absolute top-[55%] left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-white transition-all duration-300',
            playing ? 'opacity-0 group-hover:scale-110 group-hover:opacity-100' : 'opacity-100 group-hover:scale-110'
          ].join(' ')}
        >
          {playing ? <Pause size={34} fill="white" /> : <Play size={38} fill="white" strokeWidth={1.5} className="ml-1" />}
        </div>
      )}

      {featured && (
        <div className="pointer-events-none absolute inset-x-[15px] bottom-[10px] text-white">
          <div className="flex items-center gap-3">
            <Pause size={12} fill="white" />
            <span className="font-bdo text-[11px] font-medium">1:21</span>
            <div className="relative h-[3px] flex-1 rounded-full bg-white/75">
              <span className="absolute top-1/2 left-[7%] h-[7px] w-[7px] -translate-y-1/2 rounded-full bg-white" />
            </div>
            <Volume2 size={12} />
            <Maximize2 size={12} />
            <MoreVertical size={12} />
          </div>
        </div>
      )}
    </div>
  )
}
