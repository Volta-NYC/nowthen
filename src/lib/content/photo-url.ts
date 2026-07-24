export const PHOTO_BUCKET = "inventory-photos"

/**
 * Resolve a stored `inventory_items.photos` entry to a loadable URL.
 *
 * Entries are Storage object paths in a public bucket. Absolute URLs pass
 * through unchanged so a row still holding an externally-hosted image renders
 * instead of 404ing.
 *
 * Deliberately dependency-free — both server components and the admin's client
 * components import this, and it must not pull Supabase code into the browser.
 */
export function photoUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const encoded = pathOrUrl.split("/").map(encodeURIComponent).join("/")
  return `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${encoded}`
}
