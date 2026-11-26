"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CopyIcon, MoveIcon, RotateCcwIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  COVER_VIEWS,
  DEFAULT_COVER_FRAME,
  DEFAULT_COVER_FRAMES,
  MAX_COVER_ZOOM,
  coverFrameStyle,
  normalizeCoverFrame,
  type CoverFrame,
  type CoverFrames,
  type CoverView,
} from "@/lib/cover-frame";
import { updateCoverFrame } from "./actions";

const VIEW_LABELS: Record<CoverView, { label: string; hint: string }> = {
  notebook: { label: "Notebook", hint: "1024 a 1599 px" },
  wide: { label: "Monitor grande", hint: "1600 px o más" },
  mobile: { label: "Celular", hint: "menos de 1024 px" },
};

// Forma (ancho / alto) que toma el recuadro de la portada en cada vista según
// la plantilla. Son aproximadas: en la web el alto depende del contenido.
const RATIOS: Record<string, Record<CoverView, number>> = {
  clasico: { notebook: 1.35, wide: 1.9, mobile: 1.75 },
  moderno: { notebook: 2.4, wide: 3.5, mobile: 1.5 },
  minimal: { notebook: 16 / 7, wide: 16 / 7, mobile: 1.28 },
};

export function CoverFrameEditor({
  imageUrl,
  template,
  initial,
}: {
  imageUrl: string;
  template: string;
  initial: CoverFrames;
}) {
  const router = useRouter();
  const [frames, setFrames] = useState<CoverFrames>(initial);
  const [saving, startSaving] = useTransition();
  const drag = useRef<{ view: CoverView; x: number; y: number; start: CoverFrame; width: number; height: number } | null>(null);
  const ratios = RATIOS[template] ?? RATIOS.clasico;
  const dirty = JSON.stringify(frames) !== JSON.stringify(initial);

  const setView = (view: CoverView, frame: Partial<CoverFrame>) =>
    setFrames((f) => ({ ...f, [view]: normalizeCoverFrame({ ...f[view], ...frame }) }));

  function onPointerDown(view: CoverView, e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { view, x: e.clientX, y: e.clientY, start: frames[view], width: rect.width, height: rect.height };
  }

  // Arrastrar la foto hacia un lado muestra lo que hay del otro: el punto
  // de enfoque se mueve en sentido contrario.
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = ((e.clientX - d.x) / d.width) * 100;
    const dy = ((e.clientY - d.y) / d.height) * 100;
    setView(d.view, { x: d.start.x - dx / d.start.zoom, y: d.start.y - dy / d.start.zoom });
  }

  function onPointerUp() {
    drag.current = null;
  }

  function copyToAll(view: CoverView) {
    const frame = frames[view];
    setFrames({ notebook: frame, wide: frame, mobile: frame });
    toast.success(`Encuadre de ${VIEW_LABELS[view].label} copiado a todas las vistas`);
  }

  function save() {
    startSaving(async () => {
      const result = await updateCoverFrame(frames);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Encuadre guardado");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-medium">Encuadre de la portada</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Cada vista se ajusta por separado: arrastrá la foto para moverla y usá su zoom para agrandarla.
        </p>
      </div>

      <div className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {COVER_VIEWS.map((view) => {
          const frame = frames[view];
          return (
            <div key={view} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium">{VIEW_LABELS[view].label}</span>
                <span className="text-[11px] text-muted-foreground">{VIEW_LABELS[view].hint}</span>
              </div>
              <div
                className="relative cursor-grab touch-none select-none overflow-hidden rounded-md border bg-muted active:cursor-grabbing"
                style={{ aspectRatio: ratios[view] }}
                onPointerDown={(e) => onPointerDown(view, e)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute inset-0 size-full object-cover"
                  style={coverFrameStyle(frame)}
                />
                {view === "mobile" && template === "clasico" && (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5" aria-hidden />
                )}
                <MoveIcon className="pointer-events-none absolute right-1.5 bottom-1.5 size-4 text-white drop-shadow" />
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="icon-sm" variant="ghost" onClick={() => setView(view, { zoom: frame.zoom - 0.1 })} aria-label={`Achicar ${VIEW_LABELS[view].label}`}>
                  <ZoomOutIcon className="size-4" />
                </Button>
                <input
                  type="range"
                  min={1}
                  max={MAX_COVER_ZOOM}
                  step={0.01}
                  value={frame.zoom}
                  onChange={(e) => setView(view, { zoom: Number(e.target.value) })}
                  aria-label={`Zoom ${VIEW_LABELS[view].label}`}
                  className="min-w-0 flex-1 accent-primary"
                />
                <Button type="button" size="icon-sm" variant="ghost" onClick={() => setView(view, { zoom: frame.zoom + 0.1 })} aria-label={`Agrandar ${VIEW_LABELS[view].label}`}>
                  <ZoomInIcon className="size-4" />
                </Button>
                <span className="w-11 text-right text-xs tabular-nums text-muted-foreground">{frame.zoom.toFixed(2)}×</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <button type="button" onClick={() => setView(view, DEFAULT_COVER_FRAME)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  <RotateCcwIcon className="size-3" /> Centrar
                </button>
                <button type="button" onClick={() => copyToAll(view)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  <CopyIcon className="size-3" /> Usar en todas
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={save} disabled={saving || !dirty}>
          {saving ? "Guardando..." : "Guardar encuadre"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setFrames(DEFAULT_COVER_FRAMES)}>
          Centrar todas
        </Button>
      </div>
    </div>
  );
}
