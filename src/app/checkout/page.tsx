import Link from "next/link"

export const metadata = { title: "Checkout" }

export default function CheckoutPage() {
  return (
    <section className="shell flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-4 font-display text-5xl sm:text-6xl">Coming soon.</h1>
      <p className="mt-6 max-w-md text-ink-soft">
        We’re hooking up payments. In the meantime, your bag stays saved —
        come back to it when checkout is live.
      </p>
      <div className="mt-10 flex gap-3">
        <Link href="/shop" className="btn-ink">Back to shop</Link>
        <Link href="/" className="btn-outline">Home</Link>
      </div>
    </section>
  )
}
