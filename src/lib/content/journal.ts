export type JournalEntry = {
  slug: string;
  title: string;
  dek: string;
  date: string;
  cover: string;
  read: string;
};

export const journal: JournalEntry[] = [
  {
    slug: "spring-on-the-block",
    title: "Spring on the block",
    dek: "A walk down the avenue, the music spilling out of the bar next door, and what arrived in the shop this week.",
    date: "April 14",
    cover: "/images/hero/hero-main.webp",
    read: "4 min",
  },
  {
    slug: "seek-collective",
    title: "Seek Collective, ethically dyed",
    dek: "Our favorite Brooklyn-by-way-of-India label on naturally dyed trousers, slow craft, and the case for a smaller wardrobe.",
    date: "March 28",
    cover: "/images/products/two-tone-pants.webp",
    read: "6 min",
  },
  {
    slug: "beaded-objects",
    title: "Field notes from the bead studio",
    dek: "How a single talisman brooch takes a week of patience, a hundred glass beads and a steady cup of coffee.",
    date: "March 03",
    cover: "/images/editorial/tiger.webp",
    read: "3 min",
  },
];
