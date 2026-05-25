"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { findProduct } from "@/lib/content/products"

export type CartLine = {
  slug: string
  size?: string
  variant?: string
  qty: number
  // Added timestamp so the most-recent line shows first in the drawer.
  added: number
}

type CartState = {
  lines: CartLine[]
  isOpen: boolean
}

type CartContextValue = CartState & {
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
const STORAGE_KEY = "nowthen.cart.v1"

// Stable key for a (slug, size, variant) tuple so re-adding the same
// configuration increments qty instead of creating a duplicate row.
const sameLine = (a: Partial<CartLine>, b: Partial<CartLine>) =>
  a.slug === b.slug && a.size === b.size && a.variant === b.variant

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [isOpen, setOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage exactly once. We deliberately don't render
  // cart-dependent UI server-side — the navbar count waits on hydration.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setLines(JSON.parse(raw) as CartLine[])
    } catch {
      /* corrupt storage — treat as empty */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* quota / private mode — silently drop persistence */
    }
  }, [lines, hydrated])

  const add: CartContextValue["add"] = useCallback((l) => {
    setLines((prev) => {
      const idx = prev.findIndex((p) => sameLine(p, l))
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + (l.qty ?? 1) }
        return next
      }
      return [{ ...l, qty: l.qty ?? 1, added: Date.now() }, ...prev]
    })
    setOpen(true)
  }, [])

  const remove = useCallback((idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const setQty = useCallback((idx: number, qty: number) => {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((_, i) => i !== idx)
      const next = [...prev]
      next[idx] = { ...next[idx], qty }
      return next
    })
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const p = findProduct(l.slug)
        return sum + (p ? p.price * l.qty : 0)
      }, 0),
    [lines],
  )
  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines])

  // Close on Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const value: CartContextValue = {
    lines,
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
