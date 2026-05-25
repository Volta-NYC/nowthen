import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import ProductCarousel from "@/lib/components/product-carousel"
import ProductActions from "@/lib/components/product-actions"
import { products, findProduct } from "@/lib/content/products"

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = findProduct(slug)
  if (!p) return {}
  return { title: p.name, description: p.blurb }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = findProduct(slug)
  if (!product) notFound()

  const related = products
    .filter((p) => p.slug !== product.slug && p.collections.some((c) => product.collections.includes(c)))
    .slice(0, 4)

  return (
    <article>
      {/* Breadcrumb / back rail */}
      <div className="shell flex items-center gap-2 pt-10 text-[0.7rem] uppercase tracking-widest text-ink-muted">
        <Link href="/shop" className="link-underline">Shop</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      {/* Owner's brief: carousel on the left, info on the right.
          We honor that on lg+, and stack the carousel above on mobile. */}
      <section className="shell mt-6 grid grid-cols-1 gap-10 pb-20 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <ProductCarousel images={product.images} name={product.name} />
        </div>
        <div className="lg:col-span-5 lg:pt-4">
          {product.designer && (
            <p className="eyebrow">{product.designer}</p>
          )}
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-3 text-lg text-ink-soft">
            {product.fromPrice && <span>from </span>}${product.price}
          </p>
          <div className="rule my-8" />

          {product.story && (
            <p className="text-[0.95rem] leading-relaxed text-ink-soft">{product.story}</p>
          )}

          <div className="mt-8">
            <ProductActions product={product} />
          </div>

          {product.details && (
            <details className="mt-10 border-t border-ink/10 pt-6" open>
              <summary className="cursor-pointer list-none text-[0.72rem] uppercase tracking-widest text-ink">
                Details
              </summary>
              <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
                {product.details.map((d) => (
                  <li key={d} className="flex gap-3">
                    <span className="text-brass">✦</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <details className="mt-2 border-t border-ink/10 pt-6">
            <summary className="cursor-pointer list-none text-[0.72rem] uppercase tracking-widest text-ink">
              Shipping & returns
            </summary>
            <p className="mt-4 text-sm text-ink-soft">
              Orders ship from the shop within 1–3 business days. Free
              shipping on orders over $150. Returns accepted within 14 days on
              all <em>Now</em> pieces; <em>Then</em> vintage is final sale.
            </p>
          </details>

          <details className="mt-2 border-t border-ink/10 pt-6">
            <summary className="cursor-pointer list-none text-[0.72rem] uppercase tracking-widest text-ink">
              Try on in shop
            </summary>
            <p className="mt-4 text-sm text-ink-soft">
              Local? We can hold this for you for 48 hours. Just email{" "}
              <a href="mailto:hello@nowandthen.shop" className="link-underline">hello@nowandthen.shop</a>{" "}
              with the size you’d like to try.
            </p>
          </details>

          {product.palette.length > 0 && (
            <div className="mt-10 flex items-center gap-3 text-[0.7rem] uppercase tracking-widest text-ink-muted">
              <span>Palette</span>
              <div className="flex gap-2">
                {product.palette.map((c) => (
                  <span
                    key={c}
                    className="h-4 w-4 rounded-full border border-ink/10"
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-ink/10 bg-bone-50 py-20">
          <div className="shell">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">Pair it with</p>
                <h2 className="mt-3 font-display text-3xl sm:text-4xl">From the same shelf</h2>
              </div>
              <Link href="/shop" className="hidden text-[0.72rem] uppercase tracking-widest hover:text-brass sm:inline">
                Back to shop →
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4">
              {related.map((r) => (
                <Link key={r.slug} href={`/shop/${r.slug}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-bone-200">
                    <Image
                      src={r.images[0]}
                      alt={r.name}
                      fill
                      sizes="(min-width:640px) 22vw, 45vw"
                      className="object-cover transition-transform duration-1000 ease-boutique group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <p className="truncate font-display text-base">{r.name}</p>
                    <p className="ml-3 shrink-0 text-sm text-ink-soft">${r.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
