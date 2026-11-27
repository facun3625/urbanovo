import Link from "next/link";

import { cn } from "@/lib/utils";
import { PropertyTypeIcon } from "./property-type-icon";

const OPERATIONS = [
  { value: "SALE", label: "Venta" },
  { value: "RENT", label: "Alquiler" },
  { value: "RENT_TEMP", label: "Temporario" },
];

// Filtros rápidos arriba del listado: un toque prende o apaga operación o
// tipo de inmueble, conservando el resto de la búsqueda.
export function QuickFilters({
  search,
  showOperation,
  propertyTypes,
}: {
  search: Record<string, string | undefined>;
  showOperation: boolean;
  // Vacío si el filtro de tipo está apagado en Página web → Filtros.
  propertyTypes: string[];
}) {
  function href(key: string, value: string) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(search)) if (v && k !== "page") params.set(k, v);
    if (search[key] === value) params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    return qs ? `/propiedades?${qs}` : "/propiedades";
  }

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
    );

  if (!showOperation && propertyTypes.length === 0) return null;

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
      {showOperation &&
        OPERATIONS.map((o) => (
          <Link key={o.value} href={href("operation", o.value)} scroll={false} className={chip(search.operation === o.value)}>
            {o.label}
          </Link>
        ))}
      {showOperation && propertyTypes.length > 0 && <span className="mx-1 w-px shrink-0 self-stretch bg-border" aria-hidden />}
      {propertyTypes.map((t) => (
        <Link key={t} href={href("propertyType", t)} scroll={false} className={chip(search.propertyType === t)}>
          <PropertyTypeIcon type={t} className="size-4" />
          {t}
        </Link>
      ))}
    </div>
  );
}
