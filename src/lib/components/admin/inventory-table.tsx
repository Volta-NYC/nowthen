"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  bulkUpdateStatus,
  type InventoryListItem,
  type InventoryStatus,
} from "@/lib/admin/inventory-actions"
import { STATUS_OPTIONS } from "@/lib/admin/inventory-types"
import { createClient } from "@/lib/supabase/client"

const BUCKET = "inventory-photos"

function RowThumbnail({ photos }: { photos: string[] | null }) {
  const path = photos?.[0] ?? null
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setSignedUrl(null)
    if (!path) return

    const supabase = createClient()

    async function loadUrl() {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path!, 3600)
      if (!cancelled) setSignedUrl(data?.signedUrl ?? null)
    }

    loadUrl()

    return () => {
      cancelled = true
    }
  }, [path])

  return (
    <div className="h-10 w-10 bg-bone-200">
      {signedUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={signedUrl} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  )
}

export default function InventoryTable({ items }: { items: InventoryListItem[] }) {
  const [filter, setFilter] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<InventoryStatus>(STATUS_OPTIONS[0])
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
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
    setApplyError(null)
    const ids = Array.from(selected)
    const result = await bulkUpdateStatus(ids, bulkStatus)
    setApplying(false)
    if (result.error) {
      setApplyError(result.error)
      return
    }
    setLocalItems((prev) =>
      prev.map((item) => (selected.has(item.id) ? { ...item, status: bulkStatus } : item)),
    )
    setSelected(new Set())
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
          {applyError && <span className="text-sm text-clay">{applyError}</span>}
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
            <th className="py-2">Photo</th>
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
                <RowThumbnail photos={item.photos} />
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
              <td colSpan={6} className="py-8 text-center text-ink-muted">
                No items found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
