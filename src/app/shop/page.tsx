import PageHeading from "@/lib/components/page-heading"
import ShopGrid from "@/lib/components/shop-grid"

export const metadata = { title: "Shop" }

export default function ShopPage() {
  return (
    <>
      <PageHeading
        eyebrow="The Whole Shop"
        title="Everything on the floor."
        lede="Browse the room, filter by mood, and follow a piece into its full story. New things land most weeks."
      />
      <ShopGrid />
    </>
  )
}
