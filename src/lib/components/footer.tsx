import Link from "next/link"
import Wordmark from "./wordmark"
import Newsletter from "./newsletter"
import { site, primaryNav, secondaryNav } from "@/lib/content/site"

export default function Footer() {
  return (
    <footer className="mt-32 border-t border-ink/10 bg-bone-50">
      <div className="shell grid grid-cols-2 gap-x-8 gap-y-12 py-20 md:grid-cols-12">
        <div className="col-span-2 md:col-span-5">
          <Link href="/" aria-label={site.name}>
            <Wordmark size="lg" withScript />
          </Link>
          <p className="mt-8 max-w-sm font-display text-lg leading-snug text-ink-soft">
            {site.tagline}
          </p>
          <Newsletter />
        </div>

        <div className="md:col-span-3">
          <p className="eyebrow">Shop</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {primaryNav.map((l) => (
              <li key={l.href}>
                <Link className="link-underline" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow">Information</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {secondaryNav.map((l) => (
              <li key={l.href}>
                <Link className="link-underline" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow">Visit</p>
          <address className="mt-4 not-italic text-sm leading-relaxed text-ink-soft">
            {site.address}
            <br />
            <a href={`tel:${site.phone}`} className="link-underline">
              {site.phone}
            </a>
            <br />
            <a href={`mailto:${site.email}`} className="link-underline">
              {site.email}
            </a>
          </address>
          <ul className="mt-6 flex gap-4 text-[0.7rem] uppercase tracking-widest text-ink-muted">
            {site.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} className="link-underline" target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-ink/10">
        <div className="shell flex flex-col items-start justify-between gap-3 py-6 text-[0.7rem] uppercase tracking-widest text-ink-muted md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {site.name} · {site.city}
          </p>
          <p>
            Site by{" "}
            <a
              href="https://nyc.voltanpo.org"
              target="_blank"
              rel="noreferrer"
              className="link-underline text-ink-soft"
            >
              Volta NYC
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
