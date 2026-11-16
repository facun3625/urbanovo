"use client";

import { contrastText } from "@/lib/contrast-color";
import { useStoreSettings } from "@/lib/store-settings-context";

// Encabezado de las páginas internas: una franja del color del menú
// (configurable en Página web → Identidad) con el título, sin foto.
export function PhotoBanner({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  const { menuBgColor } = useStoreSettings();
  return (
    <section style={{ backgroundColor: menuBgColor, color: contrastText(menuBgColor) }}>
      <div className="mx-auto w-full max-w-[1440px] border-t border-current/10 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {eyebrow && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[.3em] opacity-75">{eyebrow}</p>}
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm opacity-85 sm:text-base">{subtitle}</p>}
      </div>
    </section>
  );
}
