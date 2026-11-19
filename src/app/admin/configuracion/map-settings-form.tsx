"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { MapProvider } from "@/lib/settings";
import { updateMapSettings } from "./actions";

const OPTIONS: { value: MapProvider; title: string; text: string }[] = [
  {
    value: "osm",
    title: "OpenStreetMap",
    text: "Gratis y sin configurar nada. Es el mapa que se usa hoy.",
  },
  {
    value: "google",
    title: "Google Maps",
    text: "El mapa que todos conocen. Necesita una clave de Google con facturación activa (las primeras 10.000 cargas por mes son gratis).",
  },
];

export function MapSettingsForm({ provider, apiKey }: { provider: MapProvider; apiKey: string | null }) {
  const [selected, setSelected] = useState<MapProvider>(provider);
  const [key, setKey] = useState(apiKey ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("provider", selected);
      formData.set("apiKey", key.trim());
      const result = await updateMapSettings(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(selected === "google" ? "Listo: el sitio usa Google Maps" : "Listo: el sitio usa OpenStreetMap");
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">
        Elegí qué mapa se ve en el sitio (página Mapa y ubicación de cada propiedad) y en el admin al
        ubicar una propiedad. Si la clave de Google deja de funcionar, el sitio vuelve solo a
        OpenStreetMap para que el mapa nunca quede en blanco.
      </p>

      <div role="radiogroup" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected === option.value}
            onClick={() => setSelected(option.value)}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors",
              selected === option.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted",
            )}
          >
            <span className="block text-sm font-medium">{option.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{option.text}</span>
          </button>
        ))}
      </div>

      {selected === "google" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="gmaps-key">Clave de la API de Google Maps</Label>
            <Input
              id="gmaps-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza..."
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
            />
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
            <li>
              Entrá a{" "}
              <a href="https://console.cloud.google.com/google/maps-apis/overview" target="_blank" rel="noreferrer" className="underline">
                Google Cloud Console
              </a>
              , creá un proyecto y activá la facturación (piden tarjeta aunque no se cobre).
            </li>
            <li>
              En <span className="font-medium text-foreground">APIs y servicios → Biblioteca</span> activá{" "}
              <span className="font-medium text-foreground">Maps JavaScript API</span>.
            </li>
            <li>
              En <span className="font-medium text-foreground">Credenciales</span> creá una clave de API y restringila: en
              &quot;Sitios web&quot; agregá el dominio del sitio (por ejemplo{" "}
              <span className="font-mono">https://tudominio.com.ar/*</span>) y en &quot;Restricciones de API&quot; dejá
              solo Maps JavaScript API.
            </li>
            <li>
              Recomendado: en <span className="font-medium text-foreground">Cuotas</span> poné un límite diario de
              cargas y en <span className="font-medium text-foreground">Facturación → Presupuestos</span> una alerta,
              así nunca hay sorpresas.
            </li>
          </ol>
        </div>
      )}

      <div>
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
