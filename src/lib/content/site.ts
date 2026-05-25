// Single source of truth for site copy.

export const site = {
  name: "NOW + THEN",
  // A short brand mark — used as the accent below the wordmark in places.
  mark: "Then & now",
  tagline: "An eclectic, ever-changing little shop.",
  city: "",
  // Placeholder demo address — owner should swap in the real one before launch.
  address: "123 Atelier Lane · Suite B",
  phone: "(555) 010-0148",
  email: "hello@nowandthen.shop",
  socials: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Pinterest", href: "https://pinterest.com" },
    { label: "Facebook", href: "https://facebook.com" },
  ],
  hours: [
    { d: "Wed — Sat", h: "11 — 6" },
    { d: "Sunday", h: "12 — 5" },
    { d: "Mon · Tue", h: "by appointment" },
  ],
  // Owner's brief: the hero can change seasonally.
  season: {
    label: "Spring · Vol. 02",
    title: "A room of small wonders.",
    body:
      "A working studio and storefront where new designers, vintage one-offs and small-batch finds share a rack. Pieces rotate weekly — when something speaks, take it home.",
  },
};

export type NavLink = { label: string; href: string };
export const primaryNav: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Featured", href: "/#featured" },
  { label: "Journal", href: "/journal" },
  { label: "Visit", href: "/visit" },
  { label: "About", href: "/about" },
];

export const secondaryNav: NavLink[] = [
  { label: "Shipping & Returns", href: "/policies/shipping" },
  { label: "FAQ", href: "/faq" },
  { label: "Stockists & Designers", href: "/about#designers" },
  { label: "Press", href: "/journal" },
];
