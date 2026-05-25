import PageHeading from "@/lib/components/page-heading"

export const metadata = { title: "FAQ" }

const groups = [
  {
    label: "Orders & shipping",
    qs: [
      ["When will my order ship?", "Within 1–3 business days from the shop. We ship USPS Priority. Free shipping over $150."],
      ["Do you ship internationally?", "Yes — drop us a note for a quote. We ship most places, but duties are the buyer’s responsibility."],
      ["Can I pick up in shop?", "Of course. Email us the order number and we’ll have it waiting at the counter."],
    ],
  },
  {
    label: "Returns",
    qs: [
      ["What is the return window?", "14 days from delivery on Now pieces. Then vintage and beaded one-of-ones are final sale."],
      ["How do I start a return?", "Email hello@nowandthen.shop with your order number. We’ll send a label."],
    ],
  },
  {
    label: "About the shop",
    qs: [
      ["Is everything in the online shop available in store?", "Almost — stock moves quickly. Call ahead if you’re coming for a specific piece."],
      ["Do you take in vintage?", "Sometimes, by appointment. We’re selective. We don’t do consignment but we will buy outright."],
      ["Do you ship abroad?", "See ‘Orders & shipping’ above — yes, just ask."],
    ],
  },
]

export default function FAQPage() {
  return (
    <>
      <PageHeading
        eyebrow="FAQ"
        title="A few good questions."
        lede="Anything else, please write to us — we read every note."
      />
      <section className="shell space-y-16 pb-24">
        {groups.map((g) => (
          <div key={g.label} className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <h2 className="md:col-span-4 font-display text-3xl text-ink">{g.label}</h2>
            <ul className="md:col-span-8 divide-y divide-ink/10 border-y border-ink/10">
              {g.qs.map(([q, a]) => (
                <li key={q}>
                  <details className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                      <span className="font-display text-lg">{q}</span>
                      <span className="grid h-6 w-6 place-items-center text-ink-muted transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-sm text-ink-soft">{a}</p>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </>
  )
}
