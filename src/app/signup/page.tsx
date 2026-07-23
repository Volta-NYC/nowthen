"use client"

import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <section className="shell flex min-h-[70vh] flex-col items-center justify-center text-center">
        <p className="eyebrow">Account</p>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl">
          Check your email
        </h1>
        <p className="mt-6 max-w-md text-ink-soft">
          We sent a confirmation link to {email}. Click it to activate your
          account, then log in.
        </p>
        <Link href="/login" className="btn-ink mt-10">
          Back to login
        </Link>
      </section>
    )
  }

  return (
    <section className="shell flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="eyebrow">Account</p>
      <h1 className="mt-4 font-display text-5xl sm:text-6xl">
        Create an account
      </h1>

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
            minLength={6}
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="link-underline text-ink">
          Log in
        </Link>
      </p>
    </section>
  )
}
