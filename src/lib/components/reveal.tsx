"use client"

import { useEffect, useRef, useState } from "react"
import clsx from "clsx"

type RevealProps = {
  children: React.ReactNode
  className?: string
  // ms before the reveal triggers (use for staggered grids)
  delay?: number
  // How the element animates in
  variant?: "fade-up" | "fade" | "fade-left" | "fade-right" | "zoom"
  // Stronger threshold = element must be further into viewport before triggering
  threshold?: number
  // If true, reveal only fires once (default). false = re-animates each entry.
  once?: boolean
}

// Single shared observer factory — each Reveal owns its own observer
// since thresholds vary, but the API is uniform.
export default function Reveal({
  children,
  className,
  delay = 0,
  variant = "fade-up",
  threshold = 0.12,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Reduced motion: skip animation, show content immediately.
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) io.disconnect()
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [threshold, once])

  const initial = {
    "fade-up": "opacity-0 translate-y-6",
    "fade": "opacity-0",
    "fade-left": "opacity-0 -translate-x-8",
    "fade-right": "opacity-0 translate-x-8",
    "zoom": "opacity-0 scale-[0.97]",
  }[variant]

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={clsx(
        "transition-all duration-[1100ms] ease-boutique",
        visible ? "opacity-100 translate-x-0 translate-y-0 scale-100" : initial,
        className,
      )}
    >
      {children}
    </div>
  )
}
