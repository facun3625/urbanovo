// Qué estados de oferta se ven en el sitio público. Las disponibles siempre;
// reservadas, alquiladas y vendidas se prenden y apagan en Configuración →
// Publicaciones. Este archivo no toca la base: lo usan también componentes
// del cliente.
export const PUBLIC_STATUSES_KEY = "public_listing_statuses";

export const OPTIONAL_PUBLIC_STATUSES = [
  { value: "RESERVED", label: "Reservadas", hint: "Con la etiqueta «Reservada». El precio se sigue viendo." },
  { value: "RENTED", label: "Alquiladas", hint: "Con la etiqueta «Alquilada», sin precio." },
  { value: "SOLD", label: "Vendidas", hint: "Con la etiqueta «Vendida», sin precio." },
] as const;

export type OptionalPublicStatus = (typeof OPTIONAL_PUBLIC_STATUSES)[number]["value"];

// Etiqueta que se muestra en la tarjeta y la ficha cuando la oferta no está
// disponible.
export const STATUS_BADGE: Record<string, string> = {
  RESERVED: "Reservada",
  RENTED: "Alquilada",
  SOLD: "Vendida",
};

// Ya cerradas: no se muestra el precio, solo la etiqueta.
export function isClosedStatus(status: string | undefined) {
  return status === "SOLD" || status === "RENTED";
}

export function parsePublicStatuses(value: string | undefined): string[] {
  const allowed = new Set<string>(OPTIONAL_PUBLIC_STATUSES.map((s) => s.value));
  const extra = (value ?? "").split(",").filter((s) => allowed.has(s));
  return ["AVAILABLE", ...extra];
}
