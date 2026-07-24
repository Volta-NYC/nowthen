import PageHeading from "@/lib/components/page-heading"
import ShopGrid from "@/lib/components/shop-grid"
import { getProducts } from "@/lib/content/products-db"

export const metadata = { title: "Shop" }

// Re-read the catalog at most once a minute; admin edits also revalidate
// these paths explicitly, so this is just a backstop.
export const revalidate = 60

export default async function ShopPage() {
  const items = await getProducts()

  return (
    <>
      <PageHeading
        eyebrow="The Whole Shop"
        title="Everything on the floor."
        lede="Browse the room, filter by mood, and follow a piece into its full story. New things land most weeks."
      />
      <ShopGrid items={items} />
    </>
  )
}
