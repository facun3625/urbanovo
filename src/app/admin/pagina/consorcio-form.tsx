"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AboutValueIcon } from "@/components/catalog/about-value-icon";
import { ABOUT_VALUE_ICONS } from "@/lib/about-values";
import { CONSORCIO_PATH, MAX_CONSORCIO_ITEMS, type ConsorcioPage } from "@/lib/consorcio";
import { saveConsorcio } from "./actions";

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// Página pública "Administración de consorcios".
export function ConsorcioForm({ values }: { values: ConsorcioPage }) {
  const router = useRouter();
  const [data, setData] = useState<ConsorcioPage>(values);
  const [saving, startSaving] = useTransition();

  const set = (patch: Partial<ConsorcioPage>) => setData((d) => ({ ...d, ...patch }));
  const setItem = (i: number, patch: Partial<ConsorcioPage["items"][number]>) =>
    setData((d) => ({ ...d, items: d.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }));
  const moveItem = (i: number, dir: -1 | 1) =>
    setData((d) => {
      const items = d.items.slice();
      const [it] = items.splice(i, 1);
      items.splice(i + dir, 0, it);
      return { ...d, items };
    });

  function save() {
    startSaving(async () => {
      const result = await saveConsorcio(JSON.stringify(data));
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
          <Label htmlFor="consorcio-show" className="text-base font-semibold">
            Administración de consorcios
          </Label>
          <p className="text-sm text-muted-foreground">
            Página propia con link en el menú. Oculta, sale del menú y no se puede abrir.{" "}
            <a href={CONSORCIO_PATH} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">
              Ver página <ExternalLink className="size-3" />
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{data.show ? "Visible" : "Oculta"}</span>
          <Switch id="consorcio-show" checked={data.show} onCheckedChange={(show) => set({ show })} />
        </div>
      </div>

      <div className={cn("flex flex-col gap-5", !data.show && "opacity-60")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nombre en el menú" value={data.menuLabel} onChange={(menuLabel) => set({ menuLabel })} />
          <Field label="Texto chico de arriba" value={data.eyebrow} onChange={(eyebrow) => set({ eyebrow })} />
          <Field label="Título" value={data.title} onChange={(title) => set({ title })} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Texto de presentación</Label>
          <Textarea rows={5} value={data.intro} onChange={(e) => set({ intro: e.target.value })} />
          <p className="text-xs text-muted-foreground">Dejá una línea en blanco para separar párrafos.</p>
        </div>

        <div className="flex flex-col gap-3 border-t pt-5">
          <Field label="Título de los servicios" value={data.servicesTitle} onChange={(servicesTitle) => set({ servicesTitle })} />
          {data.items.map((item, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Servicio {i + 1}</span>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => moveItem(i, -1)} aria-label="Subir">
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" disabled={i === data.items.length - 1} onClick={() => moveItem(i, 1)} aria-label="Bajar">
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => set({ items: data.items.filter((_, j) => j !== i) })}
                    aria-label="Quitar"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Ícono</Label>
                <div className="flex flex-wrap gap-1.5">
                  {ABOUT_VALUE_ICONS.map((ic) => (
                    <button
                      key={ic.key}
                      type="button"
                      title={ic.label}
                      aria-label={ic.label}
                      aria-pressed={item.icon === ic.key}
                      onClick={() => setItem(i, { icon: ic.key })}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg border transition-colors",
                        item.icon === ic.key
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      <AboutValueIcon icon={ic.key} className="size-4" />
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Título" value={item.title} onChange={(title) => setItem(i, { title })} />
              <div className="flex flex-col gap-2">
                <Label>Texto</Label>
                <Textarea rows={2} value={item.text} onChange={(e) => setItem(i, { text: e.target.value })} />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={data.items.length >= MAX_CONSORCIO_ITEMS}
            onClick={() => set({ items: [...data.items, { icon: "star", title: "", text: "" }] })}
          >
            <Plus className="size-3.5" />
            Agregar servicio
          </Button>
        </div>

        <div className="flex flex-col gap-4 border-t pt-5">
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold">Cierre de la página</span>
            <p className="text-sm text-muted-foreground">
              Los botones de teléfono y WhatsApp y la dirección salen de la pestaña Contacto.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Texto chico de arriba" value={data.ctaEyebrow} onChange={(ctaEyebrow) => set({ ctaEyebrow })} />
            <Field label="Título" value={data.ctaTitle} onChange={(ctaTitle) => set({ ctaTitle })} />
          </div>
        </div>
      </div>

      <Button type="button" size="sm" onClick={save} disabled={saving} className="self-start">
        {saving ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );
}
