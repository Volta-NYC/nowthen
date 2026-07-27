"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { fetchCartProducts, type CartProduct } from "./cart-products"

/**
 * A bag line stores identity only — which item, in what configuration, how
 * many. Name, price, and image are resolved live from the database (see
 * `cart-products.ts`), so nothing here can go stale when an item is edited.
 */
export type CartLine = {
  itemId: string
  size?: string
  variant?: string
  qty: number
  // Added timestamp so the most-recent line shows first in the drawer.
  added: number
}

/** A line joined to its current catalog data, ready to render. */
export type ResolvedLine = CartLine & {
  product?: CartProduct
  /** True when the item is gone, archived, or sold out since being added. */
  unavailable: boolean
}

type CartContextValue = {
  lines: CartLine[]
  resolved: ResolvedLine[]
  isOpen: boolean
  add: (l: Omit<CartLine, "added" | "qty"> & { qty?: number }) => void
  remove: (idx: number) => void
  setQty: (idx: number, qty: number) => void
  clear: () => void
  open: () => void
  close: () => void
  count: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = "nowthen.cart.v2"

const sameLine = (a: Partial<CartLine>, b: Partial<CartLine>) =>
  a.itemId === b.itemId && a.size === b.size && a.variant === b.variant

const isValid = (l: CartLine) =>
  typeof l?.itemId === "string" && typeof l?.qty === "number" && l.qty > 0

function readLocal(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as CartLine[]).filter(isValid)
  } catch {
    return [] // corrupt storage — treat as empty
  }
}

function writeLocal(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  } catch {
    /* quota / private mode — silently drop persistence */
  }
}

