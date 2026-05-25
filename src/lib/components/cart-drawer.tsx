"use client"

import Image from "next/image"
import Link from "next/link"
import clsx from "clsx"
import { useCart } from "@/lib/cart/cart-context"
import { findProduct } from "@/lib/content/products"

export default function CartDrawer() {
  const { isOpen, close, lines, count, subtotal, setQty, remove } = useCart()

  return (
    <div
      aria-hidden={!isOpen}
      className={clsx(
        "fixed inset-0 z-50 transition-opacity duration-500",
        isOpen ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <button
        aria-label="Close cart"
        onClick={close}
        className="absolute inset-0 bg-ink/40"
      />
      <aside
        className={clsx(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-bone-50 shadow-2xl transition-transform duration-700 ease-boutique",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-label="Your bag"
      >
        <header className="flex items-center justify-between border-b border-ink/10 px-7 py-5">
          <div>
            <p className="eyebrow">Your bag</p>
            <p className="mt-1 font-display text-2xl">
              {count} {count === 1 ? "piece" : "pieces"}
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Close cart"
            className="text-[0.7rem] uppercase tracking-widest text-ink-muted hover:text-ink"
          >
            Close ×
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="font-display text-2xl text-ink">Your bag is empty.</p>
            <p className="mt-3 max-w-xs text-sm text-ink-muted">
              Wander the floor — when something speaks, tap “Add to bag.”
            </p>
            <Link
              href="/shop"
              onClick={close}
              className="btn-ink mt-10"
            >
              Browse the shop
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-7">
              {lines.map((l, i) => {
                const p = findProduct(l.slug)
                if (!p) return null
                return (
                  <li key={`${l.slug}-${l.size}-${l.variant}-${l.added}`} className="flex gap-5 py-6">
                    <Link
                      href={`/shop/${p.slug}`}
                      onClick={close}
                      className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-bone-200"
                    >
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-baseline justify-between gap-3">
                        <Link
                          href={`/shop/${p.slug}`}
                          onClick={close}
                          className="font-display text-base leading-tight hover:text-brass"
                        >
                          {p.name}
                        </Link>
                        <span className="shrink-0 text-sm tabular-nums">${p.price * l.qty}</span>
                      </div>
                      {(l.size || l.variant) && (
                        <p className="mt-1 text-[0.7rem] uppercase tracking-widest text-ink-muted">
                          {l.variant && <>{l.variant}</>}
                          {l.variant && l.size && <span> · </span>}
                          {l.size && <>Size {l.size}</>}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center border border-ink/20 text-sm">
                          <button
                            onClick={() => setQty(i, l.qty - 1)}
                            aria-label="Decrease quantity"
                            className="px-3 py-1.5 text-ink-muted hover:text-ink"
                          >
                            −
                          </button>
                          <span className="min-w-[2ch] px-2 text-center tabular-nums">{l.qty}</span>
                          <button
                            onClick={() => setQty(i, l.qty + 1)}
                            aria-label="Increase quantity"
                            className="px-3 py-1.5 text-ink-muted hover:text-ink"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => remove(i)}
                          className="text-[0.7rem] uppercase tracking-widest text-ink-muted link-underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <footer className="space-y-4 border-t border-ink/10 px-7 py-6">
              <div className="flex items-baseline justify-between">
                <p className="eyebrow">Subtotal</p>
                <p className="font-display text-2xl tabular-nums">${subtotal}</p>
              </div>
              <p className="text-[0.7rem] uppercase tracking-widest text-ink-muted">
                Shipping & taxes calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={close}
                className="btn-ink w-full text-center"
              >
                Checkout →
              </Link>
              <button
                onClick={close}
                className="block w-full text-center text-[0.7rem] uppercase tracking-widest text-ink-muted hover:text-ink"
              >
                Keep shopping
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
