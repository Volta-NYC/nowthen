"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useMemo } from "react"
import clsx from "clsx"
import { products, type Product } from "@/lib/content/products"
import { collections as cols } from "@/lib/content/collections"

type FilterKey = "all" | "now" | "then" | string

export default function ShopGrid({ initialFilter = "all" as FilterKey, hideControls = false }: { initialFilter?: FilterKey; hideControls?: boolean }) {
  const [filter, setFilter] = useState<FilterKey>(initialFilter)
  const [sort, setSort] = useState<"curated" | "low" | "high">("curated")

  const filtered = useMemo(() => {
    let r: Product[] = products
    if (filter !== "all") r = r.filter((p) => p.collections.includes(filter))
    if (sort === "low") r = [...r].sort((a, b) => a.price - b.price)
    if (sort === "high") r = [...r].sort((a, b) => b.price - a.price)
    return r
  }, [filter, sort])

  return (
    <section>
      {!hideControls && (
        <div className="shell flex flex-col gap-6 border-y border-ink/10 py-5 md:flex-row md:items-center md:justify-between">
          <div className="-mx-1 flex flex-wrap items-center gap-x-1 gap-y-2 text-[0.72rem] uppercase tracking-widest">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
            {cols.map((c) => (
              <Chip key={c.slug} active={filter === c.slug} onClick={() => setFilter(c.slug)}>
                {c.name}
              </Chip>
            ))}
          </div>
          <label className="flex items-center gap-3 text-[0.72rem] uppercase tracking-widest text-ink-muted">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="border-b border-ink/30 bg-transparent py-1 pr-6 text-ink focus:outline-none"
            >
              <option value="curated">Curated</option>
              <option value="low">Price · low to high</option>
              <option value="high">Price · high to low</option>
            </select>
          </label>
        </div>
      )}

      <div className="shell mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => (
          <Link key={p.slug} href={`/shop/${p.slug}`} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden bg-bone-200">
              <Image
                src={p.images[0]}
                alt={p.name}
                fill
                sizes="(min-width:1024px) 22vw, (min-width:640px) 30vw, 45vw"
                className="object-cover transition-transform duration-[1200ms] ease-boutique group-hover:scale-[1.04]"
              />
              {p.images[1] && (
                <Image
                  src={p.images[1]}
                  alt=""
                  fill
                  sizes="(min-width:1024px) 22vw, (min-width:640px) 30vw, 45vw"
                  className="object-cover opacity-0 transition-opacity duration-700 ease-boutique group-hover:opacity-100"
                />
              )}
              {p.era === "then" && (
                <span className="absolute left-3 top-3 rounded-full bg-brass px-2.5 py-1 text-[0.6rem] uppercase tracking-widest text-bone-50">
                  Then
                </span>
              )}
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                {p.designer && (
                  <p className="truncate text-[0.65rem] uppercase tracking-widest text-ink-muted">
                    {p.designer}
                  </p>
                )}
                <p className="mt-0.5 font-display text-lg leading-snug">{p.name}</p>
              </div>
              <p className="shrink-0 text-sm tabular-nums text-ink-soft">
                {p.fromPrice ? "from " : ""}${p.price}
              </p>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-20 text-center text-ink-muted">
            Nothing in that drawer at the moment — try another collection.
          </p>
        )}
      </div>
    </section>
  )
}

function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-full px-3 py-1.5 transition-colors duration-300",
        active ? "bg-ink text-bone-50" : "text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </button>
  )
}
