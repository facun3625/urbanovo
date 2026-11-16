import { z } from "zod";

import { ABOUT_VALUE_ICONS, type AboutValueIcon } from "@/lib/about-values";

// Página "Administración de consorcios" (/administracion-de-consorcios).
// Todo el contenido se edita desde Página web → Consorcios y se guarda en
// Settings ("consorcio_page"). Apagada, no aparece en el menú y da 404.
// Este archivo no toca la base: lo usa también el formulario del panel.
export const CONSORCIO_KEY = "consorcio_page";
export const CONSORCIO_PATH = "/administracion-de-consorcios";
export const MAX_CONSORCIO_ITEMS = 12;

const iconKeys = ABOUT_VALUE_ICONS.map((i) => i.key) as [AboutValueIcon, ...AboutValueIcon[]];
const text = (max: number) => z.string().trim().max(max);

export const consorcioSchema = z.object({
  show: z.boolean(),
  menuLabel: text(40),
  eyebrow: text(60),
  title: text(120),
  // Texto plano: cada línea en blanco separa un párrafo.
  intro: text(3000),
  servicesTitle: text(120),
  items: z
    .array(z.object({ icon: z.enum(iconKeys), title: text(80), text: text(400) }))
    .max(MAX_CONSORCIO_ITEMS),
  ctaEyebrow: text(60),
  ctaTitle: text(120),
});
export type ConsorcioPage = z.infer<typeof consorcioSchema>;

export const CONSORCIO_DEFAULT: ConsorcioPage = {
  show: true,
  menuLabel: "Consorcios",
  eyebrow: "Servicios",
  title: "Administración de consorcios",
  intro:
    "Somos una empresa que se dedica a la Administración de Consorcios y Edificios, que busca brindar siempre el mejor servicio a todos nuestros clientes, cualidad que nos convirtió en la mejor opción de la región. Nuestros años de experiencia y los clientes complacidos lo avalan.",
  servicesTitle: "Qué hacemos",
  items: [
    {
      icon: "building",
      title: "Asesoramiento en propiedad horizontal",
      text: "Para la constitución de nuevos edificios, condominios o barrios privados.",
    },
    {
      icon: "briefcase",
      title: "Administración y liquidación de expensas",
      text: "De edificios, consorcios y barrios privados, para el funcionamiento y conservación de inmuebles existentes.",
    },
    {
      icon: "shield",
      title: "Sistema bancarizado",
      text: "Para la recaudación de expensas en propiedad horizontal.",
    },
    {
      icon: "badge",
      title: "Gestión de pagos",
      text: "Administración, liquidación y gestión de pago, tanto de expensas como de gastos particulares de las unidades.",
    },
    {
      icon: "key",
      title: "Unidades alquiladas",
      text: "Liquidación diferenciada de los gastos a cargo de inquilinos.",
    },
    {
      icon: "house",
      title: "Mantenimiento",
      text: "Asesoramos a los propietarios para el mantenimiento de sus propiedades.",
    },
  ],
  ctaEyebrow: "Hablemos",
  ctaTitle: "¿Necesitás administrar tu edificio o consorcio?",
};

export function mergeConsorcio(stored: unknown): ConsorcioPage {
  const raw = stored && typeof stored === "object" ? stored : {};
  const parsed = consorcioSchema.safeParse({ ...CONSORCIO_DEFAULT, ...raw });
  return parsed.success ? parsed.data : CONSORCIO_DEFAULT;
}

export function parseConsorcio(value: string | undefined): ConsorcioPage {
  try {
    return mergeConsorcio(value ? JSON.parse(value) : null);
  } catch {
    return mergeConsorcio(null);
  }
}
