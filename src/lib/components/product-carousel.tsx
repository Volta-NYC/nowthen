"use client"

import Image from "next/image"
import { useState } from "react"
import clsx from "clsx"

export default function ProductCarousel({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0)
  const main = images[i]
  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse lg:gap-5">
      <div className="relative aspect-[4/5] flex-1 overflow-hidden bg-bone-200">
        <Image
          key={main}
          src={main}
          alt={name}
          fill
          sizes="(min-width:1024px) 55vw, 100vw"
          priority
          className="animate-fade-in object-cover"
        />
        {images.length > 1 && (
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between p-3">
            <CarouselBtn aria-label="Previous" onClick={() => setI((p) => (p - 1 + images.length) % images.length)}>
              ←
            </CarouselBtn>
            <CarouselBtn aria-label="Next" onClick={() => setI((p) => (p + 1) % images.length)}>
              →
            </CarouselBtn>
          </div>
        )}
        <span className="absolute bottom-3 right-3 rounded-full bg-bone-50/90 px-3 py-1 text-[0.65rem] uppercase tracking-widest text-ink">
          {i + 1} / {images.length}
        </span>
      </div>
      {images.length > 1 && (
        <ul className="flex gap-3 overflow-x-auto lg:w-24 lg:flex-col lg:overflow-visible">
          {images.map((src, idx) => (
            <li key={src + idx}>
              <button
                onClick={() => setI(idx)}
                aria-label={`View image ${idx + 1}`}
                className={clsx(
                  "relative block aspect-[4/5] w-20 shrink-0 overflow-hidden border transition-all",
                  i === idx ? "border-ink" : "border-transparent opacity-60 hover:opacity-100",
                )}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CarouselBtn({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="grid h-10 w-10 place-items-center rounded-full bg-bone-50/90 text-ink shadow-sm transition-colors hover:bg-bone-50"
    >
      {children}
    </button>
  )
}
