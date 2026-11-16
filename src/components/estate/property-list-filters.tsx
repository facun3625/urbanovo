"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";

// Filtros del listado de propiedades del panel. Todo se aplica al instante
// (cambia la URL y el server vuelve a armar el listado): los más usados son
// chips de un clic y el resto vive en el panel "Más filtros".

type Option = { value: string; label: string };

const OPERATIONS: Option[] = [
  { value: "SALE", label: "Venta" },
  { value: "RENT", label: "Alquiler" },
  { value: "RENT_TEMP", label: "Temporario" },
];
const STATUSES: Option[] = [
  { value: "AVAILABLE", label: "Disponibles" },
  { value: "RESERVED", label: "Reservadas" },
  { value: "RENTED", label: "Alquiladas" },
  { value: "SOLD", label: "Vendidas" },
];
const PUBLISHED: Option[] = [
  { value: "", label: "Todas" },
  { value: "yes", label: "Publicadas" },
  { value: "no", label: "No publicadas" },
];
const minOptions = (max: number): Option[] => [
  { value: "", label: "Todos" },
  ...Array.from({ length: max }, (_, i) => ({ value: String(i + 1), label: `${i + 1}+` })),
];

// Parámetros del panel "Más filtros" (los chips de arriba no cuentan).
const ADVANCED_KEYS = ["published", "featured", "propertyType", "city", "neighborhood", "bedroomsMin", "bathroomsMin", "garagesMin"];

export function PropertyListFilters({
  propertyTypes,
  cities,
  neighborhoods,
  total,
}: {
  propertyTypes: string[];
  cities: string[];
  neighborhoods: string[];
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const get = (key: string) => searchParams.get(key) ?? "";

  function apply(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page"); // otro filtro = arrancar de la primera página
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }
  const toggle = (key: string, value: string) => apply({ [key]: get(key) === value ? null : value });

  // El panel se cierra con Escape o con un clic afuera.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const labelOf = (options: Option[], value: string) => options.find((o) => o.value === value)?.label ?? value;
  const active: { key: string; label: string }[] = [];
  if (get("operation")) active.push({ key: "operation", label: labelOf(OPERATIONS, get("operation")) });
  if (get("listingStatus")) active.push({ key: "listingStatus", label: labelOf(STATUSES, get("listingStatus")) });
  if (get("published")) active.push({ key: "published", label: labelOf(PUBLISHED, get("published")) });
  if (get("featured")) active.push({ key: "featured", label: "Destacadas" });
  if (get("propertyType")) active.push({ key: "propertyType", label: get("propertyType") });
  if (get("city")) active.push({ key: "city", label: `Ciudad: ${get("city")}` });
  if (get("neighborhood")) active.push({ key: "neighborhood", label: `Barrio: ${get("neighborhood")}` });
  if (get("bedroomsMin")) active.push({ key: "bedroomsMin", label: `${get("bedroomsMin")}+ dorm.` });
  if (get("bathroomsMin")) active.push({ key: "bathroomsMin", label: `${get("bathroomsMin")}+ baños` });
  if (get("garagesMin")) active.push({ key: "garagesMin", label: `${get("garagesMin")}+ cocheras` });
  const advancedCount = ADVANCED_KEYS.filter((k) => get(k)).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ChipGroup label="Operación" options={OPERATIONS} value={get("operation")} onToggle={(v) => toggle("operation", v)} />
        <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
        <ChipGroup label="Estado" options={STATUSES} value={get("listingStatus")} onToggle={(v) => toggle("listingStatus", v)} />
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              open || advancedCount ? "border-primary text-primary" : "bg-card hover:bg-muted",
            )}
          >
            <SlidersHorizontal className="size-4" />
            Más filtros{advancedCount ? ` (${advancedCount})` : ""}
          </button>
          {open && (
            <div className="absolute left-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] space-y-4 rounded-2xl border bg-popover p-4 text-popover-foreground shadow-lg sm:left-auto sm:right-0">
              <Field label="Publicación">
                <Segmented options={PUBLISHED} value={get("published")} onChange={(v) => apply({ published: v })} />
              </Field>
              <Field label="Tipo de inmueble">
                <Select value={get("propertyType")} options={propertyTypes} placeholder="Todos" onChange={(v) => apply({ propertyType: v })} />
              </Field>
              <Field label="Ciudad">
                <Select value={get("city")} options={cities} placeholder="Todas" onChange={(v) => apply({ city: v })} />
              </Field>
              <Field label="Barrio">
                <Select value={get("neighborhood")} options={neighborhoods} placeholder="Todos" onChange={(v) => apply({ neighborhood: v })} />
              </Field>
              <Field label="Dormitorios">
                <Segmented options={minOptions(4)} value={get("bedroomsMin")} onChange={(v) => apply({ bedroomsMin: v })} />
              </Field>
              <Field label="Baños">
                <Segmented options={minOptions(3)} value={get("bathroomsMin")} onChange={(v) => apply({ bathroomsMin: v })} />
              </Field>
              <Field label="Cocheras">
                <Segmented options={minOptions(2)} value={get("garagesMin")} onChange={(v) => apply({ garagesMin: v })} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={get("featured") === "yes"}
                  onChange={(e) => apply({ featured: e.target.checked ? "yes" : null })}
                  className="size-4 accent-[var(--primary)]"
                />
                Solo destacadas
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-7 flex-wrap items-center gap-2 text-sm">
        <span className={cn("font-medium transition-opacity", pending && "opacity-50")}>
          {total} {total === 1 ? "propiedad" : "propiedades"}
        </span>
        {active.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => apply({ [f.key]: null })}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
            aria-label={`Quitar filtro ${f.label}`}
          >
            {f.label}
            <X className="size-3" />
          </button>
        ))}
        {active.length > 1 && (
          <button
            type="button"
            onClick={() => apply(Object.fromEntries(active.map((f) => [f.key, null])))}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Limpiar todo
          </button>
        )}
      </div>
    </div>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onToggle,
}: {
  label: string;
  options: Option[];
  value: string;
  onToggle: (value: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(o.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              selected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Segmented({ options, value, onChange }: { options: Option[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value || "all"}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg border px-2.5 py-1 text-sm transition-colors",
            value === o.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Select({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-sm"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
