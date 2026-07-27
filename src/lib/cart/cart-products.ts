import { createClient } from "@/lib/supabase/client"
import { photoUrl } from "@/lib/content/photo-url"

/**
 * The live display data for one bag line. Resolved from the database on every
 * load rather than stored alongside the cart, so a price, name, or photo edited
 * in /admin is reflected immediately — there is no stale copy to drift.
 */
export type CartProduct = {
  id: string
  slug: string
  name: string
  price: number
  image?: string
}

/**
 * Fetch current details for the items in a bag.
 *
 * Only `posted` items come back. An id that's missing from the result is an
 * item that was deleted, archived, or sold out while sitting in someone's bag —
 * the caller renders those lines as unavailable rather than dropping them
 * silently, which reads as a bug to the shopper.
 */
export async function fetchCartProducts(ids: string[]): Promise<Map<string, CartProduct>> {
  const resolved = new Map<string, CartProduct>()
  if (ids.length === 0) return resolved

  const supabase = createClient()
  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, slug, item_name, list_price, photos")
    .in("id", ids)
    .eq("status", "posted")

  if (error) {
    console.error(`[cart] product lookup failed: ${error.message}`)
    return resolved
  }

  for (const row of data as {
    id: string
    slug: string | null
    item_name: string
    list_price: number | string | null
    photos: string[] | null
  }[]) {
    if (!row.slug) continue
    resolved.set(row.id, {
      id: row.id,
      slug: row.slug,
      name: row.item_name,
      price: Number(row.list_price ?? 0),
      image: row.photos?.[0] ? photoUrl(row.photos[0]) : undefined,
    })
  }

  return resolved
}
