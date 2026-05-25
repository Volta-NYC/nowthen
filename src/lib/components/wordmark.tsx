// The NOW+THEN wordmark. Optional script sub-mark sits below the
// wordmark (not crossed through it) — purely a NOW+THEN brand element.
import clsx from "clsx"

export default function Wordmark({
  size = "md",
  withScript = false,
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl"
  withScript?: boolean
  className?: string
}) {
  const scale = {
    sm: "text-[1.05rem] tracking-[0.18em]",
    md: "text-2xl tracking-[0.18em]",
    lg: "text-5xl md:text-6xl tracking-[0.16em]",
    xl: "text-6xl sm:text-7xl md:text-[6.5rem] tracking-[0.12em]",
  }[size]
  const subSize = {
    sm: "text-[0.65rem]",
    md: "text-sm",
    lg: "text-lg",
    xl: "text-2xl",
  }[size]
  return (
    <span className={clsx("inline-flex flex-col items-center font-display font-medium leading-none", className)}>
      <span className={clsx("whitespace-nowrap", scale)}>
        NOW
        <span className="mx-1.5 md:mx-2 inline-block translate-y-[0.04em] text-brass">+</span>
        THEN
      </span>
      {withScript && (
        <span
          aria-hidden
          className={clsx("mt-2 font-script text-brass select-none", subSize)}
        >
          then &amp; now
        </span>
      )}
    </span>
  )
}
