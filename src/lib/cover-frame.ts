import type { CSSProperties } from "react";

// Encuadre de la portada del Inicio (Página web → Inicio): para cada tamaño
// de pantalla, el punto de la foto que queda centrado (x/y en %) y el zoom.
// Se aplica igual al video. Este archivo no toca la base: lo usan también
// componentes del cliente.
export const COVER_FRAME_KEY = "store_cover_frame";
export const MAX_COVER_ZOOM = 3;

export type CoverFrame = { x: number; y: number; zoom: number };
export const COVER_VIEWS = ["notebook", "wide", "mobile"] as const;
export type CoverView = (typeof COVER_VIEWS)[number];
export type CoverFrames = Record<CoverView, CoverFrame>;

export const DEFAULT_COVER_FRAME: CoverFrame = { x: 50, y: 50, zoom: 1 };
export const DEFAULT_COVER_FRAMES: CoverFrames = {
  notebook: DEFAULT_COVER_FRAME,
  wide: DEFAULT_COVER_FRAME,
  mobile: DEFAULT_COVER_FRAME,
};

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

// Acepta también el formato viejo (un solo encuadre para todas las vistas).
export function normalizeCoverFrames(value: unknown): CoverFrames {
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  if ("x" in v || "zoom" in v) {
    const single = normalizeCoverFrame(v);
    return { notebook: single, wide: single, mobile: single };
  }
  return {
    notebook: normalizeCoverFrame(v.notebook),
    wide: normalizeCoverFrame(v.wide),
    mobile: normalizeCoverFrame(v.mobile),
  };
}

export function parseCoverFrames(value: string | undefined): CoverFrames {
  try {
    return normalizeCoverFrames(value ? JSON.parse(value) : null);
  } catch {
    return DEFAULT_COVER_FRAMES;
  }
}

// Un encuadre como estilo directo (vista previa del panel). object-position
// elige qué parte se ve al recortar; el zoom agranda desde ese mismo punto.
export function coverFrameStyle({ x, y, zoom }: CoverFrame): CSSProperties {
  const position = `${x}% ${y}%`;
  return { objectPosition: position, transform: `scale(${zoom})`, transformOrigin: position };
}

// En la web: variables CSS por vista y COVER_FRAME_CLASS elige cuál usar
// según el ancho (celular < 1024 px, notebook hasta 1599 px, monitor grande).
export function coverFramesVars(frames: CoverFrames): CSSProperties {
  const vars: Record<string, string> = {};
  for (const [view, suffix] of [["mobile", "m"], ["notebook", "n"], ["wide", "w"]] as const) {
    const { x, y, zoom } = frames[view];
    vars[`--cover-pos-${suffix}`] = `${x}% ${y}%`;
    vars[`--cover-zoom-${suffix}`] = String(zoom);
  }
  return vars as CSSProperties;
}

export const COVER_FRAME_CLASS =
  "[object-position:var(--cover-pos-m)] [transform-origin:var(--cover-pos-m)] [transform:scale(var(--cover-zoom-m))] " +
  "lg:max-[1600px]:[object-position:var(--cover-pos-n)] lg:max-[1600px]:[transform-origin:var(--cover-pos-n)] lg:max-[1600px]:[transform:scale(var(--cover-zoom-n))] " +
  "min-[1600px]:[object-position:var(--cover-pos-w)] min-[1600px]:[transform-origin:var(--cover-pos-w)] min-[1600px]:[transform:scale(var(--cover-zoom-w))]";
