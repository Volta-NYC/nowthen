"use client"

import Image from "next/image"
import Link from "next/link"
import clsx from "clsx"
import { products, homeGridOrder, type Product } from "@/lib/content/products"
import Reveal from "./reveal"

// The owner's explicit request: a grid of "featured" boxes that reveal
// the item name and price on hover. We honor that while keeping the
// layout asymmetric and editorial — a 4-column grid that occasionally
// "breathes" with a wider tile.

const widerSlots = new Set<number>([0, 9, 18, 27])

function FeaturedCard({ p, wider }: { p: Product; wider?: boolean }) {
  const isBleed =
    !p.images[0].includes("ghost") && // (kept for future flag)
    /two-tone-pants|fragrance|tiger|jaguar|fox|lightning|bib|gold-dome|coral|audette|denim|floral|gingham|peach|vintage|soul/.test(
      p.slug,
    )
  return (
    <Link
      href={`/shop/${p.slug}`}
      className="group relative block aspect-square overflow-hidden"
    >
      <Image
        src={p.images[0]}
        alt={p.name}
        fill
        sizes={wider ? "(min-width:1024px) 50vw, 100vw" : "(min-width:1024px) 25vw, 50vw"}
        className="object-cover transition-transform duration-[1400ms] ease-boutique group-hover:scale-[1.04]"
      />

      {/* The reveal: a thin ink veil + centered label, drawing up softly */}
      <div
        className={clsx(
          "pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center",
          "bg-bone-50/0 transition-colors duration-500 ease-boutique group-hover:bg-bone-50/85",
          isBleed && "group-hover:bg-ink/85",
        )}
      >
        <span
          className={clsx(
            "translate-y-3 px-6 opacity-0 transition-all duration-500 ease-boutique group-hover:translate-y-0 group-hover:opacity-100",
            isBleed ? "text-bone-50" : "text-ink",
          )}
        >
          <span className="block font-display text-xl leading-tight md:text-2xl">
            {p.name}
          </span>
          <span className="mt-2 block text-[0.7rem] uppercase tracking-widest text-current/70">
            {p.fromPrice ? "from " : ""}${p.price}
          </span>
        </span>
      </div>

      {/* Corner ear so the existence of the hover is hinted on mobile */}
      <span className="absolute left-3 top-3 h-2 w-2 rounded-full bg-bone-50/90 opacity-0 transition-opacity duration-500 sm:group-hover:opacity-0 md:opacity-100" />
    </Link>
  )
}

export default function FeaturedGrid() {
  const ordered = homeGridOrder
    .map((slug) => products.find((p) => p.slug === slug))
    .filter(Boolean) as Product[]

  return (
    <section id="featured" className="relative">
      <div className="shell flex items-end justify-between py-12">
        <div>
          <p className="eyebrow">The Floor</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl">
            Featured
          </h2>
        </div>
        <Link
          href="/shop"
          className="hidden text-[0.72rem] uppercase tracking-widest text-ink hover:text-brass md:inline-block"
        >
          Shop all →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-px bg-ink/10 sm:grid-cols-3 lg:grid-cols-4">
        {ordered.map((p, i) => {
          // Stagger across the visible row (lg 4 cols, sm 3, default 2).
          // Modulo keeps the delay small so off-screen rows don't pile up.
          const stagger = (i % 8) * 60
          const wider = widerSlots.has(i)
          return (
            <Reveal
              key={p.slug}
              variant="fade-up"
              delay={stagger}
              threshold={0.06}
              className={wider ? "sm:col-span-2 sm:row-span-2" : ""}
            >
              <FeaturedCard p={p} wider={wider} />
            </Reveal>
          )
        })}
      </div>

      <div className="shell flex items-center justify-between py-10 text-[0.72rem] uppercase tracking-widest text-ink-muted">
        <p>1 — {ordered.length} of {products.length}</p>
        <Link href="/shop" className="link-underline text-ink">
          Shop the room →
        </Link>
      </div>
    </section>
  )
}
