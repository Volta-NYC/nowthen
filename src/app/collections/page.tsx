import Image from "next/image"
import Link from "next/link"
import PageHeading from "@/lib/components/page-heading"
import { collections } from "@/lib/content/collections"
import { productsByCollection } from "@/lib/content/products"

export const metadata = { title: "Collections" }

export default function CollectionsPage() {
  return (
    <>
      <PageHeading
        eyebrow="Wander the rooms"
        title="Collections"
        lede="The shop divides itself naturally — by era, by craft, by what you’re reaching for. Pick a doorway."
      />
      <section className="shell space-y-24 pb-24">
        {collections.map((c, i) => {
          const items = productsByCollection(c.slug).slice(0, 4)
          const flip = i % 2 === 1
          return (
            <article
              key={c.slug}
              className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12"
            >
              <div className={`md:col-span-5 ${flip ? "md:order-2" : ""}`}>
                <p className="eyebrow">Collection · {String(i + 1).padStart(2, "0")}</p>
                <h2 className="mt-3 font-display text-4xl sm:text-5xl">{c.name}</h2>
                <p className="mt-5 max-w-md text-ink-soft">{c.blurb}</p>
                <Link
                  href={`/collections/${c.slug}`}
                  className="mt-8 inline-block text-[0.72rem] uppercase tracking-widest text-ink link-underline"
                >
                  Open the room →
                </Link>
                <div className="relative mt-10 aspect-[5/4] overflow-hidden">
                  <Image
                    src={c.cover}
                    alt={c.name}
                    fill
                    sizes="(min-width:768px) 40vw, 90vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className={`md:col-span-7 ${flip ? "md:order-1" : ""}`}>
                <div className="grid grid-cols-2 gap-3 sm:gap-5">
                  {items.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/shop/${p.slug}`}
                      className="group relative block aspect-[4/5] overflow-hidden bg-bone-200"
                    >
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        sizes="(min-width:768px) 25vw, 45vw"
                        className="object-cover transition-transform duration-1000 ease-boutique group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-baseline justify-between bg-gradient-to-t from-ink/80 via-ink/0 to-transparent p-3 text-bone-50">
                        <span className="font-display text-sm">{p.name}</span>
                        <span className="text-[0.7rem]">${p.price}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </>
  )
}
