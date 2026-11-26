import type { CSSProperties } from "react";

// Encuadre de la portada del Inicio (Página web → Inicio): punto de la foto
// que queda centrado (x/y en %) y zoom. Se aplica igual al video. Este
// archivo no toca la base: lo usan también componentes del cliente.
export const COVER_FRAME_KEY = "store_cover_frame";
export const MAX_COVER_ZOOM = 3;

export type CoverFrame = { x: number; y: number; zoom: number };
export const DEFAULT_COVER_FRAME: CoverFrame = { x: 50, y: 50, zoom: 1 };

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function normalizeCoverFrame(value: unknown): CoverFrame {
  const v = (value && typeof value === "object" ? value : {}) as Partial<Record<keyof CoverFrame, unknown>>;
  const num = (n: unknown, fallback: number) => (typeof n === "number" && Number.isFinite(n) ? n : fallback);
  return {
    x: clamp(num(v.x, 50), 0, 100),
    y: clamp(num(v.y, 50), 0, 100),
    zoom: clamp(num(v.zoom, 1), 1, MAX_COVER_ZOOM),
  };
}

export function parseCoverFrame(value: string | undefined): CoverFrame {
  try {
    return normalizeCoverFrame(value ? JSON.parse(value) : null);
  } catch {
    return DEFAULT_COVER_FRAME;
  }
}

// object-position elige qué parte se ve al recortar; el zoom agranda desde
// ese mismo punto, así lo elegido sigue en su lugar.
export function coverFrameStyle({ x, y, zoom }: CoverFrame): CSSProperties {
  const position = `${x}% ${y}%`;
  return zoom === 1 ? { objectPosition: position } : { objectPosition: position, transform: `scale(${zoom})`, transformOrigin: position };
}
