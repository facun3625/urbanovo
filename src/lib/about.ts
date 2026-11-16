import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { ABOUT_VALUES_KEY, mergeAboutValues, type AboutValues } from "@/lib/about-values";
import { HOME_SHORTS_KEY, mergeHomeShorts, type HomeShorts } from "@/lib/home-shorts";

export type AboutMediaItem = { id: string; type: "IMAGE" | "VIDEO"; url: string };
export type AboutContent = { text: string | null; columns: boolean; media: AboutMediaItem[] };

export const getAboutContent = cache(async (tenantId: string): Promise<AboutContent> => {
  const [textSetting, columnsSetting, media] = await Promise.all([
    prisma.settings.findUnique({ where: { tenantId_key: { tenantId, key: "about_text" } } }),
    prisma.settings.findUnique({ where: { tenantId_key: { tenantId, key: "about_text_columns" } } }),
    prisma.aboutMedia.findMany({ where: { tenantId }, orderBy: { order: "asc" } }),
  ]);
  return {
    text: textSetting?.value ?? null,
    columns: columnsSetting?.value === "true",
    media: media.map((m) => ({ id: m.id, type: m.type, url: m.url })),
  };
});

export const getAboutValues = cache(async (tenantId: string): Promise<AboutValues> => {
  const row = await prisma.settings.findUnique({
    where: { tenantId_key: { tenantId, key: ABOUT_VALUES_KEY } },
  });
  let stored: unknown = null;
  try {
    stored = row ? JSON.parse(row.value) : null;
  } catch {
    stored = null;
  }
  return mergeAboutValues(stored);
});

// Bloque de Shorts del Inicio (vive acá con el resto del contenido editable
// que se lee de Settings como JSON).
export const getHomeShorts = cache(async (tenantId: string): Promise<HomeShorts> => {
  const row = await prisma.settings.findUnique({
    where: { tenantId_key: { tenantId, key: HOME_SHORTS_KEY } },
  });
  let stored: unknown = null;
  try {
    stored = row ? JSON.parse(row.value) : null;
  } catch {
    stored = null;
  }
  return mergeHomeShorts(stored);
});
