import { z } from "zod";

// Bloque "videos verticales" del Inicio: YouTube Shorts embebidos en
// formato 9:16, cargados desde Página web → Inicio. Se guardan en Settings
// ("home_shorts"). Este archivo no toca la base: lo usa también el
// formulario del panel.
export const HOME_SHORTS_KEY = "home_shorts";
export const MAX_HOME_SHORTS = 8;

const text = (max: number) => z.string().trim().max(max);

export const homeShortsSchema = z.object({
  show: z.boolean(),
  title: text(120),
  subtitle: text(300),
  videos: z.array(text(300)).max(MAX_HOME_SHORTS),
});
export type HomeShorts = z.infer<typeof homeShortsSchema>;

export const HOME_SHORTS_DEFAULT: HomeShorts = {
  show: false,
  title: "Nuestras Propiedades",
  subtitle: "Te ayudamos a buscar la propiedad de tus sueños",
  videos: [],
};

export function mergeHomeShorts(stored: unknown): HomeShorts {
  const parsed = homeShortsSchema.safeParse(stored);
  return parsed.success ? parsed.data : HOME_SHORTS_DEFAULT;
}

// Acepta youtube.com/shorts/ID, youtube.com/watch?v=ID, youtu.be/ID,
// youtube.com/embed/ID o el ID solo. Devuelve null si no es de YouTube.
export function youtubeId(raw: string): string | null {
  const value = raw.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/);
      id = m?.[2] ?? null;
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}
