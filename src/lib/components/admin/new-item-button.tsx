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
    if (result.error !== undefined) {
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
