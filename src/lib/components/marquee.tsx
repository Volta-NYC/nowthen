export default function Marquee({ items }: { items: string[] }) {
  // Duplicate so the CSS translate(-50%) loop is seamless.
  const row = [...items, ...items]
  return (
    <div className="relative overflow-hidden border-y border-ink/10 bg-bone-50">
      <div className="flex animate-marquee whitespace-nowrap py-5">
        {row.map((t, i) => (
          <span
            key={i}
            className="mx-8 inline-flex items-center gap-8 text-[0.72rem] uppercase tracking-widest text-ink-muted"
          >
            {t}
            <span className="text-brass">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
