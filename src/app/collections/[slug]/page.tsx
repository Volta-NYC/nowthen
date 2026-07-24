import { notFound } from "next/navigation"
import PageHeading from "@/lib/components/page-heading"
import ShopGrid from "@/lib/components/shop-grid"
import { collections } from "@/lib/content/collections"
import { getProducts } from "@/lib/content/products-db"

export const revalidate = 60

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
  // The whole catalog, not just this collection: the grid's filter chips let
  // you switch rooms without a page load, which needs everything in hand.
  const items = await getProducts()
  return (
    <>
      <PageHeading
        eyebrow={`Collection · ${c.name}`}
        title={c.name}
        lede={c.blurb}
      />
      <ShopGrid items={items} initialFilter={c.slug} hideControls={false} />
    </>
  )
}
