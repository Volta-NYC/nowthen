const SETUP_HINT =
  "Set it in .env.local for local development, and in your host's environment " +
  "variables for deploys (Vercel: Settings → Environment Variables → " +
  "Production/Preview/Development), then trigger a fresh build. NEXT_PUBLIC_* " +
  "values are inlined at build time, so redeploying an existing build will not " +
  "pick up a newly-added variable."

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`[supabase] Missing environment variable ${name}. ${SETUP_HINT}`)
  }
  return value
}

// Read as literals, never `process.env[name]` — Next.js only inlines
// NEXT_PUBLIC_* into client bundles when the property is accessed statically,
// so a dynamic lookup would be undefined in the browser no matter what's set.
//
// These are functions rather than module constants so a missing variable
// surfaces where the client is actually built, naming the variable, instead of
// throwing during module evaluation with no useful stack.

export function supabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL)
}

export function supabasePublishableKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
}
