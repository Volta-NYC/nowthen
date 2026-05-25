import "./globals.css"
import type { Metadata } from "next"
import { Fraunces, Jost, Pinyon_Script } from "next/font/google"
import Navbar from "@/lib/components/navbar"
import Footer from "@/lib/components/footer"
import CartDrawer from "@/lib/components/cart-drawer"
import ScrollProgress from "@/lib/components/scroll-progress"
import { CartProvider } from "@/lib/cart/cart-context"
import { site } from "@/lib/content/site"

// Display: Fraunces (variable, opsz) — characterful but workable.
// UI: Jost — geometric, light, plays well with serif headlines.
// Accent: Pinyon Script — used only as an occasional brand flourish.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
})
const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
})
const pinyon = Pinyon_Script({
  subsets: ["latin"],
  variable: "--font-pinyon",
  weight: "400",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.tagline,
  metadataBase: new URL("https://nowandthen.shop"),
  openGraph: {
    title: site.name,
    description: site.tagline,
    images: ["/images/hero/hero-main.webp"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jost.variable} ${pinyon.variable}`}
    >
      <body className="grain min-h-screen bg-bone-100 antialiased">
        <CartProvider>
          <ScrollProgress />
          <Navbar />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  )
}
