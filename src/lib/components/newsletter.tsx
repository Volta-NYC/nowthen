"use client"

import { useState } from "react"

export default function Newsletter() {
  const [done, setDone] = useState(false)
  if (done) {
    return (
      <p className="mt-10 max-w-md border-b border-ink/30 pb-3 text-sm text-ink-soft">
        Thank you — see you in the inbox.
      </p>
    )
  }
  return (
    <form
      className="mt-10 flex max-w-md items-center gap-3 border-b border-ink/30 pb-2"
      onSubmit={(e) => {
        e.preventDefault()
        setDone(true)
      }}
    >
      <input
        type="email"
        required
        placeholder="Your email — for new arrivals"
        className="w-full bg-transparent py-2 text-sm placeholder:text-ink-faint focus:outline-none"
      />
      <button className="text-[0.7rem] uppercase tracking-widest text-ink hover:text-brass">
        Subscribe →
      </button>
    </form>
  )
}
