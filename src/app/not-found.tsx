import Link from "next/link"

export default function NotFound() {
  return (
    <section className="shell flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-display text-6xl">A door that isn’t there.</h1>
      <p className="mt-6 max-w-md text-ink-soft">
        The page wandered off. Try the shop, or come back to the home page.
      </p>
      <div className="mt-10 flex gap-3">
        <Link href="/" className="btn-ink">Home</Link>
        <Link href="/shop" className="btn-outline">Shop</Link>
      </div>
    </section>
  )
}
