import Image from "next/image"
import PageHeading from "@/lib/components/page-heading"

export const metadata = { title: "About" }

const designers = [
  { name: "Seek Collective", note: "Brooklyn → India · naturally dyed essentials." },
  { name: "D.S. & Durga", note: "Brooklyn · perfumers we’ve loved for years." },
  { name: "Audette", note: "Leather goods, made small." },
  { name: "Atelier Two", note: "Our in-house beaded objects studio." },
  { name: "One-of-One Vintage", note: "Pieces we hunt across estate sales and trades." },
]

export default function AboutPage() {
  return (
    <>
      <PageHeading
        eyebrow="About"
        title="Two minds. One little shop."
        lede="NOW + THEN is a small, independent boutique — a working studio that doubles as a storefront, owned and tended by a designer and a beader who share a love of slow craft."
      />

      <section className="shell grid grid-cols-1 gap-12 pb-20 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-5">
          <div className="relative aspect-[3/4] overflow-hidden">
            <Image
              src="/images/hero/hero-racks.webp"
              alt="A corner of the shop — racks of dresses against a brick wall"
              fill
              sizes="(min-width:768px) 35vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="md:col-span-7 md:pt-8">
          <p className="font-display text-2xl leading-relaxed text-ink-soft">
            We opened the doors in a former cabinet-maker’s shop in 2019. We
            kept the brick, the high windows and the stubborn old radiator.
            Everything else — the rails, the work table, the bead boxes — we
            built ourselves.
          </p>
          <div className="rule my-10" />
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
            <div>
              <p className="eyebrow">What we sell</p>
              <p className="mt-3 text-ink-soft">
                Womenswear from a tight circle of independent designers,
                vintage we’ve fallen for, hand-beaded talismans from our
                studio, fragrance, statement jewelry, and the occasional very
                good hat. We rotate stock weekly.
              </p>
            </div>
            <div>
              <p className="eyebrow">What we believe</p>
              <p className="mt-3 text-ink-soft">
                Buy less, buy slowly, and choose pieces that have already
                proved themselves — either by surviving thirty years on someone
                else’s closet rod, or by being made carefully enough that they
                will.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="designers" className="border-t border-ink/10 bg-bone-50 py-20">
        <div className="shell">
          <p className="eyebrow">In the family</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl">Designers & makers</h2>
          <ul className="mt-12 grid grid-cols-1 divide-y divide-ink/10 border-y border-ink/10 sm:grid-cols-2 sm:divide-y-0 sm:[&>li:nth-child(odd)]:border-r sm:[&>li]:border-ink/10">
            {designers.map((d) => (
              <li key={d.name} className="flex items-baseline justify-between gap-6 px-2 py-6">
                <span className="font-display text-2xl">{d.name}</span>
                <span className="text-right text-sm text-ink-soft">{d.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
