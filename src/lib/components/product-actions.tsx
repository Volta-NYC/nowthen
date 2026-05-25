"use client"

import { useState } from "react"
import clsx from "clsx"
import type { Product } from "@/lib/content/products"
import { useCart } from "@/lib/cart/cart-context"
import SizeGuide from "./size-guide"

export default function ProductActions({ product }: { product: Product }) {
  const [size, setSize] = useState<string | undefined>(product.sizes?.[0])
  const [variant, setVariant] = useState<string | undefined>(product.variant?.[0]?.value)
  const [error, setError] = useState<string | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const { add } = useCart()
  // One-size items don't need a guide.
  const showGuide =
    !!product.sizes && !(product.sizes.length === 1 && /one/i.test(product.sizes[0]))

  const onAdd = () => {
    if (product.sizes && !size) {
      setError("Please choose a size.")
      return
    }
    setError(null)
    add({ slug: product.slug, size, variant })
  }

  return (
    <div className="space-y-8">
      {product.variant && (
        <div>
          <p className="eyebrow">{product.variant[0].label}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {product.variant.map((v) => (
              <li key={v.value}>
                <button
                  onClick={() => setVariant(v.value)}
                  className={clsx(
                    "border px-4 py-2 text-sm transition-colors",
                    variant === v.value
                      ? "border-ink bg-ink text-bone-50"
                      : "border-ink/30 text-ink hover:border-ink",
                  )}
                >
                  {v.value}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {product.sizes && (
        <div>
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Size {size && <span className="text-ink-soft">· {size}</span>}</p>
            {showGuide && (
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="text-[0.7rem] uppercase tracking-widest text-ink-muted hover:text-ink"
              >
                Size guide →
              </button>
            )}
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <li key={s}>
                <button
                  onClick={() => { setSize(s); setError(null) }}
                  className={clsx(
                    "min-w-[3rem] border px-3 py-2 text-sm transition-colors",
                    size === s
                      ? "border-ink bg-ink text-bone-50"
                      : "border-ink/30 text-ink hover:border-ink",
                  )}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="text-[0.75rem] uppercase tracking-widest text-clay">{error}</p>
      )}

      <button onClick={onAdd} className="btn-ink w-full text-center">
        Add to bag · ${product.price}
      </button>

      <div className="grid grid-cols-3 gap-px border-t border-ink/10 text-center text-[0.65rem] uppercase tracking-widest text-ink-muted">
        <div className="bg-bone-50 py-4">Ships from the shop</div>
        <div className="bg-bone-50 py-4">Free over $150</div>
        <div className="bg-bone-50 py-4">14-day returns</div>
      </div>

      <SizeGuide
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        productSizes={product.sizes}
        productName={product.name}
      />
    </div>
  )
}
