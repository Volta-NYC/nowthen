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
