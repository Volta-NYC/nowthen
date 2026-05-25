"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import clsx from "clsx"

// Lightweight scroll-driven parallax — the image translates within its
// frame as the section moves through the viewport. RAF-throttled.

export default function ParallaxImage({
  src,
  alt,
  sizes,
  className,
  // 0 = no movement, 1 = full viewport movement. 0.2 is a nice subtle lift.
  speed = 0.18,
  priority,
}: {
  src: string
  alt: string
  sizes?: string
  className?: string
  speed?: number
  priority?: boolean
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [offset, setOffset] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const onMQ = () => setReduced(mq.matches)
    mq.addEventListener("change", onMQ)
    return () => mq.removeEventListener("change", onMQ)
  }, [])

  useEffect(() => {
    if (reduced) return
    let ticking = false
    const compute = () => {
      const el = wrapRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      // Progress: -1 (just left) → 0 (centered) → 1 (about to enter top)
      const center = rect.top + rect.height / 2
      const p = (center - vh / 2) / (vh / 2 + rect.height / 2)
      // Clamp & scale.
      setOffset(Math.max(-1, Math.min(1, p)) * 60 * speed)
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        compute()
        ticking = false
      })
    }
    compute()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [speed, reduced])

  return (
    <div ref={wrapRef} className={clsx("relative overflow-hidden", className)}>
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translate3d(0, ${offset}px, 0) scale(1.12)`,
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    </div>
  )
}
