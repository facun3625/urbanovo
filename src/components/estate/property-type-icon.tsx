"use client";

import { createElement } from "react";
import { useStoreSettings } from "@/lib/store-settings-context";
import { propertyTypeIcon, suggestedPropertyTypeIcon } from "@/lib/estate/property-type-icons";

// Ícono del tipo de inmueble (Casa, Departamento…) elegido en Categorías;
// si no eligieron ninguno, el sugerido por el nombre.
export function PropertyTypeIcon({ type, className }: { type: string; className?: string }) {
  const { propertyTypeIcons } = useStoreSettings();
  const icon = propertyTypeIcon(propertyTypeIcons[type] ?? suggestedPropertyTypeIcon(type));
  return createElement(icon, { className, "aria-hidden": true });
}
