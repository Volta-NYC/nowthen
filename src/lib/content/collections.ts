export type Collection = {
  slug: string;
  name: string;
  blurb: string;
  cover: string;
};

export const collections: Collection[] = [
  {
    slug: "now",
    name: "Now",
    blurb: "New arrivals from a small circle of designers we love.",
    cover: "/images/products/floral-jumpsuit.webp",
  },
  {
    slug: "then",
    name: "Then",
    blurb: "Vintage and one-of-a-kind finds, ushered into a new life.",
    cover: "/images/products/vintage-green-dress.webp",
  },
  {
    slug: "ready-to-wear",
    name: "Ready-to-Wear",
    blurb: "Jumpsuits, dresses, tailored trousers, easy layers.",
    cover: "/images/products/denim-jumpsuit.webp",
  },
  {
    slug: "objects",
    name: "Beaded Objects",
    blurb: "Hand-beaded brooches, clutches & ornaments from our atelier.",
    cover: "/images/products/jaguar-necklace.webp",
  },
  {
    slug: "jewelry",
    name: "Jewelry",
    blurb: "Statement necklaces, chandelier earrings, vintage trinkets.",
    cover: "/images/products/bib-necklace.webp",
  },
  {
    slug: "fragrance",
    name: "Fragrance",
    blurb: "D.S. & Durga, in-shop exclusive — four scents for the room.",
    cover: "/images/editorial/perfume-set.webp",
  },
];
