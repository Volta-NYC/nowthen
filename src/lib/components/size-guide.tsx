"use client"

import { useEffect } from "react"
import clsx from "clsx"

// Placeholder size guide — the real chart is coming. The modal still
// opens cleanly so the link in the product page isn't a dead-end.

export default function SizeGuide({
  open,
  onClose,
  productName,
}: {
  open: boolean
  onClose: () => void
  productSizes?: string[]
  productName?: string
}) {
  // Lock scroll & close on Escape while open.
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  return (
    <div
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label="Size guide"
      className={clsx(
        "fixed inset-0 z-[55] transition-opacity duration-500",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <button
        aria-label="Close size guide"
        onClick={onClose}
        className="absolute inset-0 bg-ink/55"
      />
      <div
        className={clsx(
          "absolute inset-x-0 bottom-0 bg-bone-50 px-6 py-10 shadow-2xl transition-transform duration-700 ease-boutique sm:inset-x-auto sm:right-0 sm:top-0 sm:h-full sm:w-full sm:max-w-md sm:px-10 sm:py-12",
          open ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <p className="eyebrow">Size guide</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[0.7rem] uppercase tracking-widest text-ink-muted hover:text-ink"
          >
            Close ×
          </button>
        </div>

        <div className="mt-16 sm:mt-24">
          <h2 className="font-display text-4xl sm:text-5xl">Coming soon.</h2>
          <p className="mt-5 text-ink-soft">
            We’re putting together a proper sizing chart for{" "}
            {productName ? <em>{productName}</em> : "this piece"}. In the
            meantime, drop us a note with your measurements and we’ll
            recommend a size.
          </p>
          <a
            href="mailto:hello@nowandthen.shop"
            className="btn-ink mt-10 inline-flex"
          >
            Email the shop
          </a>
        </div>
      </div>
    </div>
  )
}
