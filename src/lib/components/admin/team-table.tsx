"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { demoteToCustomer, promoteToAdmin, type TeamMember } from "@/lib/admin/team-actions"

const ROLE_BLURB: Record<TeamMember["role"], string> = {
  owner: "Full access, manages this list",
  admin: "Manages inventory",
  customer: "Shopper, no admin access",
}

export default function TeamTable({
  members,
  currentUserId,
}: {
  members: TeamMember[]
  currentUserId: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [adding, setAdding] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const staff = members.filter((m) => m.role !== "customer")

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setError(null)
    setNotice(null)

    const result = await promoteToAdmin(email)
    setAdding(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    setEmail("")
    setNotice(`${result.data.email} is now an admin.`)
    router.refresh()
  }

  const handleRemove = async (member: TeamMember) => {
    setPendingId(member.id)
    setError(null)
    setNotice(null)

    const result = await demoteToCustomer(member.id)
    setPendingId(null)

    if (!result.ok) {
      setError(result.error)
      return
    }
    setNotice(`${result.data.email} is no longer an admin.`)
    router.refresh()
  }

  return (
    <div className="mt-8">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-[0.65rem] uppercase tracking-widest text-ink-muted">
            Add an admin by email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="someone@example.com"
            className="w-72 border-b border-ink/30 bg-transparent py-2 text-sm placeholder:text-ink-faint focus:border-ink focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={adding}
          className="btn-ink px-4 py-2 text-[0.65rem] disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add admin"}
        </button>
      </form>

      <p className="mt-2 text-xs text-ink-faint">
        They need an account already — ask them to sign up first, then add them here.
      </p>

      {error && <p className="mt-4 text-sm text-clay">{error}</p>}
      {notice && <p className="mt-4 text-sm text-ink-muted">{notice}</p>}

      <table className="mt-8 w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-[0.65rem] uppercase tracking-widest text-ink-muted">
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => (
            <tr key={member.id} className="border-b border-ink/10">
              <td className="py-3">
                {member.email}
                {member.id === currentUserId && (
                  <span className="ml-2 text-[0.65rem] uppercase tracking-widest text-ink-faint">
                    You
                  </span>
                )}
              </td>
              <td className="py-3">
                <span className="text-[0.65rem] uppercase tracking-widest text-ink-muted">
                  {member.role}
                </span>
                <span className="ml-3 text-xs text-ink-faint">{ROLE_BLURB[member.role]}</span>
              </td>
              <td className="py-3 text-right">
                {member.role === "admin" ? (
                  <button
                    type="button"
                    onClick={() => handleRemove(member)}
                    disabled={pendingId === member.id}
                    className="text-[0.65rem] uppercase tracking-widest text-ink hover:text-brass disabled:opacity-50"
                  >
                    {pendingId === member.id ? "Removing…" : "Remove"}
                  </button>
                ) : (
                  <span className="text-[0.65rem] uppercase tracking-widest text-ink-faint">
                    Protected
                  </span>
                )}
              </td>
            </tr>
          ))}
          {staff.length === 0 && (
            <tr>
              <td colSpan={3} className="py-8 text-center text-ink-muted">
                No admins yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
