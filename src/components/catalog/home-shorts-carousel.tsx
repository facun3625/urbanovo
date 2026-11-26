"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

// Más de 4 videos: una fila que se desliza, con flechas a los costados en
// computadora (en el celular se pasa con el dedo). Según el ancho se ven 4,
// 5 o 6 a la vez; si entran todos, no hay flechas. Hasta 4, quedan fijos y
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

// Ancho de cada video en el carrusel: 2, 3, 4, 5 o 6 por pantalla. Son
// rangos que no se pisan (cada ancho cae en uno solo): con variantes
// superpuestas Tailwind no garantiza cuál gana.
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
    <div className="relative mx-auto max-w-[1440px] sm:px-8 lg:px-12 min-[1400px]:max-[1700px]:max-w-[1500px] min-[1700px]:max-w-[1900px]">
      <button type="button" aria-label="Videos anteriores" onClick={() => go(-1)} disabled={edges.start} className={cn(arrow, "left-0")}>
        <ChevronLeft className="size-5" />
      </button>
      <div
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pt-1 pb-5 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:gap-8 [&::-webkit-scrollbar]:hidden [&>*:first-child]:ml-auto [&>*:last-child]:mr-auto"
      >
        {ids.map((id, i) => (
          <div key={`${i}-${id}`} className={cn(CARD, "max-sm:w-[68vw] max-sm:max-w-[260px] sm:max-md:w-[calc((100%-1.25rem)/2)] md:max-lg:w-[calc((100%-2.5rem)/3)] lg:max-[1400px]:w-[calc((100%-6rem)/4)] min-[1400px]:max-[1700px]:w-[calc((100%-8rem)/5)] min-[1700px]:w-[calc((100%-10rem)/6)]")}>
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
