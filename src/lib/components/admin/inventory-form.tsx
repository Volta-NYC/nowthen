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
