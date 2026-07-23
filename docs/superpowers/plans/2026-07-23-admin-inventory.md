# Admin Inventory Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/admin` area where an `admin`-role user can list, create, edit (with photo upload), bulk-status-update, and delete rows in `public.inventory_items`, per `docs/superpowers/specs/2026-07-23-admin-inventory-design.md`.

**Architecture:** Server-rendered pages under `/admin`, gated by a server-side layout that checks `profiles.role` and redirects before any admin markup reaches the browser. All reads/writes go through Next.js Server Actions using the signed-in user's own session (`src/lib/supabase/server.ts`, from the auth feature) — Postgres RLS is the real security boundary, not a UI check. Photo upload/reorder/remove talks to Supabase Storage directly from a client component using the browser client, since those are per-file interactive operations; the resulting path list is just another autosaved form field.

**Tech Stack:** Next.js 16.1.6 (App Router, Server Actions), TypeScript, Supabase (Postgres RLS + Storage), same Supabase project as the auth feature (`eywvykiahczpaxplvuum`).

## Global Constraints

- Reuse `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts` from the auth feature — do not recreate them.
- Server-side code must use `supabase.auth.getClaims()`, never trust `getSession()` in server code (client-side `getSession()`/`onAuthStateChange` remains fine, per the auth feature's own constraint).
- Project ID: `eywvykiahczpaxplvuum`.
- Admin-check SQL pattern, reused verbatim in every new RLS policy: `exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')`.
- No `service_role`/`sb_secret_*` key anywhere in this feature — every Server Action and client call uses the caller's own session, so RLS actually gates access.
- `photos` on `inventory_items` stores Supabase Storage **object paths** (e.g. `{itemId}/{timestamp}-{filename}`), never public URLs — the `inventory-photos` bucket is private; thumbnails are rendered via short-lived signed URLs generated client-side.
- No drag-and-drop library — photo reordering uses simple ‹ / › buttons.
- Visual design must match `docs/superpowers/specs/2026-07-23-admin-inventory-design.md`'s "Visual Design" section exactly: reuse `ink`/`ink-soft`/`ink-muted`/`ink-faint`, `bone-50`/`100`/`200`/`300`, `brass`, and `clay` (`#b9492f`, for destructive/error states) from `tailwind.config.ts`; reuse `.eyebrow`/`.btn-ink`/`.btn-outline`/`.rule`/`.link-underline` from `globals.css`; `font-display` (Fraunces) only for page-level titles at moderate size (2xl/3xl, not the marketing pages' 5xl/6xl); everything else in `font-sans` (Jost); `tabular-nums` on price/stock columns; no reveal/parallax animation components.
- `/admin/*` routes must NOT render the public `Navbar`, `Footer`, `CartDrawer`, or `ScrollProgress` — they get their own minimal top bar.
- No automated test framework exists in this repo — verification is `npx tsc --noEmit` per task plus a final manual QA pass (Task 7) via live browser automation against the dev server and the real Supabase project.
- Native `window.confirm` is acceptable for the single delete-confirmation dialog (deliberately simple, admin-only tool) — but errors are always shown inline in the UI, never via `window.alert`, matching the login/signup pages' convention.

---

### Task 1: Database — RLS policies for `inventory_items` and the `inventory-photos` Storage bucket

**Files:**
- Database migration only (no repo files) — applied via the Supabase MCP tool `mcp__claude_ai_Supabase__apply_migration`.

**Interfaces:**
- Produces: four RLS policies on `public.inventory_items` (select/insert/update/delete, admin-only), a private Storage bucket `inventory-photos`, and four matching RLS policies on `storage.objects` scoped to that bucket (admin-only).

- [ ] **Step 1: Apply the migration**

Call `mcp__claude_ai_Supabase__apply_migration` with `project_id: "eywvykiahczpaxplvuum"`, `name: "admin_inventory_rls_and_storage"`, and this SQL:

