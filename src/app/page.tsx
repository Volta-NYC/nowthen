import Image from "next/image"
import Link from "next/link"
import Hero from "@/lib/components/hero"
import FeaturedGrid from "@/lib/components/featured-grid"
import Marquee from "@/lib/components/marquee"
import Reveal from "@/lib/components/reveal"
import ParallaxImage from "@/lib/components/parallax-image"
import { collections } from "@/lib/content/collections"
import { journal } from "@/lib/content/journal"
import { site } from "@/lib/content/site"

const designers = [
  "Seek Collective",
  "D.S. & Durga",
  "Audette",
  "Kate Spade",
  "Steve Madden",
  "Atelier Two",
  "One-of-One Vintage",
  "House Beaders",
]

export default function HomePage() {
  return (
    <>
      <Hero />

      <Marquee items={designers} />

      <FeaturedGrid />

      {/* The "Now / Then" duality — the conceptual heart of the brand */}
      <section className="bg-ink text-bone-50">
        <div className="shell grid grid-cols-1 gap-12 py-28 md:grid-cols-12 md:gap-16">
          <Reveal variant="fade-up" className="md:col-span-5">
            <p className="eyebrow text-brass-light">The premise</p>
            <h2 className="mt-4 font-display text-5xl leading-[1.02] sm:text-6xl md:text-7xl">
              A boutique <em className="text-brass-light">of two minds.</em>
            </h2>
            <p className="mt-8 max-w-md text-base text-bone-50/80">
              We split the shop in half on purpose. <em>Now</em> is the small
              circle of contemporary designers we love — slow-made, ethically
              produced, often one-off. <em>Then</em> is the vintage we hunt for:
              a 60s silk robe, an 80s leather cuff, a beaded clutch that has
              already lived several lives.
            </p>
            <div className="mt-10 flex gap-3">
              <Link href="/collections/now" className="btn-ink bg-bone-50 text-ink hover:bg-brass">
                Shop Now
              </Link>
              <Link
                href="/collections/then"
                className="btn-outline border-bone-50/40 text-bone-50 hover:bg-bone-50 hover:text-ink"
              >
                Shop Then
              </Link>
            </div>
          </Reveal>
          <div className="md:col-span-7">
            <div className="grid grid-cols-2 gap-3">
              <Reveal variant="fade-up" delay={120}>
                <figure className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src="/images/editorial/floral-jumpsuit.webp"
                    alt="A model in a botanical jumpsuit outside on the avenue"
                    fill
                    sizes="(min-width:768px) 30vw, 50vw"
                    className="object-cover"
                  />
                  <figcaption className="absolute bottom-3 left-3 rounded-full bg-bone-50 px-3 py-1 text-[0.65rem] uppercase tracking-widest text-ink">
                    Now
                  </figcaption>
                </figure>
              </Reveal>
              <Reveal variant="fade-up" delay={280}>
                <figure className="relative mt-12 aspect-[3/4] overflow-hidden">
                  <Image
                    src="/images/editorial/vintage-green.webp"
                    alt="A vintage emerald slip dress styled with western boots"
                    fill
                    sizes="(min-width:768px) 30vw, 50vw"
                    className="object-cover"
                  />
                  <figcaption className="absolute bottom-3 left-3 rounded-full bg-brass px-3 py-1 text-[0.65rem] uppercase tracking-widest text-bone-50">
                    Then
                  </figcaption>
                </figure>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Collections rail */}
      <section className="py-24">
        <div className="shell flex items-end justify-between">
          <div>
            <p className="eyebrow">Wander the rooms</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">Collections</h2>
          </div>
          <Link href="/collections" className="hidden text-[0.72rem] uppercase tracking-widest hover:text-brass sm:inline">
            All collections →
          </Link>
        </div>
        <div className="shell mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-6">
          {collections.map((c, i) => (
            <Reveal key={c.slug} variant="fade-up" delay={i * 90}>
              <Link
                href={`/collections/${c.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden bg-bone-200"
              >
                <Image
                  src={c.cover}
                  alt={c.name}
                  fill
                  sizes="(min-width:1024px) 18vw, 50vw"
                  className="object-cover transition-transform duration-1000 ease-boutique group-hover:scale-[1.06]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent p-4">
                  <p className="font-display text-2xl leading-tight text-bone-50">{c.name}</p>
                  <p className="mt-1 text-xs text-bone-50/80">{c.blurb}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Journal preview */}
      <section className="border-t border-ink/10 bg-bone-50 py-24">
        <div className="shell">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Field notes</p>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl">Journal</h2>
            </div>
            <Link href="/journal" className="hidden text-[0.72rem] uppercase tracking-widest hover:text-brass sm:inline">
              Read all →
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
            {journal.map((j, i) => (
              <Reveal key={j.slug} variant="fade-up" delay={i * 140}>
                <Link href={`/journal#${j.slug}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={j.cover}
                      alt={j.title}
                      fill
                      sizes="(min-width:768px) 30vw, 90vw"
                      className="object-cover transition-transform duration-1000 ease-boutique group-hover:scale-[1.05]"
                    />
                  </div>
                  <p className="mt-4 text-[0.7rem] uppercase tracking-widest text-ink-muted">
                    {j.date} · {j.read} read
                  </p>
                  <h3 className="mt-2 font-display text-2xl leading-snug">{j.title}</h3>
                  <p className="mt-3 text-sm text-ink-soft">{j.dek}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Visit — scroll-driven parallax photo */}
      <section className="relative">
        <ParallaxImage
          src="/images/hero/hero-main.webp"
          alt="Inside the boutique — exposed brick, a wall of hats and scarves"
          sizes="100vw"
          speed={0.22}
          className="h-[60vh] min-h-[420px] w-full"
        />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="absolute inset-0 flex items-center">
          <div className="shell">
            <Reveal variant="fade-up">
              <p className="eyebrow text-bone-50/80">Come by</p>
              <h2 className="mt-3 max-w-2xl font-display text-5xl leading-[1.02] text-bone-50 sm:text-6xl md:text-7xl">
                The door is open, the kettle’s on.
              </h2>
            </Reveal>
            <Reveal variant="fade-up" delay={180}>
              <p className="mt-6 max-w-md text-bone-50/85">{site.address}</p>
              <div className="mt-6 grid max-w-md grid-cols-3 gap-x-6 gap-y-1 text-sm text-bone-50/85">
                {site.hours.map((h) => (
                  <div key={h.d} className="flex flex-col">
                    <span className="text-[0.65rem] uppercase tracking-widest text-bone-50/60">
                      {h.d}
                    </span>
                    <span>{h.h}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex gap-3">
                <Link
                  href="/visit"
                  className="btn-ink bg-bone-50 text-ink hover:bg-brass hover:text-bone-50"
                >
                  Plan a visit
                </Link>
                <Link
                  href="/contact"
                  className="btn-outline border-bone-50/40 text-bone-50 hover:bg-bone-50 hover:text-ink"
                >
                  Get in touch
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
