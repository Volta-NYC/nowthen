import Image from "next/image"
import Link from "next/link"
import PageHeading from "@/lib/components/page-heading"
import { site } from "@/lib/content/site"

export const metadata = { title: "Visit" }

export default function VisitPage() {
  return (
    <>
      <PageHeading
        eyebrow="Visit"
        title="Come and see us."
        lede="We’d love to meet you. The shop is small — there is usually coffee, sometimes a dog, always music."
      />

      <section className="shell grid grid-cols-1 gap-10 pb-20 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <div className="relative aspect-[5/4] overflow-hidden">
            <Image
              src="/images/hero/hero-pillows.webp"
              alt="Inside the shop — patterned pillows on a bench, brick wall, racks of dresses"
              fill
              sizes="(min-width:768px) 55vw, 95vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="md:col-span-5 md:pt-2">
          <p className="eyebrow">Hours</p>
          <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            {site.hours.map((h) => (
              <li key={h.d} className="flex items-baseline justify-between gap-6 py-3.5 text-ink-soft">
                <span className="text-[0.72rem] uppercase tracking-widest text-ink">{h.d}</span>
                <span className="font-display text-lg">{h.h}</span>
              </li>
            ))}
          </ul>

          <p className="eyebrow mt-10">Address</p>
          <address className="mt-3 not-italic text-ink-soft">
            {site.address}
          </address>

          <p className="eyebrow mt-10">Phone & email</p>
          <p className="mt-3 text-ink-soft">
            <a href={`tel:${site.phone}`} className="link-underline">{site.phone}</a>
            <br />
            <a href={`mailto:${site.email}`} className="link-underline">{site.email}</a>
          </p>

          <div className="mt-10 flex gap-3">
            <Link
              href="https://maps.google.com/?q=NOW+THEN+boutique"
              target="_blank"
              rel="noreferrer"
              className="btn-ink"
            >
              Get directions
            </Link>
            <Link href="/contact" className="btn-outline">Make an appointment</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-bone-50 py-20">
        <div className="shell grid grid-cols-1 gap-10 md:grid-cols-3">
          {[
            { eyebrow: "By appointment", title: "Private styling", body: "Tuesday afternoons and Monday evenings. Tell us about a wedding, a shoot, or a life event and we’ll pull a rack." },
            { eyebrow: "Hosted in shop", title: "Designer suppers", body: "Once a season we open the shop after dark and host a small dinner with a visiting designer." },
            { eyebrow: "Around the neighborhood", title: "Wander the block", body: "We share a block with a gallery, a bookstore and the best coffee in town. Make a day of it." },
          ].map((c) => (
            <div key={c.title}>
              <p className="eyebrow">{c.eyebrow}</p>
              <h3 className="mt-3 font-display text-2xl">{c.title}</h3>
              <p className="mt-3 text-ink-soft">{c.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
