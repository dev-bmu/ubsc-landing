'use client'

import { type MouseEvent, useEffect, useId, useMemo, useRef } from 'react'

// ─────────────────────────────────────────────
// Port 1:1 dari resources/js/Components/Landing/CurvedLoop.tsx.
//
// Berkas ini BELUM ada di src/components/landing/ saat Fase 5 halaman /facilities dan /news dikerjakan,
// padahal FacilityMembership dan ServicesSectionNews (dan AboutHistory) memakainya. Di-port di sini apa
// adanya supaya kedua halaman itu bisa berdiri; tidak ada spec-CurvedLoop.json di scratchpad karena
// komponen ini NOL utilitas Tailwind — seluruh tampilannya inline style + SVG, jadi tidak ada satu pun
// titik sentuh pergeseran v3->v4 dan tidak ada classPair/deadToken yang berlaku.
//
// Perubahan terhadap sumber (semua wajib, tidak satu pun mengubah DOM/tampilan):
//   - default export -> named export (konvensi repo).
//   - 'use client': useId/useRef/useEffect, rAF, IntersectionObserver, dan handler mouse.
//   - `React.MouseEvent` -> `MouseEvent` dari 'react' (impor tipe eksplisit, tanpa namespace React).
// ─────────────────────────────────────────────

interface CurvedLoopProps {
  marqueeText?: string
  speed?: number
  className?: string
  curveAmount?: number
  direction?: 'left' | 'right'
  interactive?: boolean
}

export function CurvedLoop({
  marqueeText = 'UB * SPORT CENTER * ',
  speed = 2,
  className,
  curveAmount = 200,
  direction = 'left',
  interactive = true
}: CurvedLoopProps) {
  const uniqueId = useId()
  const pathId = `curved-loop-path-${uniqueId.replace(/:/g, '')}`

  const offsetRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const lastXRef = useRef(0)
  const dragVelocityRef = useRef(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const textPathRef = useRef<SVGTextPathElement>(null)

  const singleTextWidth = useMemo(() => {
    return marqueeText.length * 55
  }, [marqueeText])

  const repeatCount = useMemo(() => {
    const viewportWidth = 1440
    const needed = Math.ceil((viewportWidth * 2) / singleTextWidth) + 2
    return Math.max(needed, 4)
  }, [singleTextWidth])

  const totalText = useMemo(() => marqueeText.repeat(repeatCount), [marqueeText, repeatCount])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const step = direction === 'left' ? -speed : speed

    const animate = () => {
      if (!isDraggingRef.current) {
        offsetRef.current += step
      } else {
        offsetRef.current += dragVelocityRef.current
        dragVelocityRef.current *= 0.95
      }

      // Wrap offset to prevent unbounded growth
      const wrapAt = singleTextWidth
      if (offsetRef.current <= -wrapAt) offsetRef.current += wrapAt
      if (offsetRef.current >= wrapAt) offsetRef.current -= wrapAt

      // ponytail: write the attribute straight to the node. Routing this
      // through setState re-rendered the whole SVG 60 times a second.
      textPathRef.current?.setAttribute('startOffset', `${offsetRef.current}px`)
      rafRef.current = requestAnimationFrame(animate)
    }

    const start = () => {
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(animate)
    }
    const stop = () => {
      if (rafRef.current === null) return
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    // ponytail: SVG textPath layout is not cheap; do not pay for it while
    // the band is scrolled out of view.
    const visibility = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop()), { rootMargin: '200px 0px' })
    visibility.observe(root)

    return () => {
      visibility.disconnect()
      stop()
    }
  }, [speed, direction, singleTextWidth])

  const handleMouseDown = (e: MouseEvent) => {
    if (!interactive) return
    isDraggingRef.current = true
    lastXRef.current = e.clientX
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!interactive || !isDraggingRef.current) return
    const dx = e.clientX - lastXRef.current
    dragVelocityRef.current = dx * 0.5
    offsetRef.current += dx
    lastXRef.current = e.clientX
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  const pathD = `M-100,40 Q720,${40 + curveAmount} 1540,40`

  return (
    <div
      ref={rootRef}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        overflow: 'hidden',
        cursor: interactive ? 'grab' : 'default',
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        viewBox="0 0 1440 120"
        style={{
          width: '100%',
          aspectRatio: '100 / 12',
          fontSize: '4.5rem',
          fill: 'white',
          fontWeight: 700,
          textTransform: 'uppercase',
          fontFamily: 'inherit',
          overflow: 'visible'
        }}
      >
        <defs>
          <path id={pathId} d={pathD} />
        </defs>
        <text>
          <textPath ref={textPathRef} href={`#${pathId}`} startOffset="0px" style={{ whiteSpace: 'pre' }}>
            {totalText}
          </textPath>
        </text>
      </svg>
    </div>
  )
}
