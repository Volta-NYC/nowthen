import { createPublicClient } from "@/lib/supabase/public"
import type { Product } from "./product-types"
import { photoUrl } from "./photo-url"

export type { Product }
export { photoUrl, PHOTO_BUCKET } from "./photo-url"

// Columns the storefront needs. Explicit rather than `*` so a future
// back-office column can't accidentally ride along into a client component.
const STOREFRONT_COLUMNS =
  "id, slug, item_name, brand, list_price, from_price, collections, era, palette, blurb, description, details, sizes, variants, featured, home_grid_position, photos"

type Row = {
  id: string
  slug: string | null
  item_name: string
  brand: string | null
  list_price: number | string | null
  from_price: boolean | null
  collections: string[] | null
  era: string | null
  palette: string[] | null
  blurb: string | null
  description: string | null
  details: string[] | null
  sizes: string[] | null
  variants: { label: string; value: string }[] | null
  featured: boolean | null
  home_grid_position: number | null
  photos: string[] | null
}

function dbItemToProduct(row: Row): Product {
  return {
    id: row.id,
    slug: row.slug!,
    name: row.item_name,
    designer: row.brand ?? undefined,
    price: Number(row.list_price ?? 0),
    fromPrice: row.from_price ?? undefined,
    collections: row.collections ?? [],
    era: row.era === "now" || row.era === "then" ? row.era : undefined,
    palette: row.palette ?? [],
    images: (row.photos ?? []).map(photoUrl),
    blurb: row.blurb ?? "",
    story: row.description ?? undefined,
    details: row.details ?? undefined,
    sizes: row.sizes ?? undefined,
    variant: row.variants ?? undefined,
    featured: row.featured ?? undefined,
  }
}

// `status = 'posted'` is filtered explicitly rather than left to RLS. The
// admin policy would otherwise expose drafts to a signed-in owner, and the
// storefront must render identically for everyone.
function postedItems() {
  return createPublicClient()
    .from("inventory_items")
    .select(STOREFRONT_COLUMNS)
    .eq("status", "posted")
    .not("slug", "is", null)
}

// A failed catalog read renders an empty shelf rather than a 500 — the page
// shell, nav, and cart must survive a database blip.
function logFailure(scope: string, error: { message: string }) {
  console.error(`[products-db] ${scope} failed: ${error.message}`)
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await postedItems()
    .order("home_grid_position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })

  if (error) {
    logFailure("getProducts", error)
    return []
  }
  return (data as unknown as Row[]).map(dbItemToProduct)
}

export async function findProduct(slug: string): Promise<Product | undefined> {
  const { data, error } = await postedItems().eq("slug", slug).maybeSingle()

  if (error) {
    logFailure(`findProduct(${slug})`, error)
    return undefined
  }
  return data ? dbItemToProduct(data as unknown as Row) : undefined
}

export async function productsByCollection(col: string): Promise<Product[]> {
  const { data, error } = await postedItems()
    .contains("collections", [col])
    .order("home_grid_position", { ascending: true, nullsFirst: false })

  if (error) {
    logFailure(`productsByCollection(${col})`, error)
    return []
  }
  return (data as unknown as Row[]).map(dbItemToProduct)
}

export async function getFeatured(): Promise<Product[]> {
  const { data, error } = await postedItems()
    .eq("featured", true)
    .order("home_grid_position", { ascending: true, nullsFirst: false })

  if (error) {
    logFailure("getFeatured", error)
    return []
  }
  return (data as unknown as Row[]).map(dbItemToProduct)
}

/** The curated home-page ordering, formerly the hardcoded `homeGridOrder`. */
export async function getHomeGrid(): Promise<Product[]> {
  const { data, error } = await postedItems()
    .not("home_grid_position", "is", null)
    .order("home_grid_position", { ascending: true })

  if (error) {
    logFailure("getHomeGrid", error)
    return []
  }
  return (data as unknown as Row[]).map(dbItemToProduct)
}

export async function getProductSlugs(): Promise<string[]> {
  const { data, error } = await createPublicClient()
    .from("inventory_items")
    .select("slug")
    .eq("status", "posted")
    .not("slug", "is", null)

  if (error) {
    logFailure("getProductSlugs", error)
    return []
  }
  return (data as { slug: string }[]).map((r) => r.slug)
}
