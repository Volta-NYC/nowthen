export default function PageHeading({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string
  title: string
  lede?: string
}) {
  return (
    <header className="shell pb-12 pt-20 sm:pt-28">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-4 font-display text-5xl leading-[1.02] sm:text-6xl md:text-7xl">{title}</h1>
      {lede && (
        <p className="mt-6 max-w-2xl font-display text-lg italic text-ink-soft sm:text-xl">{lede}</p>
      )}
      <div className="rule mt-12" />
    </header>
  )
}
