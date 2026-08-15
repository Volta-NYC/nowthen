"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AdminTopbar({
  email,
  isOwner,
}: {
  email: string
  isOwner: boolean
}) {
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
          <nav className="flex items-center gap-4 text-[0.7rem] uppercase tracking-widest">
            <Link href="/admin/inventory" className="text-ink-muted hover:text-brass">
              Inventory
            </Link>
            {/* Owner-only, and the /admin/team page re-checks server-side —
                hiding a link is not access control. */}
            {isOwner && (
              <Link href="/admin/team" className="text-ink-muted hover:text-brass">
                Team
              </Link>
            )}
          </nav>
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
