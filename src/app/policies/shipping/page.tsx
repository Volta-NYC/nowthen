import PageHeading from "@/lib/components/page-heading"

export const metadata = { title: "Shipping & Returns" }

export default function ShippingPage() {
  return (
    <>
      <PageHeading
        eyebrow="Policy"
        title="Shipping & returns"
        lede="Plain talk on how things get to you, and how to send them back."
      />
      <section className="shell prose grid max-w-none grid-cols-1 gap-12 pb-24 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-4">
          <h2 className="font-display text-2xl">Shipping</h2>
        </div>
        <div className="md:col-span-8 text-ink-soft space-y-4">
          <p>Orders ship from the shop within 1–3 business days, USPS Priority. Free shipping on US orders over $150.</p>
          <p>International shipping by quote — write to us with your address and we’ll send a fair rate. Duties are the buyer’s responsibility.</p>
          <p>Local? Choose “Pick up in shop” at checkout and we’ll hold your order for up to 7 days.</p>
        </div>

        <div className="md:col-span-4">
          <h2 className="font-display text-2xl">Returns</h2>
        </div>
        <div className="md:col-span-8 text-ink-soft space-y-4">
          <p>Now pieces may be returned within 14 days of delivery, unworn and with tags. Email <a href="mailto:hello@nowandthen.shop" className="link-underline">hello@nowandthen.shop</a> with your order number to start.</p>
          <p>Then vintage and beaded one-of-ones are final sale. We photograph each piece carefully and describe condition honestly — please ask any question before purchase and we’ll do our best to help.</p>
        </div>

        <div className="md:col-span-4">
          <h2 className="font-display text-2xl">Care</h2>
        </div>
        <div className="md:col-span-8 text-ink-soft space-y-4">
          <p>Naturally dyed pieces are best washed cold, by hand, and dried flat in the shade. Beaded objects should be stored flat — never hung — and brushed clean with a soft cloth.</p>
        </div>
      </section>
    </>
  )
}
