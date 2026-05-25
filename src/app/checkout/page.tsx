"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useCart } from "@/lib/cart/cart-context"
import { findProduct } from "@/lib/content/products"

// Placeholder checkout. The cart state is real and persistent — this page
// summarizes the order and stops where a real payment processor would
// take over (Stripe Checkout, Shopify, etc.). Submitting the demo form
// clears the cart and shows an "Order received" confirmation.

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCart()
  const [mounted, setMounted] = useState(false)
  const [done, setDone] = useState(false)
  const [reference, setReference] = useState<string | null>(null)
  useEffect(() => setMounted(true), [])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo: in a real build this would POST to /api/checkout and redirect
    // to the payment provider's hosted checkout.
    const ref = "NT-" + Math.random().toString(36).slice(2, 8).toUpperCase()
    setReference(ref)
    setDone(true)
    clear()
    window.scrollTo({ top: 0 })
  }

  // SSR-safe empty state until hydration completes.
  const empty = mounted && lines.length === 0 && !done

  return (
    <div className="shell grid grid-cols-1 gap-12 pb-24 pt-16 md:grid-cols-12 md:gap-16 md:pt-24">
      {/* LEFT — order form / confirmation */}
      <section className="md:col-span-7">
        {done ? (
          <div className="border border-ink/15 bg-bone-50 p-8 md:p-12">
            <p className="eyebrow">Order received</p>
            <h1 className="mt-4 font-display text-4xl md:text-5xl">Thank you.</h1>
            <p className="mt-5 text-ink-soft">
              We’ll wrap this with care and ship it within a few days. You’ll
              get an email when it’s on its way.
            </p>
            <p className="mt-6 text-sm text-ink-muted">
              Reference <span className="font-mono text-ink">{reference}</span>
            </p>
            <div className="mt-10 flex gap-3">
              <Link href="/shop" className="btn-ink">Keep shopping</Link>
              <Link href="/" className="btn-outline">Back to home</Link>
            </div>
          </div>
        ) : empty ? (
          <div className="border border-ink/15 bg-bone-50 p-10 text-center">
            <p className="eyebrow">Your bag</p>
            <h1 className="mt-3 font-display text-4xl">No items to check out.</h1>
            <p className="mt-4 text-ink-soft">Wander the floor first.</p>
            <Link href="/shop" className="btn-ink mt-8">Browse the shop</Link>
          </div>
        ) : (
          <>
            <p className="eyebrow">Checkout</p>
            <h1 className="mt-4 font-display text-4xl md:text-5xl">
              A few details and we’ll send it on its way.
            </h1>
            <p className="mt-5 max-w-md text-ink-soft">
              This is a demo storefront — no card will be charged. Submitting
              the form simulates an order and clears your bag.
            </p>

            <form onSubmit={onSubmit} className="mt-12 space-y-12">
              <fieldset className="space-y-6">
                <legend className="eyebrow mb-4">Contact</legend>
                <Field label="Email" name="email" type="email" required />
                <Field label="Phone (optional)" name="phone" type="tel" />
              </fieldset>

              <fieldset className="space-y-6">
                <legend className="eyebrow mb-4">Shipping</legend>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Field label="First name" name="first" required />
                  <Field label="Last name" name="last" required />
                </div>
                <Field label="Address" name="addr1" required />
                <Field label="Apt / Suite (optional)" name="addr2" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <Field label="City" name="city" required />
                  <Field label="State" name="state" required />
                  <Field label="ZIP" name="zip" required />
                </div>
              </fieldset>

              <fieldset>
                <legend className="eyebrow mb-4">Payment</legend>
                <div className="border border-dashed border-ink/30 bg-bone-50 px-5 py-6 text-sm text-ink-muted">
                  Card collection happens on the next step. This demo skips
                  payment — clicking <em>Place order</em> simulates a paid order.
                </div>
              </fieldset>

              <button className="btn-ink w-full text-center">
                Place order · ${subtotal}
              </button>
              <p className="text-center text-[0.65rem] uppercase tracking-widest text-ink-muted">
                You’ll get a confirmation email at the address above.
              </p>
            </form>
          </>
        )}
      </section>

      {/* RIGHT — order summary, sticky on desktop */}
      <aside className="md:col-span-5">
        <div className="md:sticky md:top-28">
          <p className="eyebrow">Order summary</p>
          <h2 className="mt-3 font-display text-2xl">
            {mounted ? lines.length : 0} {lines.length === 1 ? "piece" : "pieces"}
          </h2>

          <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
            {mounted && lines.length > 0
              ? lines.map((l, i) => {
                  const p = findProduct(l.slug)
                  if (!p) return null
                  return (
                    <li key={i} className="flex items-start gap-5 py-5">
                      <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-bone-200">
                        <Image src={p.images[0]} alt={p.name} fill sizes="80px" className="object-cover" />
                        <span className="absolute -right-2 -top-2 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-ink px-1 text-[0.65rem] tabular-nums text-bone-50">
                          {l.qty}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="font-display text-base leading-tight">{p.name}</p>
                        {(l.size || l.variant) && (
                          <p className="mt-1 text-[0.65rem] uppercase tracking-widest text-ink-muted">
                            {l.variant} {l.variant && l.size ? "·" : ""} {l.size ? `Size ${l.size}` : ""}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 text-sm tabular-nums">${p.price * l.qty}</p>
                    </li>
                  )
                })
              : null}
          </ul>

          <dl className="mt-6 space-y-2 text-sm">
            <Row label="Subtotal" value={`$${mounted ? subtotal : 0}`} />
            <Row label="Shipping" value="Free over $150" muted />
            <Row label="Taxes" value="Calculated next" muted />
          </dl>
          <div className="rule my-4" />
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Total</p>
            <p className="font-display text-3xl tabular-nums">${mounted ? subtotal : 0}</p>
          </div>
        </div>
      </aside>
    </div>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={muted ? "text-ink-muted" : "tabular-nums"}>{value}</dd>
    </div>
  )
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
}) {
  return (
    <label className="relative block">
      <input
        name={name}
        type={type}
        required={required}
        placeholder=" "
        className="peer block w-full border-b border-ink/30 bg-transparent py-3 text-ink placeholder-transparent focus:border-ink focus:outline-none"
      />
      <span className="pointer-events-none absolute left-0 top-0 origin-left -translate-y-3 text-[0.7rem] uppercase tracking-widest text-ink-muted transition-all peer-placeholder-shown:translate-y-3 peer-placeholder-shown:text-sm peer-placeholder-shown:tracking-normal peer-focus:-translate-y-3 peer-focus:text-[0.7rem] peer-focus:tracking-widest peer-focus:text-ink">
        {label}
      </span>
    </label>
  )
}
