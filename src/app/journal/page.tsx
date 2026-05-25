import Image from "next/image"
import PageHeading from "@/lib/components/page-heading"
import { journal } from "@/lib/content/journal"

export const metadata = { title: "Journal" }

export default function JournalPage() {
  return (
    <>
      <PageHeading
        eyebrow="Field notes"
        title="Journal"
        lede="Letters from the shop floor — short pieces on the makers, the city, and what we’ve learned about beading a tiger over a slow week."
      />
      <section className="shell grid grid-cols-1 gap-16 pb-20 md:grid-cols-12 md:gap-12">
        {journal.map((j, i) => (
          <article
            id={j.slug}
            key={j.slug}
            className={`md:col-span-12 grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12 ${i % 2 ? "md:[&>figure]:order-2" : ""}`}
          >
            <figure className="md:col-span-6">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={j.cover}
                  alt={j.title}
                  fill
                  sizes="(min-width:768px) 50vw, 95vw"
                  className="object-cover"
                />
              </div>
            </figure>
            <div className="md:col-span-6 md:flex md:flex-col md:justify-center">
              <p className="text-[0.7rem] uppercase tracking-widest text-ink-muted">
                {j.date} · {j.read} read · Issue {String(journal.length - i).padStart(2, "0")}
              </p>
              <h2 className="mt-4 font-display text-3xl leading-snug sm:text-4xl">{j.title}</h2>
              <p className="mt-5 text-ink-soft">{j.dek}</p>
              <button className="mt-8 self-start text-[0.72rem] uppercase tracking-widest text-ink link-underline">
                Read the entry →
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}
