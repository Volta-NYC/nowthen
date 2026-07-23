"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <section className="shell flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="eyebrow">Account</p>
      <h1 className="mt-4 font-display text-5xl sm:text-6xl">Log in</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-10 w-full max-w-sm space-y-6 text-left"
      >
        <label className="block">
          <span className="eyebrow">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="eyebrow">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
          />
        </label>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-ink w-full disabled:opacity-50"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-8 text-sm text-ink-soft">
        New here?{" "}
        <Link href="/signup" className="link-underline text-ink">
          Create an account
        </Link>
      </p>
    </section>
  )
}