```sql
create policy "Admins can select inventory_items"
  on public.inventory_items
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert inventory_items"
  on public.inventory_items
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update inventory_items"
  on public.inventory_items
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete inventory_items"
  on public.inventory_items
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

insert into storage.buckets (id, name, public)
values ('inventory-photos', 'inventory-photos', false);

create policy "Admins can select inventory-photos objects"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'inventory-photos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert inventory-photos objects"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'inventory-photos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update inventory-photos objects"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'inventory-photos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    bucket_id = 'inventory-photos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete inventory-photos objects"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'inventory-photos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
```

- [ ] **Step 2: Run the security advisor**

Call `mcp__claude_ai_Supabase__get_advisors` with `project_id: "eywvykiahczpaxplvuum"`, `type: "security"`.
Expected: no new findings referencing `public.inventory_items` or the `inventory-photos` bucket/policies (RLS is enabled with policies on both). The two pre-existing WARN findings on `handle_new_user()` from the auth feature are expected and already triaged as false positives — not a concern here.

- [ ] **Step 3: Verify with a direct query**

Call `mcp__claude_ai_Supabase__execute_sql` with `project_id: "eywvykiahczpaxplvuum"`:

```sql
select policyname, cmd, roles from pg_policies where tablename = 'inventory_items' order by cmd;
select policyname, cmd from pg_policies where tablename = 'objects' and schemaname = 'storage' order by cmd;
select id, public from storage.buckets where id = 'inventory-photos';
```

Expected: 4 rows for `inventory_items` (select/insert/update/delete, each `roles = {authenticated}`), 4 rows for `storage.objects` policies, and one `inventory-photos` bucket row with `public = false`.

---

### Task 2: Site chrome split and admin route protection

