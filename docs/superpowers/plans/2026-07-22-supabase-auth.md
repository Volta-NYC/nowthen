# Supabase Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the storefront to Supabase with email/password auth (customer signup/login + a role column laying the groundwork for a future admin area), per `docs/superpowers/specs/2026-07-22-supabase-auth-design.md`.

**Architecture:** `@supabase/ssr` cookie-based sessions (browser client + server client + a Next.js Proxy that refreshes the session token on every request), a `profiles` table with RLS keyed off `auth.users`, and a small `AuthProvider` React context (mirroring the existing `CartProvider` pattern) that drives a Login/Logout indicator in the navbar.

**Tech Stack:** Next.js 16.1.6 (App Router, TypeScript), `@supabase/supabase-js`, `@supabase/ssr`, Supabase project `eywvykiahczpaxplvuum`.

## Global Constraints

- Next.js 16.1.6 uses **Proxy** (`proxy.ts`, exporting `proxy()`), not the older `middleware.ts`/`middleware()` — verified against installed version and current Supabase docs.
- Session storage is cookie-based via `@supabase/ssr` — never read/trust `auth.getSession()` in server code; use `auth.getClaims()` there instead (client-side `getSession()`/`onAuthStateChange` is fine).
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (already covered by the repo's `.env*` gitignore rule).
- Project ID: `eywvykiahczpaxplvuum`. Project URL: `https://eywvykiahczpaxplvuum.supabase.co`. Publishable key: `sb_publishable_iIQ0YdRajUS7SEagMygWZw_et5faQJH`. These are public-safe (anon/publishable) keys, not secrets.
- Email confirmation stays **on** (Supabase default) — signup shows a "check your email" state, not an immediate logged-in session.
- No Google/OAuth, no `/account` page, no admin dashboard UI in this task — only the `role` column + RLS foundation.
- No client-side path can set or change `profiles.role` — only a manually-run SQL statement can promote a user to `admin`.
- Match existing design tokens exactly: `.shell`, `.eyebrow`, `.btn-ink`, `.link-underline`, `ink`/`ink-soft`/`ink-muted`/`ink-faint`/`bone`/`brass` colors, `font-display` headings, uppercase-tracked labels, underlined transparent inputs (see `src/lib/components/newsletter.tsx`).
- No test framework exists in this repo — verification is `npx tsc --noEmit` per task plus a final manual browser QA pass (Task 9).

---

### Task 1: Install dependencies and configure environment

**Files:**
- Modify: `package.json`
- Create: `.env.local`

**Interfaces:**
- Produces: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` env vars, available via `process.env.*` to every later task.

- [ ] **Step 1: Install packages**

Run: `npm install @supabase/supabase-js @supabase/ssr`
Expected: `package.json` and `package-lock.json` updated, both packages appear under `dependencies`.

- [ ] **Step 2: Create `.env.local`**

```bash .env.local
NEXT_PUBLIC_SUPABASE_URL=https://eywvykiahczpaxplvuum.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_iIQ0YdRajUS7SEagMygWZw_et5faQJH
```

- [ ] **Step 3: Verify it's ignored by git**

Run: `git status --short`
Expected: `.env.local` does NOT appear in the output (it's covered by `.env*` in `.gitignore`). `package.json` and `package-lock.json` DO appear as modified.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @supabase/supabase-js and @supabase/ssr"
```

---

### Task 2: Supabase browser and server clients

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Task 1).
- Produces: `createClient()` from `@/lib/supabase/client` (sync, for Client Components) and `createClient()` from `@/lib/supabase/server` (async, for Server Components/Route Handlers). Both return a Supabase client typed by `@supabase/supabase-js`.

- [ ] **Step 1: Write the browser client**

```typescript src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
```

- [ ] **Step 2: Write the server client**

```typescript src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from a Server Component — safe to ignore because
            // the Proxy (Task 3) refreshes the session on every request.
          }
        },
      },
    },
  )
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/client.ts src/lib/supabase/server.ts
git commit -m "feat: add Supabase browser and server client helpers"
```

---

### Task 3: Session-refresh Proxy

**Files:**
- Create: `src/lib/supabase/proxy.ts`
- Create: `proxy.ts` (project root)

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Task 1).
- Produces: `updateSession(request: NextRequest): Promise<NextResponse>` from `@/lib/supabase/proxy`, used only by the root `proxy.ts`.

This task deliberately does **not** add route-gating (no redirect-if-logged-out): the storefront is public, and there is no protected route yet. Its only job is refreshing the session cookie so it doesn't silently expire.

