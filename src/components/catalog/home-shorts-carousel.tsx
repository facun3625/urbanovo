"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

// Más de 4 videos: una fila que se desliza, con flechas a los costados en
// computadora (en el celular se pasa con el dedo). Hasta 4, quedan fijos y
// centrados.
const CAROUSEL_FROM = 5;

function ShortFrame({ id }: { id: string }) {
  return (
    <iframe
      src={`https://www.youtube.com/embed/${id}?rel=0&playsinline=1`}
      title="Video de YouTube"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      className="size-full border-0"
    />
  );
}

const CARD = "aspect-[9/16] shrink-0 snap-start overflow-hidden rounded-xl bg-black shadow-lg";

export function HomeShortsCarousel({ ids }: { ids: string[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const carousel = ids.length >= CAROUSEL_FROM;

  useEffect(() => {
    const el = track.current;
    if (!el || !carousel) return;
    const update = () =>
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [carousel]);

  function go(dir: -1 | 1) {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = card ? card.offsetWidth + gap : el.clientWidth;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  if (!carousel) {
    return (
      <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 lg:gap-8">
        {ids.map((id, i) => (
          <div key={`${i}-${id}`} className={cn(CARD, "w-[68vw] max-w-[260px] snap-center sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.5rem)]")}>
            <ShortFrame id={id} />
          </div>
        ))}
      </div>
    );
  }

  const arrow =
    "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg ring-1 ring-black/5 transition hover:scale-105 disabled:pointer-events-none disabled:opacity-0 sm:flex";

  return (
    <div className="relative mx-auto max-w-[1232px] sm:px-8 lg:px-12">
      <button type="button" aria-label="Videos anteriores" onClick={() => go(-1)} disabled={edges.start} className={cn(arrow, "left-0")}>
        <ChevronLeft className="size-5" />
      </button>
      <div
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pt-1 pb-5 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:gap-8 [&::-webkit-scrollbar]:hidden"
      >
        {ids.map((id, i) => (
          <div key={`${i}-${id}`} className={cn(CARD, "w-[68vw] max-w-[260px] sm:w-[calc((100%-1.25rem)/2)] sm:max-w-none md:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-6rem)/4)]")}>
            <ShortFrame id={id} />
          </div>
        ))}
      </div>
      <button type="button" aria-label="Videos siguientes" onClick={() => go(1)} disabled={edges.end} className={cn(arrow, "right-0")}>
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
