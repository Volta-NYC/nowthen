"use client"

import { useState } from "react"
import PageHeading from "@/lib/components/page-heading"
import { site } from "@/lib/content/site"

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  return (
    <>
      <PageHeading
        eyebrow="Get in touch"
        title="Write to the shop."
        lede="For appointments, designer inquiries, vintage submissions, press — or just to say hello."
      />
      <section className="shell grid grid-cols-1 gap-12 pb-24 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-5">
          <p className="eyebrow">By post</p>
          <address className="mt-3 not-italic text-ink-soft">{site.address}</address>
          <p className="eyebrow mt-10">By phone</p>
          <p className="mt-3 text-ink-soft">
            <a href={`tel:${site.phone}`} className="link-underline">{site.phone}</a>
          </p>
          <p className="eyebrow mt-10">By email</p>
          <p className="mt-3 text-ink-soft">
            <a href={`mailto:${site.email}`} className="link-underline">{site.email}</a>
          </p>
          <p className="eyebrow mt-10">In person</p>
          <ul className="mt-3 space-y-1 text-ink-soft">
            {site.hours.map((h) => (
              <li key={h.d}>
                <span className="text-[0.7rem] uppercase tracking-widest text-ink-muted">{h.d}</span>{" — "}{h.h}
              </li>
            ))}
          </ul>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true) }}
          className="md:col-span-7 space-y-6"
        >
          <Field label="Name" name="name" required />
          <Field label="Email" name="email" type="email" required />
          <Field label="Subject" name="subject" />
          <Field label="Message" name="message" textarea required />
          {sent ? (
            <p className="rounded-sm bg-ink px-6 py-4 text-bone-50">
              Thank you — we’ll write back shortly.
            </p>
          ) : (
            <button className="btn-ink w-full md:w-auto">Send the note →</button>
          )}
        </form>
      </section>
    </>
  )
}

function Field({
  label,
  name,
  type = "text",
  required,
  textarea,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  textarea?: boolean
}) {
  const cls = "peer block w-full border-b border-ink/30 bg-transparent py-3 text-ink placeholder-transparent focus:border-ink focus:outline-none"
  return (
    <label className="relative block">
      {textarea ? (
        <textarea name={name} required={required} rows={5} placeholder=" " className={cls} />
      ) : (
        <input name={name} type={type} required={required} placeholder=" " className={cls} />
      )}
      <span className="pointer-events-none absolute left-0 top-0 origin-left -translate-y-3 text-[0.7rem] uppercase tracking-widest text-ink-muted transition-all peer-placeholder-shown:translate-y-3 peer-placeholder-shown:text-sm peer-placeholder-shown:tracking-normal peer-focus:-translate-y-3 peer-focus:text-[0.7rem] peer-focus:tracking-widest peer-focus:text-ink">
        {label}
      </span>
    </label>
  )
}