- [ ] **Step 1: Write the session-refresh helper**

```typescript src/lib/supabase/proxy.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          )
        },
      },
    },
  )

  // Do not run code between createServerClient and getClaims() — a refresh
  // needs to happen on every request or sessions can randomly expire.
  await supabase.auth.getClaims()

  return supabaseResponse
}
```

- [ ] **Step 2: Wire up the root Proxy**

```typescript proxy.ts
import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

- [ ] **Step 3: Type-check and smoke-test**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run dev` (in background), then `curl -sI http://localhost:3000/ | head -1`
Expected: `HTTP/1.1 200 OK` — the Proxy runs without throwing. Stop the dev server after checking.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/proxy.ts proxy.ts
git commit -m "feat: add Supabase session-refresh proxy"
```

---

### Task 4: `profiles` table, signup trigger, and RLS

**Files:**
- Database migration only (no repo files) — applied via the Supabase MCP tool `mcp__claude_ai_Supabase__apply_migration`.

**Interfaces:**
- Produces: `public.profiles(id uuid pk, email text, role text default 'customer', created_at timestamptz)`, auto-populated on signup, readable only by its owner.

- [ ] **Step 1: Apply the migration**

Call `mcp__claude_ai_Supabase__apply_migration` with `project_id: "eywvykiahczpaxplvuum"`, `name: "create_profiles_table"`, and this SQL:

```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

grant select on public.profiles to authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

Note: no `insert`/`update`/`delete` policy is created for `authenticated` — rows are written only by the trigger (which runs as the function owner and bypasses RLS). This is intentional: it's the only way `profiles.role` can be set, so no user can self-promote to `admin`.

- [ ] **Step 2: Run the security advisor**

Call `mcp__claude_ai_Supabase__get_advisors` with `project_id: "eywvykiahczpaxplvuum"`, `type: "security"`.
Expected: no new findings referencing `public.profiles` (RLS is enabled and a policy exists, so the "RLS disabled" and "no policy" advisories should not fire for this table).

- [ ] **Step 3: Verify the trigger with a real signup**

Call `mcp__claude_ai_Supabase__execute_sql` with `project_id: "eywvykiahczpaxplvuum"` and query:

```sql
select id, email, role from public.profiles order by created_at desc limit 5;
```

Expected: empty result for now (no signups yet) — this just confirms the table is queryable. It'll be populated for real during Task 9's manual QA.

---

### Task 5: `AuthProvider` context

**Files:**
- Create: `src/lib/auth/auth-context.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/client` (Task 2).
- Produces: `AuthProvider` (wraps children) and `useAuth(): { session: Session | null, loading: boolean, signOut: () => Promise<void> }` from `@/lib/auth/auth-context`, consumed by the navbar (Task 8) and any future account UI.

- [ ] **Step 1: Write the auth context**

```typescript src/lib/auth/auth-context.tsx
"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"
import type { Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

type AuthContextValue = {
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
```

- [ ] **Step 2: Wrap the app in `AuthProvider`**

In `src/app/layout.tsx`, add the import and wrap `<CartProvider>`:

```typescript src/app/layout.tsx (diff)
 import CartDrawer from "@/lib/components/cart-drawer"
 import ScrollProgress from "@/lib/components/scroll-progress"
 import { CartProvider } from "@/lib/cart/cart-context"
+import { AuthProvider } from "@/lib/auth/auth-context"
 import { site } from "@/lib/content/site"
```

```typescript src/app/layout.tsx (diff)
       <body className="grain min-h-screen bg-bone-100 antialiased">
-        <CartProvider>
-          <ScrollProgress />
-          <Navbar />
-          <main>{children}</main>
-          <Footer />
-          <CartDrawer />
-        </CartProvider>
+        <AuthProvider>
+          <CartProvider>
+            <ScrollProgress />
+            <Navbar />
+            <main>{children}</main>
+            <Footer />
+            <CartDrawer />
+          </CartProvider>
+        </AuthProvider>
       </body>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/auth-context.tsx src/app/layout.tsx
git commit -m "feat: add AuthProvider context for session state"
```

---

### Task 6: Login page

**Files:**
- Create: `src/app/login/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/client` (Task 2).

- [ ] **Step 1: Write the login page**

```typescript src/app/login/page.tsx
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: add login page"
```

---

### Task 7: Signup page

**Files:**
- Create: `src/app/signup/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/client` (Task 2).

- [ ] **Step 1: Write the signup page**

