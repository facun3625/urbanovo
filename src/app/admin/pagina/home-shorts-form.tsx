"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MAX_HOME_SHORTS, youtubeId, type HomeShorts } from "@/lib/home-shorts";
import { saveHomeShorts } from "./actions";

// Bloque de videos verticales (YouTube Shorts) del Inicio.
export function HomeShortsForm({ values }: { values: HomeShorts }) {
  const router = useRouter();
  const [data, setData] = useState<HomeShorts>(values);
  const [saving, startSaving] = useTransition();

  const set = (patch: Partial<HomeShorts>) => setData((d) => ({ ...d, ...patch }));
  const setVideo = (i: number, value: string) =>
    setData((d) => ({ ...d, videos: d.videos.map((v, j) => (j === i ? value : v)) }));
  const move = (i: number, dir: -1 | 1) =>
    setData((d) => {
      const videos = d.videos.slice();
      const [v] = videos.splice(i, 1);
      videos.splice(i + dir, 0, v);
      return { ...d, videos };
    });

  function save() {
    startSaving(async () => {
      const result = await saveHomeShorts(JSON.stringify(data));
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Guardado");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="home-shorts-show" className="text-base font-semibold">
            Videos verticales (Shorts)
          </Label>
          <p className="text-sm text-muted-foreground">
            Bloque del Inicio con videos de YouTube Shorts, debajo de las propiedades destacadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{data.show ? "Visible" : "Oculto"}</span>
          <Switch id="home-shorts-show" checked={data.show} onCheckedChange={(show) => set({ show })} />
        </div>
      </div>

      <div className={cn("flex flex-col gap-5", !data.show && "opacity-60")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Título</Label>
            <Input value={data.title} onChange={(e) => set({ title: e.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Subtítulo</Label>
            <Input value={data.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Videos</Label>
          <p className="text-xs text-muted-foreground">
            Pegá el link del Short (por ejemplo https://youtube.com/shorts/…). También sirven los links comunes de YouTube.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.videos.map((video, i) => {
              const id = youtubeId(video);
              return (
                <div key={i} className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-3">
                  <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-muted">
                    {id ? (
                      // Miniatura y no el reproductor: el panel no necesita cargar 8 iframes.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="absolute inset-0 size-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-muted-foreground">
                        {video.trim() ? "No es un link de YouTube" : "Pegá un link"}
                      </span>
                    )}
                  </div>
                  <Input
                    value={video}
                    placeholder="https://youtube.com/shorts/…"
                    onChange={(e) => setVideo(i, e.target.value)}
                    aria-invalid={Boolean(video.trim()) && !id}
                    className={cn(video.trim() && !id && "border-destructive")}
                  />
                  <div className="flex justify-between">
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Mover antes">
                        <ArrowLeft className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" disabled={i === data.videos.length - 1} onClick={() => move(i, 1)} aria-label="Mover después">
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => set({ videos: data.videos.filter((_, j) => j !== i) })}
                      aria-label="Quitar video"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={data.videos.length >= MAX_HOME_SHORTS}
            onClick={() => set({ videos: [...data.videos, ""] })}
          >
            <Plus className="size-3.5" />
            Agregar video
          </Button>
        </div>
      </div>

      <Button type="button" onClick={save} disabled={saving} className="self-start">
        {saving ? "Guardando…" : "Guardar"}
      </Button>
    </div>
  );
}
