# DB-Backed Storefront — Design Spec

Date: 2026-07-24

## Purpose

Make `public.inventory_items` the single source of truth for the storefront. Today `/shop`, `/collections`, `/shop/[slug]`, the home featured grid, and the cart all read a static file, `src/lib/content/products.ts`, while the `/admin` area (built in the previous feature) edits a database table nothing renders. This feature closes that gap: the 37 catalog entries move into Postgres, the storefront reads live, and editing an item in `/admin` changes the live site.

Out of scope: order/checkout persistence (checkout stays client-side), a public product search, and image resizing/CDN transforms.

## Current State (verified against the live database)

- `public.inventory_items`: 28 columns, RLS enabled, 4 admin-only policies (select/insert/update/delete). **5 rows**, all `status = 'draft'` — these are the owner's real vintage stock, not test data.
- Those 5 rows' `photos` arrays hold **Google Drive share links** (`.../view?usp=drive_link`), which are HTML viewer pages, not images — they cannot render in an `<img>` tag. Verified the underlying files are publicly fetchable via `drive.google.com/uc?export=download&id=…`.
- Storage bucket `inventory-photos` exists and is **private**, with 4 admin-only policies on `storage.objects`.
- `public.profiles`: 1 row, `henryozhao@gmail.com`, `role = 'admin'`, email confirmed.
- Migrations applied: `create_inventory_items`, `create_profiles_table`, `admin_inventory_rls_and_storage`.
- `src/lib/content/products.ts`: 37 products, 45 distinct images under `public/images/products/`, all files present.

## Two Catalogs

The 37 `products.ts` entries are mockup content built from the owner's inspiration PDF (designer boutique pieces — Seek Collective, Atelier Two, D.S. & Durga — with curatorial copy). The 5 DB rows are real thrifted vintage. Both land in one table:

- The 37 import as `status = 'posted'`, preserving exactly what the live site renders today.
- The 5 stay `status = 'draft'`, admin-visible only, until the owner finishes them.

This keeps one editable surface while letting demo content be archived from `/admin` as real stock replaces it.

## Data Model

Extend `inventory_items` rather than adding a second table: one row = one garment = one shop listing, so the existing admin form and Server Actions keep working.

Existing columns absorb what they can:

| products.ts field | column |
|---|---|
| `name` | `item_name` |
| `designer` | `brand` |
| `price` | `list_price` |
| `story` | `description` |
| `images` | `photos` |

Eleven new columns cover the rest:

| column | type | notes |
|---|---|---|
| `slug` | `text unique` | URL key for `/shop/[slug]`; nullable so admin-created drafts don't collide before naming |
| `collections` | `text[]` | `now`/`then`/`ready-to-wear`/`objects`/`jewelry`/`fragrance` |
| `era` | `text` | check `in ('now','then')`, nullable |
| `palette` | `text[]` | hex chips — distinct from `main_color`, which holds color *names* |
| `blurb` | `text` | short line on cards |
| `details` | `text[]` | bullet list on the product page |
| `sizes` | `text[]` | distinct from `listed_size`, which is a single value |
| `variants` | `jsonb` | `[{label, value}]`; 1 product uses it |
| `from_price` | `boolean default false` | renders "from $X" |
| `featured` | `boolean default false` | home grid membership |
| `home_grid_position` | `integer` | replaces the hardcoded `homeGridOrder` array |

## Photos

`inventory-photos` becomes **public-read, admin-write**. The storefront needs stable, cacheable, crawlable image URLs; signed URLs expire and defeat both caching and SEO. Writes stay gated by the existing admin-only RLS policies.

Two migrations of image data, after which `photos` holds Storage object paths **only** — one format everywhere:

1. 45 files from `public/images/products/` → `{slug}/{filename}`.
2. 14 Drive-hosted images across the 5 real items → downloaded, then uploaded to `{item-id}/{nn}-{name}.webp`.

Accepted tradeoff: a public bucket means photos attached to `draft` items are readable by anyone holding the URL. Paths are UUID- or slug-scoped and unlisted, and the rows themselves stay private, so this exposes an image but never unreleased pricing or inventory data.

`public/images/products/` stays in the repo after the upload — deleting it is a separate cleanup once the DB path is proven in production.

## Access Control

One new policy on `inventory_items`:

```sql
create policy "Public can view posted items"
  on public.inventory_items
  for select
  to anon, authenticated
  using (status = 'posted');
```

Policies are OR'd, so: `anon` sees posted only; a signed-in non-admin sees posted only; an admin still sees everything via the existing admin policy. Draft, sold-out, and archived rows never reach the public storefront.

## Architecture

`src/lib/content/products-db.ts` is the single boundary between the DB and the storefront. It exports the same shapes the site already imports, so no consuming component changes its contract:

- `dbItemToProduct(row): Product` — the adapter. Maps columns back onto the existing `Product` type and resolves `photos` to public URLs.
- `getProducts()`, `findProduct(slug)`, `productsByCollection(col)`, `getFeatured()`, `getHomeGrid()` — async, server-side, querying posted items.

The `Product` type moves to `src/lib/content/product-types.ts` (no DB imports) so client components can import the type without pulling in server code.

Data flow: server components (`/shop`, `/collections`, `/shop/[slug]`, home) call these helpers directly and pass plain `Product` objects into existing client components. No client component queries Supabase.

## Cart

`cart-context.tsx` is a client component that currently calls `findProduct(slug)` synchronously on every render to resolve names, prices, and images from the static import. That cannot survive the cutover.

Cart items carry a **snapshot** taken at add-to-cart time — `{ slug, name, price, image, size }` — instead of re-deriving from a lookup. This is the correct model regardless of the DB migration: a cart should record what the customer saw and agreed to, not silently repriced current values. `localStorage` carts from the old shape are migrated on read; entries that can't be upgraded are dropped rather than rendered blank.

## Error Handling

- Storefront queries that fail render an empty state, not a crash; the error is logged server-side. A failed catalog fetch must never take down the page shell.
- `/shop/[slug]` calls `notFound()` when a slug is missing or the item isn't posted — the same 404 path the static version used.
- The import script is idempotent: re-running it upserts on `slug` rather than duplicating rows, so a partial failure can be re-run safely.
- Image upload failures during import are reported per-file and do not abort the remaining uploads; the script exits non-zero if any file failed.

## Testing

No automated test framework exists in this repo. Verification is `npx tsc --noEmit` per step, direct SQL assertions against the live project after each migration and the import, plus a manual pass:

1. `/shop` lists 37 items with working images; counts match `products.ts`.
2. `/shop/two-tone-pants` renders name, price, story, details, sizes, palette, and both images.
3. `/collections/jewelry` returns the same 8 items it does today.
4. Home featured grid renders in the same curated order.
5. Add to cart, reload the page, confirm the snapshot persists and prices are intact.
6. In `/admin`, change an item's name and set it to `archived`; confirm it disappears from `/shop`.
7. Confirm the 5 real vintage items appear in `/admin` with working thumbnails and are absent from `/shop`.
8. Signed out, query `inventory_items` with the anon key and confirm only posted rows return.
