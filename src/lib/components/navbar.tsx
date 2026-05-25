"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import clsx from "clsx"
import Wordmark from "./wordmark"
import { primaryNav, secondaryNav, site } from "@/lib/content/site"
import { useCart } from "@/lib/cart/cart-context"

// The owner wrote: "the layer cake [hamburger] is nice, but could do
// something more traditional." We give them both — a slim editorial top
// rail with horizontal links on desktop, and a beautifully restrained
// drawer-menu behind a layered icon on every viewport.

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { count, open: openCart } = useCart()
  // Avoid hydration mismatch — only show the live count once the cart
  // has hydrated from localStorage on the client.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
  }, [open])

  return (
    <>
      <header
        className={clsx(
          "sticky top-0 z-40 w-full transition-all duration-500",
          scrolled
            ? "bg-bone-50/90 backdrop-blur border-b border-ink/10"
            : "bg-transparent border-b border-transparent",
        )}
      >
        <div className="shell flex items-center justify-between gap-4 py-5">
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="group flex items-center gap-3 text-ink"
          >
            <span className="flex h-5 w-7 flex-col justify-between" aria-hidden>
              <span className="h-px w-full bg-current" />
              <span className="h-px w-3/4 bg-current transition-all duration-500 group-hover:w-full" />
              <span className="h-px w-1/2 bg-current transition-all duration-500 group-hover:w-full" />
            </span>
            <span className="hidden text-[0.7rem] uppercase tracking-widest sm:inline">
              Menu
            </span>
          </button>

          <Link href="/" className="block" aria-label={site.name}>
            <Wordmark size="md" />
          </Link>

          <nav className="hidden items-center gap-7 text-[0.72rem] uppercase tracking-widest text-ink lg:flex">
            {primaryNav.map((l) => (
              <Link key={l.href} href={l.href} className="link-underline">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-5 text-ink">
            <Link
              href="/shop"
              aria-label="Search the shop"
              className="hidden sm:inline-block"
            >
              <SearchIcon />
            </Link>
            <button
              onClick={openCart}
              aria-label={`Open bag${mounted && count > 0 ? ` (${count})` : ""}`}
              className="relative flex items-center gap-2 text-[0.7rem] uppercase tracking-widest"
            >
              <span className="relative">
                <BagIcon />
                {mounted && count > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-brass px-1 text-[0.6rem] font-semibold text-bone-50 tabular-nums">
                    {count}
                  </span>
                )}
              </span>
              <span className="hidden sm:inline">
                Bag {mounted ? `(${count})` : "(0)"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Drawer */}
      <div
        aria-hidden={!open}
        className={clsx(
          "fixed inset-0 z-50 transition-opacity duration-500",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="absolute inset-0 bg-ink/40"
        />
        <aside
          className={clsx(
            "absolute left-0 top-0 h-full w-full max-w-md overflow-y-auto bg-bone-50 px-8 py-8 shadow-2xl transition-transform duration-700 ease-boutique",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between">
            <Wordmark size="sm" withScript={false} />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="text-[0.7rem] uppercase tracking-widest text-ink-muted hover:text-ink"
            >
              Close ×
            </button>
          </div>

          <p className="eyebrow mt-10">Shop</p>
          <ul className="mt-4 flex flex-col gap-3">
            {primaryNav.map((l, i) => (
              <li key={l.href} style={{ animationDelay: `${80 + i * 60}ms` }} className="animate-fade-up">
                <Link
                  onClick={() => setOpen(false)}
                  href={l.href}
                  className="font-display text-3xl text-ink hover:text-brass transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="eyebrow mt-12">Information</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-ink-soft">
            {secondaryNav.map((l) => (
              <li key={l.href}>
                <Link onClick={() => setOpen(false)} href={l.href} className="link-underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="rule mt-12" />
          <div className="mt-6 space-y-1 text-sm text-ink-muted">
            <p>{site.address}</p>
            <p>{site.phone}</p>
            <p>{site.email}</p>
          </div>
        </aside>
      </div>
    </>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}
function BagIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 8h16l-1.2 14a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  )
}
