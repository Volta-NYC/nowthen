import Image from "next/image"
import Link from "next/link"
import { site } from "@/lib/content/site"

// The hero composition is deliberate: our NOW + THEN wordmark sits at the
// very top, the photograph carries the middle (model + boutique interior),
// and the season copy + CTAs sit on a quiet dark band at the bottom. One
// swappable image, per the owner's brief, controls the whole tone of
// each season — swap /images/hero/hero-main.webp to change everything.

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink">
      <div className="relative h-[88vh] min-h-[640px] w-full">
        <Image
          src="/images/hero/hero-main.webp"
          alt="Inside the boutique — a model in coral trousers, hats and bags hanging on the brick wall behind."
          fill
          priority
          sizes="100vw"
          className="object-cover object-center animate-ken-burns"
        />
        {/* Editorial darkening — heaviest at top and very bottom for legibility,
            the middle is left alone so the gold sign reads. */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/0 via-50% to-ink/85" />

        {/* Season tag — top-left */}
        <div className="absolute left-5 top-6 z-10 flex items-center gap-3 sm:left-8 sm:top-8 lg:left-12">
          <span className="h-px w-10 bg-bone-50" />
          <span className="text-[0.7rem] uppercase tracking-widest text-bone-50/90 animate-fade-in">
            {site.season.label}
          </span>
        </div>

        {/* Top-right utility links */}
        <div className="absolute right-5 top-6 z-10 hidden items-center gap-6 text-[0.7rem] uppercase tracking-widest text-bone-50/90 sm:right-8 sm:top-8 lg:right-12 lg:flex">
          <Link href="/visit" className="link-underline">Visit the shop</Link>
          <span className="opacity-50">·</span>
          <Link href="/journal" className="link-underline">Journal</Link>
        </div>

        {/* Wordmark — anchored to the top, leaving the photo's gold sign clear */}
        <div className="absolute inset-x-0 top-[12%] z-10 flex flex-col items-center px-6 text-center sm:top-[14%]">
          <h1 className="animate-fade-up text-bone-50 [animation-delay:0.15s]">
            <span className="block font-display font-medium leading-[0.9] tracking-[0.06em] text-[3.25rem] sm:text-[5.5rem] md:text-[7.5rem] lg:text-[9.5rem]">
              NOW
              <span className="mx-3 inline-block translate-y-[0.05em] font-light text-brass-light">
                +
              </span>
              THEN
            </span>
          </h1>
        </div>

        {/* Lower content — clean dark band */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-12 pt-8 text-center sm:pb-16">
          <p className="mx-auto max-w-xl animate-fade-up font-display text-xl italic text-bone-50 [animation-delay:0.45s] sm:text-2xl md:text-3xl">
            {site.season.title}
          </p>
          <p className="mx-auto mt-4 max-w-md animate-fade-up text-sm text-bone-50/80 [animation-delay:0.6s] sm:text-base">
            {site.season.body}
          </p>
          <div className="mt-8 flex animate-fade-up justify-center gap-3 [animation-delay:0.75s]">
            <Link
              href="#featured"
              className="btn-ink bg-bone-50 text-ink hover:bg-brass hover:text-bone-50"
            >
              Shop the floor
            </Link>
            <Link
              href="/visit"
              className="btn-outline border-bone-50/40 text-bone-50 hover:bg-bone-50 hover:text-ink"
            >
              Plan a visit
            </Link>
          </div>
        </div>
      </div>

      {/* Thin metadata strip below the photo */}
      <div className="flex items-center justify-between border-y border-ink/10 bg-bone-50 px-5 py-3 text-[0.7rem] uppercase tracking-widest text-ink-muted sm:px-8 lg:px-12">
        <span>Vol. 02 — Spring on the avenue</span>
        <span className="hidden sm:inline">Scroll ↓</span>
        <span>{site.city}</span>
      </div>
    </section>
  )
}
