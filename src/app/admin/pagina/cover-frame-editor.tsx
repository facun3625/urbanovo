"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoveIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_COVER_FRAME,
  MAX_COVER_ZOOM,
  coverFrameStyle,
  normalizeCoverFrame,
  type CoverFrame,
} from "@/lib/cover-frame";
import { updateCoverFrame } from "./actions";

// Forma que toma el recuadro de la portada según la plantilla y la pantalla
// (ancho / alto). Son aproximadas: en la web el alto depende del contenido.
const FRAMES: Record<string, { label: string; ratio: number; gradient?: boolean }[]> = {
  clasico: [
    { label: "Notebook", ratio: 1.3 },
    { label: "Monitor grande", ratio: 1.9 },
    { label: "Celular", ratio: 1.75, gradient: true },
  ],
  moderno: [
    { label: "Computadora", ratio: 2.65 },
    { label: "Celular", ratio: 1.5 },
  ],
  minimal: [
    { label: "Computadora", ratio: 16 / 7 },
    { label: "Celular", ratio: 1.28 },
  ],
};

export function CoverFrameEditor({
  imageUrl,
  template,
  initial,
}: {
  imageUrl: string;
  template: string;
  initial: CoverFrame;
}) {
  const router = useRouter();
  const [frame, setFrame] = useState<CoverFrame>(initial);
  const [saving, startSaving] = useTransition();
  const drag = useRef<{ x: number; y: number; start: CoverFrame; width: number; height: number } | null>(null);
  const frames = FRAMES[template] ?? FRAMES.clasico;
  const dirty = JSON.stringify(frame) !== JSON.stringify(initial);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, start: frame, width: rect.width, height: rect.height };
  }

  // Arrastrar la foto hacia un lado muestra lo que hay del otro: el punto
  // de enfoque se mueve en sentido contrario.
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = ((e.clientX - d.x) / d.width) * 100;
    const dy = ((e.clientY - d.y) / d.height) * 100;
    setFrame(normalizeCoverFrame({ ...d.start, x: d.start.x - dx / d.start.zoom, y: d.start.y - dy / d.start.zoom }));
  }

  function onPointerUp() {
    drag.current = null;
  }

  function setZoom(zoom: number) {
    setFrame((f) => normalizeCoverFrame({ ...f, zoom }));
  }

  function save() {
    startSaving(async () => {
      const result = await updateCoverFrame(frame);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Encuadre guardado");
      router.refresh();
    });
  }

  const style = coverFrameStyle(frame);

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-medium">Encuadre de la portada</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Arrastrá la foto en cualquiera de las vistas para moverla y usá el zoom para agrandarla. Se ve cómo queda en cada pantalla.
        </p>
      </div>

      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {frames.map((f) => (
          <div key={f.label} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
            <div
              className="relative cursor-grab touch-none select-none overflow-hidden rounded-md border bg-muted active:cursor-grabbing"
              style={{ aspectRatio: f.ratio }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full object-cover" style={style} />
              {f.gradient && (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5" aria-hidden />
              )}
              <MoveIcon className="pointer-events-none absolute right-1.5 bottom-1.5 size-4 text-white drop-shadow" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cover-zoom">Zoom ({frame.zoom.toFixed(2)}×)</Label>
        <div className="flex items-center gap-3">
          <Button type="button" size="icon-sm" variant="outline" onClick={() => setZoom(frame.zoom - 0.1)} aria-label="Achicar">
            <ZoomOutIcon className="size-4" />
          </Button>
          <input
            id="cover-zoom"
            type="range"
            min={1}
            max={MAX_COVER_ZOOM}
            step={0.01}
            value={frame.zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full max-w-sm accent-primary"
          />
          <Button type="button" size="icon-sm" variant="outline" onClick={() => setZoom(frame.zoom + 0.1)} aria-label="Agrandar">
            <ZoomInIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={save} disabled={saving || !dirty}>
          {saving ? "Guardando..." : "Guardar encuadre"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setFrame(DEFAULT_COVER_FRAME)}>
          Centrar y sin zoom
        </Button>
      </div>
    </div>
  );
}
