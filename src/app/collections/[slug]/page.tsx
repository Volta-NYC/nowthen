import { notFound } from "next/navigation"
import PageHeading from "@/lib/components/page-heading"
import ShopGrid from "@/lib/components/shop-grid"
import { collections } from "@/lib/content/collections"

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = collections.find((x) => x.slug === slug)
  return { title: c?.name ?? "Collection", description: c?.blurb }
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = collections.find((x) => x.slug === slug)
  if (!c) notFound()
  return (
    <>
      <PageHeading
        eyebrow={`Collection · ${c.name}`}
        title={c.name}
        lede={c.blurb}
      />
      <ShopGrid initialFilter={c.slug} hideControls={false} />
    </>
  )
}
