# Admin Inventory Management — Design Spec

Date: 2026-07-23

## Purpose

Give the store owner (an `admin`-role user, per the `role` column added in the auth feature) a working `/admin` area to fully manage the `public.inventory_items` table in Supabase: list, create, edit, upload photos for, bulk-update the status of, and delete inventory items.

**Important context:** the live storefront (`/shop`, `/collections`, etc.) currently reads product data from a static file, `src/lib/content/products.ts` — it does NOT read from `inventory_items`. This feature manages `inventory_items` in isolation; wiring the storefront to read live from Supabase is explicitly out of scope and left for a future task.

Out of scope: storefront integration, non-admin visibility of `/admin` in any form, editing `profiles`/roles from the UI (role promotion stays a manual SQL operation, per the auth feature's design), soft-delete/undo.

## Current State (verified against the live database)

- `public.inventory_items`: RLS is enabled but **no policies exist** — the table is currently unreachable via the Data API for every role. Confirmed via `pg_policies` (0 rows).
- No Storage buckets exist yet in the project. Confirmed via `storage.buckets` (0 rows).
- `public.profiles.role` (`'customer' | 'admin'`) already exists from the auth feature, with RLS letting a user read only their own row — that's exactly what a self-referencing "am I admin" check needs.

## Approach

Server-rendered pages under `/admin`, gated by a layout that checks the signed-in user's role **server-side** and redirects before any admin markup reaches the browser. All reads/writes go through Next.js Server Actions using the user's own session (the `src/lib/supabase/server.ts` client from the auth feature — not a service-role key), so **Postgres RLS is the actual security boundary**, not just a UI check. A client-only approach (fetch everything in the browser, gate with a `useEffect` redirect) was considered and rejected: it would flash the admin shell before redirecting, and leaves the database as the only real gate with no server-side backstop — strictly worse for no benefit here.

## Database Changes

### RLS policies on `public.inventory_items`

Four policies, one per operation, all scoped `to authenticated` and all using the same admin-check:

```sql
exists (
  select 1 from public.profiles
  where id = auth.uid() and role = 'admin'
)
```

- `select`, `insert`, `update`, `delete` — admin-only, full access. No policy grants any access to `anon` or to non-admin `authenticated` users; the table stays fully locked to everyone else, matching its current (already-locked) state for non-admins.

### Storage bucket `inventory-photos`

- Private bucket (not public) — admin-only access for all operations (matches the table: no public/storefront consumption yet).
- Policies on `storage.objects` scoped to this bucket, admin-only `select`/`insert`/`update`/`delete`, using the same `profiles.role = 'admin'` check as above.
- On item delete, the Server Action also deletes that item's objects from this bucket so nothing orphans.

## Route Protection

`src/app/admin/layout.tsx` (server component):
1. Get the session via `src/lib/supabase/server.ts`'s `createClient()`.
2. Not logged in → redirect to `/login`.
3. Logged in but `profiles.role !== 'admin'` → redirect to `/`.
4. Otherwise render `children`.

This is the first real consumer of `src/lib/supabase/server.ts`, which the auth feature built but left unused.

## Pages & Data Flow

- **`/admin/inventory`** (list) — server component fetching all `inventory_items` (admin's own RLS-scoped query). Renders a client table component:
  - Columns: thumbnail (first photo), name, price (`list_price`), stock (`stock_level`), status, a checkbox column.
  - A text filter box (client-side filter by `item_name`, no server round-trip — catalog is small).
  - Bulk bar, shown only when ≥1 row is checked: "`N` selected" + a status dropdown (`draft`/`posted`/`sold out`/`archived`) + "Apply" button, calling a bulk-update Server Action. Matches the "supplier outage → pull several listings at once" use case directly.
  - "+ New Item" button → `/admin/inventory/new`.
  - Each row links to `/admin/inventory/[id]`.

- **`/admin/inventory/new`** — a thin page: on load, a Server Action immediately inserts a new row with `status: 'draft'` and minimal placeholder values (`item_name: 'Untitled item'`), then redirects to `/admin/inventory/[id]` for that new row's id. This unifies "new" and "edit" into one form/one autosave path.

- **`/admin/inventory/[id]`** (edit form) — server component fetches the one item (404-equivalent redirect to `/admin/inventory` if not found/not accessible), renders a client form component with every `inventory_items` column as a field (text/number/select/date/array-as-tags inputs as appropriate per column type), plus the photo uploader.
  - **Autosave:** field changes are debounced (~1s after the last change) and sent via a Server Action that updates the row; a small status indicator shows "Saving…" / "Saved" / "Save failed — retrying" states.
  - **Publish button:** sets `status: 'posted'` (only meaningfully different from autosave when the item is currently `draft`).
  - **Save as draft button:** explicit save-now, for users who don't trust autosave — calls the same update action immediately instead of waiting for the debounce.
  - **Delete button:** confirmation dialog, then a Server Action that deletes the row's Storage objects, then the row itself (hard delete), then redirects to `/admin/inventory`.
  - **Photo uploader:** multi-file upload to the `inventory-photos` bucket, shows uploaded photos as a thumbnail strip. Each thumbnail has an "×" to remove it and "‹"/"›" buttons to move it earlier/later in the array (no drag-and-drop — keeps this dependency-free). Updates the row's `photos` array (of Storage URLs, in display order) via the same autosave path.

## Server Actions (`src/lib/admin/inventory-actions.ts`)

- `createDraftItem()` → inserts the placeholder row, returns its id.
- `updateItem(id, fields)` → the autosave/save-draft/publish path (publish just passes `{ status: 'posted' }` as part of `fields`).
- `bulkUpdateStatus(ids, status)` → the list page's bulk action.
- `deleteItem(id)` → removes Storage objects for the item, then the row.

All four use `src/lib/supabase/server.ts`'s client, so every call is scoped by the caller's own session and RLS — there is no path in this feature that uses a service-role key.

## Visual Design

Reuse the site's existing design system so the admin area reads as part of the same product, not a bolted-on tool — but skew denser and more utilitarian, since this is a working tool, not editorial storefront content.

- **Colors:** same tokens — `ink`/`ink-soft`/`ink-muted`/`ink-faint`, `bone-50`/`100`/`200`/`300`, `brass` (primary actions — reuse `.btn-ink`/`.btn-outline`), and `clay` (`#b9492f`, already in the palette, unused so far) for destructive actions and error/save-failed states.
- **Type:** `font-display` (Fraunces) only for page-level titles ("Inventory", the item's name on the edit page), at a moderate size (not the marketing pages' 5xl/6xl hero scale — think 2xl/3xl). Everything else — table headers, labels, body, buttons — stays in the site's `font-sans` (Jost), following the existing `.eyebrow` convention (uppercase, tracked, small) for table headers and field labels. No script font, no decorative flourishes.
- **Layout:** real data-table structure (not the marketing pages' generous whitespace) — compact row height, `.rule` hairlines between rows (already in `globals.css`), `bone-200`/`bone-300` for zebra striping or the bulk-bar background, `tabular-nums` on price/stock columns like the existing cart-count badge already does.
- **Motion:** skip the marketing pages' reveal/parallax animation components (`reveal.tsx`, `parallax-image.tsx`, `ken-burns`) — admin interactions should feel immediate, not editorial. Simple opacity/color transitions only (matching `.link-underline`'s existing transition timing) for things like the autosave status indicator.
- **Retained:** the global paper-grain texture (`.grain`, applied at the `<body>` level in `layout.tsx`) stays — it's subtle and site-wide, no reason to special-case it off for `/admin`.
- The admin area does **not** use the public `Navbar`/`Footer` — it gets its own minimal chrome (a slim top bar: site wordmark linking to `/`, "Inventory" as the current section, the signed-in admin's email, a "View site" link, sign-out), styled with the same tokens.

## Error Handling

- Server Actions return `{ error: string } | { data: T }`-shaped results; the client form surfaces `error` inline (never swallowed), same pattern as the login/signup pages.
- Autosave failures show "Save failed" in the status indicator with a manual "Retry" affordance, rather than silently losing the edit.
- Photo upload failures (size/type/network) surface inline near the uploader, per-file.

## Testing

No automated test framework exists in this repo (unchanged from the auth feature). Verification is `npx tsc --noEmit` per task, plus a full manual QA pass at the end via live browser automation against the dev server and the real Supabase project:
1. Log in as a non-admin — confirm `/admin` redirects to `/`.
2. Log in as admin (after manually promoting the test account) — confirm `/admin/inventory` loads and lists the existing 5 seed rows.
3. Create a new item, confirm the draft row appears immediately, edit a few fields, confirm autosave fires (check the row in the DB), upload a photo, publish it.
4. Bulk-select 2 items, bulk-set them to `archived`, confirm both rows update.
5. Delete an item, confirm the row and its Storage objects are gone.
6. Confirm `get_advisors` (security) shows no new findings beyond what's expected for this feature.