```typescript src/app/signup/page.tsx
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/signup/page.tsx
git commit -m "feat: add signup page"
```

---

### Task 8: Navbar login/logout indicator

**Files:**
- Modify: `src/lib/components/navbar.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `@/lib/auth/auth-context` (Task 5) — `{ session, signOut }`.

Adds the indicator to both the desktop icon row (currently hidden on mobile, same treatment as the existing search icon) and the mobile drawer menu, so logged-out mobile visitors can still reach `/login`.

- [ ] **Step 1: Import `useAuth` and read session state**

At `src/lib/components/navbar.tsx:8`, after the existing `useCart` import, add:

```typescript
import { useAuth } from "@/lib/auth/auth-context"
```

At `src/lib/components/navbar.tsx:18`, after `const { count, open: openCart } = useCart()`, add:

```typescript
  const { session, signOut } = useAuth()
```

- [ ] **Step 2: Add the desktop indicator**

In the icon row at `src/lib/components/navbar.tsx:71-96`, insert a new element as the first child of `<div className="flex items-center gap-5 text-ink">`, right before the existing `<Link href="/shop" aria-label="Search the shop" ...>`:

```tsx
            {session ? (
              <div className="hidden items-center gap-3 sm:flex">
                <span className="text-[0.7rem] uppercase tracking-widest text-ink-muted">
                  {session.user.email}
                </span>
                <button
                  onClick={signOut}
                  className="text-[0.7rem] uppercase tracking-widest text-ink hover:text-brass"
                >
                  Log out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden text-[0.7rem] uppercase tracking-widest text-ink hover:text-brass sm:inline-block"
              >
                Login
              </Link>
            )}
```

- [ ] **Step 3: Add the mobile drawer indicator**

In the drawer at `src/lib/components/navbar.tsx:145-154`, right after the closing `</ul>` of the "Information" section (the one mapping `secondaryNav`) and before `<div className="rule mt-12" />`, insert:

```tsx
          <p className="eyebrow mt-12">Account</p>
          <div className="mt-4">
            {session ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-ink-soft">{session.user.email}</span>
                <button
                  onClick={() => {
                    signOut()
                    setOpen(false)
                  }}
                  className="w-fit text-sm text-ink hover:text-brass link-underline"
                >
                  Log out
                </button>
              </div>
            ) : (
              <Link
                onClick={() => setOpen(false)}
                href="/login"
                className="text-sm text-ink hover:text-brass link-underline"
              >
                Login
              </Link>
            )}
          </div>
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/navbar.tsx
git commit -m "feat: show login/logout state in navbar"
```

---

### Task 9: Manual end-to-end verification

**Files:** none — verification only.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (background)
Expected: server starts on `http://localhost:3000` without errors.

- [ ] **Step 2: Sign up a real test account**

In a browser, go to `http://localhost:3000/signup`, submit a real email you can check (e.g. xenon.jgr@gmail.com or a `+test` alias of it) and a password of 6+ characters.
Expected: page switches to "Check your email".

Call `mcp__claude_ai_Supabase__execute_sql` with `project_id: "eywvykiahczpaxplvuum"`:

```sql
select id, email, role from public.profiles order by created_at desc limit 1;
```

Expected: one row, `email` matches what you submitted, `role` is `customer`.

- [ ] **Step 3: Confirm and log in**

Click the confirmation link in the email, then go to `http://localhost:3000/login` and log in with the same credentials.
Expected: redirected to `/`, and the navbar (desktop width) now shows your email + "Log out" instead of "Login".

- [ ] **Step 4: Log out**

Click "Log out" in the navbar.
Expected: navbar reverts to showing "Login".

- [ ] **Step 5: Bad credentials**

Go to `/login` and submit an intentionally wrong password for the test account.
Expected: an inline error message appears (no crash, no blank page).

- [ ] **Step 6: Mobile drawer check**

Resize the browser to a narrow (mobile) width, open the hamburger drawer.
Expected: an "Account" section is visible with "Login" (or your email + "Log out" if still signed in), and it works the same as the desktop version.

- [ ] **Step 7: Confirm RLS**

Call `mcp__claude_ai_Supabase__get_advisors` with `project_id: "eywvykiahczpaxplvuum"`, `type: "security"` one more time.
Expected: no findings on `public.profiles`.

- [ ] **Step 8: Stop the dev server**

Stop the background `npm run dev` process.

- [ ] **Step 9: Final commit (if any stray changes)**

Run: `git status --short`
Expected: clean tree (everything was already committed per-task). If anything is unstaged, review and commit it with an appropriate message.