/** Fold `incoming` into `base`, summing quantities on matching lines. */
function mergeLines(base: CartLine[], incoming: CartLine[]): CartLine[] {
  const merged = [...base]
  for (const line of incoming) {
    const idx = merged.findIndex((m) => sameLine(m, line))
    if (idx >= 0) merged[idx] = { ...merged[idx], qty: merged[idx].qty + line.qty }
    else merged.push(line)
  }
  return merged
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id ?? null

  const [lines, setLines] = useState<CartLine[]>([])
  const [isOpen, setOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [products, setProducts] = useState<Map<string, CartProduct>>(new Map())

  // Tracks which account the in-memory bag belongs to, so we can tell a real
  // sign-out from the initial null-user render and only clear on the former.
  const lastUserId = useRef<string | null | undefined>(undefined)

  // ---- guest bag: localStorage ----
  useEffect(() => {
    if (userId) return
    setLines(readLocal())
    setHydrated(true)
  }, [userId])

  useEffect(() => {
    if (userId || !hydrated) return
    writeLocal(lines)
  }, [lines, hydrated, userId])

  // ---- signed-in bag: cart_items, merging whatever was picked as a guest ----
  useEffect(() => {
    const previous = lastUserId.current
    lastUserId.current = userId

    if (!userId) {
      // Signing out empties the bag rather than leaving the account's items
      // sitting in a guest session on a possibly shared machine.
      if (previous) {
        setLines([])
        writeLocal([])
        setProducts(new Map())
      }
      return
    }

    let cancelled = false
    const supabase = createClient()

    async function sync() {
      const { data, error } = await supabase
        .from("cart_items")
        .select("inventory_item_id, size, variant, qty, added_at")
        .eq("user_id", userId)

      if (cancelled) return
      if (error) {
        console.error(`[cart] load failed: ${error.message}`)
        setHydrated(true)
        return
      }

      const saved: CartLine[] = (
        data as {
          inventory_item_id: string
          size: string | null
          variant: string | null
          qty: number
          added_at: string
        }[]
      ).map((r) => ({
        itemId: r.inventory_item_id,
        size: r.size ?? undefined,
        variant: r.variant ?? undefined,
        qty: r.qty,
        added: new Date(r.added_at).getTime(),
      }))

      const guest = readLocal()
      const merged = guest.length > 0 ? mergeLines(saved, guest) : saved

      if (guest.length > 0) {
        // Push the merged result back so the account owns it, then drop the
        // guest copy — it must not resurface on the next sign-out.
        const rows = merged.map((l) => ({
          user_id: userId,
          inventory_item_id: l.itemId,
          size: l.size ?? null,
          variant: l.variant ?? null,
          qty: l.qty,
        }))
        const { error: upsertError } = await supabase
          .from("cart_items")
          .upsert(rows, { onConflict: "user_id,inventory_item_id,size,variant" })
        if (upsertError) console.error(`[cart] merge failed: ${upsertError.message}`)
        writeLocal([])
      }

      if (!cancelled) {
        setLines(merged)
        setHydrated(true)
      }
    }

    sync()
    return () => {
      cancelled = true
    }
  }, [userId])

  // ---- resolve live product data for whatever is in the bag ----
  const itemIds = useMemo(
    () => Array.from(new Set(lines.map((l) => l.itemId))).sort().join(","),
    [lines],
  )

  useEffect(() => {
    if (!itemIds) {
      setProducts(new Map())
      return
    }
    let cancelled = false
    fetchCartProducts(itemIds.split(",")).then((map) => {
      if (!cancelled) setProducts(map)
    })
    return () => {
      cancelled = true
    }
  }, [itemIds])

  // ---- persistence for signed-in mutations ----
  const persist = useCallback(
    async (line: CartLine, qty: number) => {
      if (!userId) return
      const supabase = createClient()
      if (qty <= 0) {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", userId)
          .eq("inventory_item_id", line.itemId)
          .match({ size: line.size ?? null, variant: line.variant ?? null })
        if (error) console.error(`[cart] remove failed: ${error.message}`)
        return
      }
      const { error } = await supabase.from("cart_items").upsert(
        {
          user_id: userId,
          inventory_item_id: line.itemId,
          size: line.size ?? null,
          variant: line.variant ?? null,
          qty,
        },
        { onConflict: "user_id,inventory_item_id,size,variant" },
      )
      if (error) console.error(`[cart] save failed: ${error.message}`)
    },
    [userId],
  )

  const add: CartContextValue["add"] = useCallback(
    (l) => {
      const qty = l.qty ?? 1
      setLines((prev) => {
        const idx = prev.findIndex((p) => sameLine(p, l))
        if (idx >= 0) {
          const next = [...prev]
          const updated = { ...next[idx], qty: next[idx].qty + qty }
          next[idx] = updated
          persist(updated, updated.qty)
          return next
        }
        const created = { ...l, qty, added: Date.now() }
        persist(created, qty)
        return [created, ...prev]
      })
      setOpen(true)
    },
    [persist],
  )

  const remove = useCallback(
    (idx: number) => {
      setLines((prev) => {
        const target = prev[idx]
        if (target) persist(target, 0)
        return prev.filter((_, i) => i !== idx)
      })
    },
    [persist],
  )

  const setQty = useCallback(
    (idx: number, qty: number) => {
      setLines((prev) => {
        const target = prev[idx]
        if (!target) return prev
        persist(target, qty)
        if (qty <= 0) return prev.filter((_, i) => i !== idx)
        const next = [...prev]
        next[idx] = { ...target, qty }
        return next
      })
    },
    [persist],
  )

  const clear = useCallback(async () => {
    setLines([])
    if (!userId) return
    const supabase = createClient()
    const { error } = await supabase.from("cart_items").delete().eq("user_id", userId)
    if (error) console.error(`[cart] clear failed: ${error.message}`)
  }, [userId])

  const resolved = useMemo<ResolvedLine[]>(
    () =>
      lines.map((l) => {
        const product = products.get(l.itemId)
        return { ...l, product, unavailable: !product }
      }),
    [lines, products],
  )

  // Unavailable lines contribute nothing — you can't be charged for a piece
  // that is no longer for sale.
  const subtotal = useMemo(
    () => resolved.reduce((sum, l) => sum + (l.product ? l.product.price * l.qty : 0), 0),
    [resolved],
  )
  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const value: CartContextValue = {
    lines,
    resolved,
    isOpen,
    add,
    remove,
    setQty,
    clear,
    open: () => setOpen(true),
    close: () => setOpen(false),
    count,
    subtotal,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>")
  return ctx
}
