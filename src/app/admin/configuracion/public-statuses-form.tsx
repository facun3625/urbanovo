"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { OPTIONAL_PUBLIC_STATUSES } from "@/lib/estate/listing-status";
import { updatePublicStatuses } from "./actions";

export function PublicStatusesForm({ statuses }: { statuses: string[] }) {
  const [selected, setSelected] = useState(() => new Set(statuses));
  const [pending, startTransition] = useTransition();

  function toggle(value: string, on: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(value);
      else next.delete(value);
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      const result = await updatePublicStatuses([...selected]);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Listo: el sitio ya muestra lo que elegiste");
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">
        Qué publicaciones se ven en el sitio (listados, mapa, buscador y Destacadas). Las disponibles
        se muestran siempre. El estado de cada propiedad se cambia al editarla, en «Precio y
        características», o solo al reservar o cerrar una negociación.
      </p>

      <ul className="flex flex-col divide-y rounded-lg border">
        <li className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Disponibles</p>
            <p className="text-xs text-muted-foreground">Siempre visibles.</p>
          </div>
          <Switch checked disabled aria-label="Disponibles" />
        </li>
        {OPTIONAL_PUBLIC_STATUSES.map((status) => (
          <li key={status.value} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{status.label}</p>
              <p className="text-xs text-muted-foreground">{status.hint}</p>
            </div>
            <Switch
              checked={selected.has(status.value)}
              onCheckedChange={(on) => toggle(status.value, on)}
              aria-label={`Mostrar ${status.label.toLowerCase()}`}
            />
          </li>
        ))}
      </ul>

      <div>
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