**Files:**
- Create: `src/lib/components/site-chrome.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/lib/components/admin/admin-topbar.tsx`
- Create: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server` (async, existing), `createClient()` from `@/lib/supabase/client` (existing).
- Produces: `SiteChrome` (client component wrapping the public Navbar/Footer/CartDrawer, hidden on `/admin/*`), `AdminTopbar` (client component, consumed only by `src/app/admin/layout.tsx`).

The public root layout currently renders `<Navbar />`/`<Footer />`/`<CartDrawer />`/`<ScrollProgress />` unconditionally for every route, including future `/admin/*` routes, since Next.js always wraps the whole app in the root layout. This task moves that chrome into a pathname-aware client component so `/admin/*` gets none of it, then adds the actual `/admin` route-protection layout with its own top bar.

- [ ] **Step 1: Write the site chrome wrapper**

```typescript src/lib/components/site-chrome.tsx
"use client"

import { usePathname } from "next/navigation"
import Navbar from "./navbar"
import Footer from "./footer"
import CartDrawer from "./cart-drawer"
import ScrollProgress from "./scroll-progress"

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin") ?? false

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
    </>
  )
}
```

- [ ] **Step 2: Update the root layout to use it**

Modify `src/app/layout.tsx`. Replace the imports of `Navbar`, `Footer`, `CartDrawer`, `ScrollProgress` with a single `SiteChrome` import, and replace the body's children accordingly:

```typescript src/app/layout.tsx (diff)
 import "./globals.css"
 import type { Metadata } from "next"
 import { Fraunces, Jost, Pinyon_Script } from "next/font/google"
-import Navbar from "@/lib/components/navbar"
-import Footer from "@/lib/components/footer"
-import CartDrawer from "@/lib/components/cart-drawer"
-import ScrollProgress from "@/lib/components/scroll-progress"
+import SiteChrome from "@/lib/components/site-chrome"
 import { CartProvider } from "@/lib/cart/cart-context"
 import { AuthProvider } from "@/lib/auth/auth-context"
 import { site } from "@/lib/content/site"
```

```typescript src/app/layout.tsx (diff)
       <body className="grain min-h-screen bg-bone-100 antialiased">
         <AuthProvider>
           <CartProvider>
-            <ScrollProgress />
-            <Navbar />
-            <main>{children}</main>
-            <Footer />
-            <CartDrawer />
+            <SiteChrome>{children}</SiteChrome>
           </CartProvider>
         </AuthProvider>
       </body>
```

The rest of the file (imports of fonts, `metadata`, the `<html>` wrapper) is unchanged.

- [ ] **Step 3: Write the admin top bar**

```typescript src/lib/components/admin/admin-topbar.tsx
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AdminTopbar({ email }: { email: string }) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="border-b border-ink/10 bg-bone-100">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-lg text-ink">
            NOW + THEN
          </Link>
          <span className="text-[0.7rem] uppercase tracking-widest text-ink-muted">
            Inventory
          </span>
        </div>
        <div className="flex items-center gap-5 text-[0.7rem] uppercase tracking-widest">
          <span className="text-ink-muted">{email}</span>
          <Link href="/" className="text-ink hover:text-brass">
            View site
          </Link>
          <button type="button" onClick={handleSignOut} className="text-ink hover:text-brass">
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Write the admin layout (route protection)**

```typescript src/app/admin/layout.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminTopbar from "@/lib/components/admin/admin-topbar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) redirect("/login")

  const userId = claims.sub as string
  const email = (claims.email as string) ?? ""

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (profile?.role !== "admin") redirect("/")

  return (
    <div className="min-h-screen bg-bone-50">
      <AdminTopbar email={email} />
      <main>{children}</main>
    </div>
  )
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/site-chrome.tsx src/app/layout.tsx src/lib/components/admin/admin-topbar.tsx src/app/admin/layout.tsx
git commit -m "feat: split site chrome and add admin route protection"
```

---

### Task 3: Inventory Server Actions

**Files:**
- Create: `src/lib/admin/inventory-actions.ts`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server` (Task 2 depends on this existing already; this task uses it too).
- Produces: `InventoryStatus`, `STATUS_OPTIONS`, `InventoryItem`, `InventoryListItem`, `InventoryItemFields` types, and `createDraftItem()`, `updateItem(id, fields)`, `bulkUpdateStatus(ids, status)`, `deleteItem(id)` Server Actions — all consumed by Tasks 4–6.

- [ ] **Step 1: Write the actions module**

```typescript src/lib/admin/inventory-actions.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type InventoryStatus = "posted" | "draft" | "sold out" | "archived"

export const STATUS_OPTIONS: InventoryStatus[] = ["draft", "posted", "sold out", "archived"]

export type InventoryItem = {
  id: string
  item_number: string | null
  sku: string | null
  item_name: string
  vintage_or_upcycled: string | null
  category: string | null
  article: string | null
  brand: string | null
  season: string[] | null
  listed_size: string | null
  dimensions: string | null
  weight: string | null
  purchase_date: string | null
  purchase_location: string | null
  purchase_price: number | null
  list_price: number | null
  sale_price: number | null
  decade: string[] | null
  condition: string | null
  description: string | null
  main_color: string[] | null
  material: string[] | null
  photos: string[] | null
  stock_level: number | null
  location: string | null
  mood: string[] | null
  status: InventoryStatus
  created_at: string
}

export type InventoryListItem = Pick<
  InventoryItem,
  "id" | "item_name" | "list_price" | "stock_level" | "status" | "photos"
>

export type InventoryItemFields = Partial<Omit<InventoryItem, "id" | "created_at">>

type ActionResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

export async function createDraftItem(): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("inventory_items")
    .insert({ item_name: "Untitled item", status: "draft" })
    .select("id")
    .single()

  if (error) return { error: error.message }
  revalidatePath("/admin/inventory")
  return { data: { id: data.id as string } }
}

export async function updateItem(
  id: string,
  fields: InventoryItemFields,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const { error } = await supabase.from("inventory_items").update(fields).eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/admin/inventory")
  revalidatePath(`/admin/inventory/${id}`)
  return { data: { id } }
}

export async function bulkUpdateStatus(
  ids: string[],
  status: InventoryStatus,
): Promise<ActionResult<{ count: number }>> {
  const supabase = await createClient()
  const { error } = await supabase.from("inventory_items").update({ status }).in("id", ids)

  if (error) return { error: error.message }
  revalidatePath("/admin/inventory")
  return { data: { count: ids.length } }
}

export async function deleteItem(id: string): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()

  const { data: item, error: fetchError } = await supabase
    .from("inventory_items")
    .select("photos")
    .eq("id", id)
    .single()

  if (fetchError) return { error: fetchError.message }

  const photos = (item?.photos ?? []) as string[]
  if (photos.length > 0) {
    await supabase.storage.from("inventory-photos").remove(photos)
  }

  const { error } = await supabase.from("inventory_items").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin/inventory")
  return { data: { id } }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/admin/inventory-actions.ts
git commit -m "feat: add inventory Server Actions"
```

---

### Task 4: Inventory list page (table, filter, bulk status update, new item)

**Files:**
- Create: `src/lib/components/admin/inventory-table.tsx`
- Create: `src/lib/components/admin/new-item-button.tsx`
- Create: `src/app/admin/inventory/page.tsx`

**Interfaces:**
- Consumes: `STATUS_OPTIONS`, `InventoryListItem`, `InventoryStatus`, `bulkUpdateStatus`, `createDraftItem` from `@/lib/admin/inventory-actions` (Task 3); `createClient()` from `@/lib/supabase/server`.

- [ ] **Step 1: Write the new-item button**

Creating a new item is a client-triggered action (not a page visited via GET) so refreshing or navigating back never creates a duplicate draft.

```typescript src/lib/components/admin/new-item-button.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createDraftItem } from "@/lib/admin/inventory-actions"

export default function NewItemButton() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setCreating(true)
    setError(null)
    const result = await createDraftItem()
    if (result.error) {
      setCreating(false)
      setError(result.error)
      return
    }
    router.push(`/admin/inventory/${result.data.id}`)
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-sm text-clay">{error}</span>}
      <button
        type="button"
        onClick={handleClick}
        disabled={creating}
        className="btn-ink disabled:opacity-50"
      >
        {creating ? "Creating…" : "+ New item"}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Write the inventory table**

```typescript src/lib/components/admin/inventory-table.tsx
"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  bulkUpdateStatus,
  STATUS_OPTIONS,
  type InventoryListItem,
  type InventoryStatus,
} from "@/lib/admin/inventory-actions"

export default function InventoryTable({ items }: { items: InventoryListItem[] }) {
  const [filter, setFilter] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<InventoryStatus>(STATUS_OPTIONS[0])
  const [applying, setApplying] = useState(false)
  const [localItems, setLocalItems] = useState(items)

  const filtered = useMemo(
    () =>
      localItems.filter((item) =>
        item.item_name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [localItems, filter],
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((i) => i.id)),
    )
  }

  const applyBulk = async () => {
    if (selected.size === 0) return
    setApplying(true)
    const ids = Array.from(selected)
    const result = await bulkUpdateStatus(ids, bulkStatus)
    setApplying(false)
    if (!result.error) {
      setLocalItems((prev) =>
        prev.map((item) => (selected.has(item.id) ? { ...item, status: bulkStatus } : item)),
      )
      setSelected(new Set())
    }
  }

  return (
    <div className="mt-6">
      <input
        type="text"
        placeholder="Filter by name…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full max-w-xs border-b border-ink/30 bg-transparent py-2 text-sm placeholder:text-ink-faint focus:border-ink focus:outline-none"
      />

      {selected.size > 0 && (
        <div className="mt-4 flex items-center gap-3 bg-bone-200 px-4 py-3">
          <span className="text-[0.7rem] uppercase tracking-widest text-ink-muted">
            {selected.size} selected
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as InventoryStatus)}
            className="border border-ink/30 bg-transparent px-2 py-1 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyBulk}
            disabled={applying}
            className="btn-ink px-4 py-2 text-[0.65rem] disabled:opacity-50"
          >
            {applying ? "Applying…" : "Apply"}
          </button>
        </div>
      )}

      <table className="mt-6 w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-[0.65rem] uppercase tracking-widest text-ink-muted">
            <th className="w-8 py-2">
              <input
                type="checkbox"
                checked={filtered.length > 0 && selected.size === filtered.length}
                onChange={toggleAll}
              />
            </th>
            <th className="py-2">Name</th>
            <th className="py-2 tabular-nums">Price</th>
            <th className="py-2 tabular-nums">Stock</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.id} className="border-b border-ink/10">
              <td className="py-3">
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggle(item.id)}
                />
              </td>
              <td className="py-3">
                <Link href={`/admin/inventory/${item.id}`} className="link-underline text-ink">
                  {item.item_name}
                </Link>
              </td>
              <td className="py-3 tabular-nums">
                {item.list_price != null ? `$${item.list_price}` : "—"}
              </td>
              <td className="py-3 tabular-nums">{item.stock_level ?? "—"}</td>
              <td className="py-3">
                <span className="text-[0.65rem] uppercase tracking-widest text-ink-muted">
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-ink-muted">
                No items found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Write the list page**

```typescript src/app/admin/inventory/page.tsx
import { createClient } from "@/lib/supabase/server"
import InventoryTable from "@/lib/components/admin/inventory-table"
import NewItemButton from "@/lib/components/admin/new-item-button"
import type { InventoryListItem } from "@/lib/admin/inventory-actions"

export const metadata = { title: "Inventory" }

export default async function AdminInventoryPage() {
  const supabase = await createClient()
  const { data: items, error } = await supabase
    .from("inventory_items")
    .select("id, item_name, list_price, stock_level, status, photos")
    .order("created_at", { ascending: false })

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Inventory</h1>
        <NewItemButton />
      </div>

      {error && <p className="mt-6 text-sm text-clay">{error.message}</p>}
      {!error && <InventoryTable items={(items ?? []) as InventoryListItem[]} />}
    </div>
  )
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/admin/inventory-table.tsx src/lib/components/admin/new-item-button.tsx src/app/admin/inventory/page.tsx
git commit -m "feat: add inventory list page with filter and bulk status update"
```

---

### Task 5: Photo uploader component

**Files:**
- Create: `src/lib/components/admin/photo-uploader.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/client`.
- Produces: `PhotoUploader` component, `{ itemId: string, paths: string[], onChange: (paths: string[]) => void }` props — consumed by Task 6's `InventoryForm`.

- [ ] **Step 1: Write the photo uploader**

```typescript src/lib/components/admin/photo-uploader.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const BUCKET = "inventory-photos"

type PhotoUploaderProps = {
  itemId: string
  paths: string[]
  onChange: (paths: string[]) => void
}

export default function PhotoUploader({ itemId, paths, onChange }: PhotoUploaderProps) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function loadUrls() {
      const entries = await Promise.all(
        paths.map(async (path) => {
          const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
          return [path, data?.signedUrl ?? ""] as const
        }),
      )
      if (!cancelled) setSignedUrls(Object.fromEntries(entries))
    }

    if (paths.length > 0) loadUrls()
    else setSignedUrls({})

    return () => {
      cancelled = true
    }
  }, [paths])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError(null)
    setUploading(true)
    const supabase = createClient()
    const newPaths: string[] = []

    for (const file of Array.from(files)) {
      const path = `${itemId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
      if (uploadError) {
        setError(uploadError.message)
        continue
      }
      newPaths.push(path)
    }

    setUploading(false)
    if (newPaths.length > 0) onChange([...paths, ...newPaths])
  }

  const handleRemove = async (path: string) => {
    const supabase = createClient()
    await supabase.storage.from(BUCKET).remove([path])
    onChange(paths.filter((p) => p !== path))
  }

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= paths.length) return
    const next = [...paths]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div>
      <span className="eyebrow">Photos</span>
      <div className="mt-3 flex flex-wrap gap-3">
        {paths.map((path, i) => (
          <div key={path} className="relative h-24 w-24 border border-ink/15 bg-bone-200">
            {signedUrls[path] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signedUrls[path]} alt="" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/70 px-1 py-0.5 text-[0.6rem] text-bone-50">
              <button
                type="button"
                onClick={() => handleMove(i, -1)}
                disabled={i === 0}
                aria-label="Move earlier"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => handleRemove(path)}
                className="text-clay"
                aria-label="Remove photo"
              >
                ×
              </button>
              <button
                type="button"
                onClick={() => handleMove(i, 1)}
                disabled={i === paths.length - 1}
                aria-label="Move later"
              >
                ›
              </button>
            </div>
          </div>
        ))}
        <label className="flex h-24 w-24 cursor-pointer items-center justify-center border border-dashed border-ink/30 text-center text-[0.65rem] uppercase tracking-widest text-ink-muted hover:border-ink">
          {uploading ? "Uploading…" : "+ Add"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-clay">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/admin/photo-uploader.tsx
git commit -m "feat: add photo uploader component for inventory items"
```

---

### Task 6: Item edit page (form, autosave, publish, delete)

**Files:**
- Create: `src/lib/components/admin/inventory-form.tsx`
- Create: `src/app/admin/inventory/[id]/page.tsx`

**Interfaces:**
- Consumes: `InventoryItem`, `InventoryItemFields`, `STATUS_OPTIONS`, `updateItem`, `deleteItem` from `@/lib/admin/inventory-actions` (Task 3); `PhotoUploader` from `@/lib/components/admin/photo-uploader` (Task 5); `createClient()` from `@/lib/supabase/server`.

- [ ] **Step 1: Write the inventory form**

```typescript src/lib/components/admin/inventory-form.tsx
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {
  deleteItem,
  STATUS_OPTIONS,
  updateItem,
  type InventoryItem,
  type InventoryItemFields,
} from "@/lib/admin/inventory-actions"
import PhotoUploader from "./photo-uploader"

function arrayToText(value: string[] | null): string {
  return (value ?? []).join(", ")
}

function textToArray(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function toFields(item: InventoryItem): InventoryItemFields {
  const { id: _id, created_at: _created_at, ...rest } = item
  return rest
}

type SaveState = "idle" | "saving" | "saved" | "error"

export default function InventoryForm({ item }: { item: InventoryItem }) {
  const router = useRouter()
  const [fields, setFields] = useState<InventoryItem>(item)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const persist = async (updates: InventoryItemFields) => {
    setSaveState("saving")
    const result = await updateItem(item.id, updates)
    if (result.error) {
      setSaveState("error")
      setSaveError(result.error)
    } else {
      setSaveState("saved")
      setSaveError(null)
    }
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      persist(toFields(fields))
    }, 1000)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields])

  const set = <K extends keyof InventoryItem>(key: K, value: InventoryItem[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveDraft = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    persist(toFields(fields))
  }

  const handlePublish = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const next = { ...fields, status: "posted" as const }
    setFields(next)
    persist(toFields(next))
  }

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete "${fields.item_name}"? This cannot be undone.`)) {
      return
    }
    setDeleting(true)
    const result = await deleteItem(item.id)
    if (result.error) {
      setDeleting(false)
      setSaveError(result.error)
      setSaveState("error")
      return
    }
    router.push("/admin/inventory")
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/inventory"
            className="text-[0.7rem] uppercase tracking-widest text-ink-muted hover:text-ink"
          >
            ← Inventory
          </Link>
          <h1 className="mt-2 font-display text-3xl">{fields.item_name || "Untitled item"}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[0.7rem] uppercase tracking-widest text-ink-muted">
            {saveState === "saving" && "Saving…"}
            {saveState === "saved" && "Saved"}
            {saveState === "error" && (
              <span className="text-clay">
                Save failed
                <button type="button" onClick={handleSaveDraft} className="ml-2 underline">
                  Retry
                </button>
              </span>
            )}
          </span>
          <span className="rounded-full border border-ink/20 px-3 py-1 text-[0.65rem] uppercase tracking-widest text-ink-muted">
            {fields.status}
          </span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="eyebrow">Item name</span>
          <input
            type="text"
            value={fields.item_name}
            onChange={(e) => set("item_name", e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Item number</span>
          <input
            type="text"
            value={fields.item_number ?? ""}
            onChange={(e) => set("item_number", e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">SKU</span>
          <input
            type="text"
            value={fields.sku ?? ""}
            onChange={(e) => set("sku", e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Vintage or upcycled</span>
          <select
            value={fields.vintage_or_upcycled ?? ""}
            onChange={(e) => set("vintage_or_upcycled", e.target.value || null)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          >
            <option value="">—</option>
            <option value="V">Vintage</option>
            <option value="U">Upcycled</option>
          </select>
        </label>

        <label className="block">
          <span className="eyebrow">Category</span>
          <input
            type="text"
            value={fields.category ?? ""}
            onChange={(e) => set("category", e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Article</span>
          <input
            type="text"
            value={fields.article ?? ""}
            onChange={(e) => set("article", e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Brand</span>
          <input
            type="text"
            value={fields.brand ?? ""}
            onChange={(e) => set("brand", e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Condition</span>
          <input
            type="text"
            value={fields.condition ?? ""}
            onChange={(e) => set("condition", e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Season (comma-separated)</span>
          <input
            type="text"
            value={arrayToText(fields.season)}
            onChange={(e) => set("season", textToArray(e.target.value))}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Decade (comma-separated)</span>
          <input
            type="text"
            value={arrayToText(fields.decade)}
            onChange={(e) => set("decade", textToArray(e.target.value))}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Main color (comma-separated)</span>
          <input
            type="text"
            value={arrayToText(fields.main_color)}
            onChange={(e) => set("main_color", textToArray(e.target.value))}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Material (comma-separated)</span>
          <input
            type="text"
            value={arrayToText(fields.material)}
            onChange={(e) => set("material", textToArray(e.target.value))}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Mood (comma-separated)</span>
          <input
            type="text"
            value={arrayToText(fields.mood)}
            onChange={(e) => set("mood", textToArray(e.target.value))}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Listed size</span>
          <input
            type="text"
            value={fields.listed_size ?? ""}
            onChange={(e) => set("listed_size", e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Dimensions</span>
          <input
            type="text"
            value={fields.dimensions ?? ""}
            onChange={(e) => set("dimensions", e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Weight</span>
          <input
            type="text"
            value={fields.weight ?? ""}
            onChange={(e) => set("weight", e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Purchase date</span>
          <input
            type="date"
            value={fields.purchase_date ?? ""}
            onChange={(e) => set("purchase_date", e.target.value || null)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Purchase location</span>
          <input
            type="text"
            value={fields.purchase_location ?? ""}
            onChange={(e) => set("purchase_location", e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Purchase price</span>
          <input
            type="number"
            step="0.01"
            value={fields.purchase_price ?? ""}
            onChange={(e) =>
              set("purchase_price", e.target.value === "" ? null : Number(e.target.value))
            }
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink tabular-nums focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">List price</span>
          <input
            type="number"
            step="0.01"
            value={fields.list_price ?? ""}
            onChange={(e) =>
              set("list_price", e.target.value === "" ? null : Number(e.target.value))
            }
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink tabular-nums focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Sale price</span>
          <input
            type="number"
            step="0.01"
            value={fields.sale_price ?? ""}
            onChange={(e) =>
              set("sale_price", e.target.value === "" ? null : Number(e.target.value))
            }
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink tabular-nums focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Stock level</span>
          <input
            type="number"
            value={fields.stock_level ?? ""}
            onChange={(e) =>
              set("stock_level", e.target.value === "" ? null : Number(e.target.value))
            }
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink tabular-nums focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Location</span>
          <input
            type="text"
            value={fields.location ?? ""}
            onChange={(e) => set("location", e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Status</span>
          <select
            value={fields.status}
            onChange={(e) => set("status", e.target.value as InventoryItem["status"])}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink focus:border-ink focus:outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="eyebrow">Description</span>
          <textarea
            value={fields.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className="mt-2 w-full border border-ink/30 bg-transparent p-3 text-ink focus:border-ink focus:outline-none"
          />
        </label>

        <div className="sm:col-span-2">
          <PhotoUploader
            itemId={item.id}
            paths={fields.photos ?? []}
            onChange={(paths) => set("photos", paths)}
          />
        </div>
      </div>

      {saveError && saveState === "error" && <p className="mt-4 text-sm text-clay">{saveError}</p>}

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
        <button type="button" onClick={handlePublish} className="btn-ink">
          Publish
        </button>
        <button type="button" onClick={handleSaveDraft} className="btn-outline">
          Save as draft
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto text-[0.7rem] uppercase tracking-widest text-clay hover:underline disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete item"}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write the edit page**

```typescript src/app/admin/inventory/[id]/page.tsx
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import InventoryForm from "@/lib/components/admin/inventory-form"
import type { InventoryItem } from "@/lib/admin/inventory-actions"

export default async function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: item, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !item) notFound()

  return <InventoryForm item={item as InventoryItem} />
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/admin/inventory-form.tsx "src/app/admin/inventory/[id]/page.tsx"
git commit -m "feat: add inventory item edit form with autosave and delete"
```

---

### Task 7: Manual end-to-end verification

**Files:** none — verification only.

- [ ] **Step 1: Promote a test admin account**

Call `mcp__claude_ai_Supabase__execute_sql` with `project_id: "eywvykiahczpaxplvuum"`:

```sql
select id, email, role from public.profiles order by created_at desc limit 5;
```

Pick (or create via `/signup` + confirm, same as the auth feature's QA) a test account, then:

```sql
update public.profiles set role = 'admin' where email = '<test-account-email>' returning email, role;
```

- [ ] **Step 2: Start the dev server**

Run: `npm run dev` (background)
Expected: server starts on `http://localhost:3000` without errors.

- [ ] **Step 3: Confirm non-admins are blocked**

Log in (via `/login`) as a non-admin account (or stay logged out), navigate to `http://localhost:3000/admin/inventory`.
Expected: redirected to `/login` (logged out) or `/` (logged in, non-admin) — never see the admin UI.

- [ ] **Step 4: Confirm admin access**

Log in as the account promoted in Step 1, navigate to `/admin/inventory`.
Expected: the list page loads, no public Navbar/Footer visible, shows the 5 existing seed rows (or however many exist), with the custom `AdminTopbar`.

- [ ] **Step 5: Create, autosave, upload a photo, publish**

Click "+ New item". Expected: redirected to `/admin/inventory/<new-id>`, status badge shows "draft".
Edit the item name and a couple of other fields; wait ~2 seconds.
Expected: the save indicator shows "Saving…" then "Saved".

Call `mcp__claude_ai_Supabase__execute_sql`:
```sql
select item_name, status from public.inventory_items where id = '<new-id>';
```
Expected: `item_name` matches what you typed.

Upload one image file via the photo uploader.
Expected: a thumbnail appears.

Click "Publish".
Expected: status badge changes to "posted"; re-run the SQL check above and confirm `status = 'posted'`.

- [ ] **Step 6: Bulk status update**

Go back to `/admin/inventory`, select 2 items via their checkboxes, choose "archived" in the bulk bar, click "Apply".
Expected: both rows' status column updates to "archived" without a page reload.

- [ ] **Step 7: Delete**

Open the item created in Step 5, click "Delete item", confirm the browser dialog.
Expected: redirected to `/admin/inventory`, the item no longer appears in the list.

Call `mcp__claude_ai_Supabase__execute_sql`:
```sql
select count(*) from public.inventory_items where id = '<new-id>';
```
Expected: `0`.

- [ ] **Step 8: Confirm RLS**

Call `mcp__claude_ai_Supabase__get_advisors` with `project_id: "eywvykiahczpaxplvuum"`, `type: "security"`.
Expected: no new findings beyond the two pre-existing, already-triaged `handle_new_user()` WARNs.

- [ ] **Step 9: Clean up and stop the dev server**

Demote the test account back to `customer` if it wasn't already an admin for a real reason:
```sql
update public.profiles set role = 'customer' where email = '<test-account-email>';
```
Stop the background `npm run dev` process.

- [ ] **Step 10: Final commit check**

Run: `git status --short`
Expected: clean tree. If anything is unstaged, review and commit it with an appropriate message.
