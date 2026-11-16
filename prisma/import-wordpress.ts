// Importa las propiedades del sitio anterior (WordPress + theme Houzez) desde
// su API pública: https://urbanovo.com.ar/wp-json/wp/v2/properties
// Baja cada foto, la comprime a WebP y la sube al bucket R2, igual que una
// subida desde el admin.
//
// Uso:
//   DRY_RUN=1 npx tsx prisma/import-wordpress.ts   (solo muestra qué haría)
//   npx tsx prisma/import-wordpress.ts             (importa de verdad)
//
// Se niega a correr si ya hay propiedades cargadas, para no duplicarlas.
import "dotenv/config";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import { prisma } from "../src/lib/prisma";

const WP = "https://urbanovo.com.ar/wp-json/wp/v2";
const DRY_RUN = Boolean(process.env.DRY_RUN);
const IMAGE_CONCURRENCY = 6;

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

// ---------------- WordPress ----------------

type WpTerm = { id: number; name: string };
type WpProperty = {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  property_meta: Record<string, string[]>;
  property_status: number[];
  property_type: number[];
  property_city: number[];
  property_area: number[];
  property_state: number[];
  property_label: number[];
  property_feature: number[];
};
type WpMedia = { id: number; source_url: string };

async function wpGet<T>(path: string): Promise<T> {
  const res = await fetch(`${WP}/${path}`, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`WordPress respondió ${res.status} en ${path}`);
  return (await res.json()) as T;
}

async function wpTerms(taxonomy: string): Promise<Map<number, string>> {
  const terms = await wpGet<WpTerm[]>(`${taxonomy}?per_page=100&_fields=id,name`);
  return new Map(terms.map((t) => [t.id, decodeEntities(t.name)]));
}

async function wpMedia(ids: number[]): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const media = await wpGet<WpMedia[]>(`media?per_page=100&include=${chunk.join(",")}&_fields=id,source_url`);
    for (const m of media) out.set(m.id, m.source_url);
  }
  return out;
}

// ---------------- Texto ----------------

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h\d)>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

// "Capital." → "Capital", espacios dobles, etc. Los términos del sitio viejo
// tienen puntos finales y mayúsculas inconsistentes.
function cleanTerm(s: string): string {
  const t = s.replace(/\.+$/, "").replace(/\s+/g, " ").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

// ---------------- Números ----------------

// Superficie: prioriza el número pegado a "m2" ("3x6 18m2" → 18); si no hay,
// el primero. La coma y el punto son decimales (nadie escribe miles en m²).
function parseArea(text: string | undefined): number | null {
  if (!text) return null;
  const withUnit = text.match(/(\d+(?:[.,]\d+)?)\s*m[²2]/i);
  const m = withUnit ?? text.match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Ambientes/baños/cocheras: "1 y 2" → 1, "SI" → 1, "no"/"Opcional" → 0.
function parseCount(text: string | undefined): number {
  if (!text) return 0;
  const m = text.match(/\d+/);
  if (m) return parseInt(m[0], 10);
  return /^\s*s[ií]\s*$/i.test(text) ? 1 : 0;
}

// Precio con formato argentino: "$ 2.300.000" → 2300000, "USD 69000,00" →
// 69000, "Desde USD 80.000" → 80000. Sin número → null.
function parsePrice(text: string | undefined): number | null {
  if (!text) return null;
  const m = text.match(/\d[\d.,]*/);
  if (!m) return null;
  const raw = m[0].replace(/[.,](?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseCurrency(text: string, fallback: "USD" | "ARS"): "USD" | "ARS" {
  if (/u\$s|u\$d|usd|d[oó]lar/i.test(text)) return "USD";
  if (/\$|pesos|ars/i.test(text)) return "ARS";
  return fallback;
}

// ---------------- Catálogo ----------------

// En el sitio viejo una misma propiedad suele tener varias categorías a la
// vez (Departamento + PH + Oficina), así que el tipo sale primero del
// título, que es lo más confiable; si el título no lo dice, de las
// categorías en este orden. "Cochera" y "PH" van al final porque se usaban
// también como etiqueta de un departamento con cochera / interno. Los que
// no son tipos (Apta crédito, Piscina, Patio...) son características.
const TITLE_TYPES: { match: RegExp; type: string }[] = [
  { match: /monoambiente/i, type: "Monoambiente" },
  { match: /d[uú]plex/i, type: "Dúplex" },
  { match: /\bph\b/i, type: "PH" },
  { match: /\blotes?\b|terreno/i, type: "Terreno" },
  { match: /galp[oó]n/i, type: "Galpón" },
  { match: /^cochera/i, type: "Cochera" },
  { match: /\blocal\b/i, type: "Local" },
  { match: /oficina/i, type: "Oficina" },
  { match: /\bcasa\b|vivienda|quinta/i, type: "Casa" },
  { match: /departamento|\bde?pto\b|dormitorio|\bdorm\b|semipiso|\bpiso\b|interno/i, type: "Departamento" },
];
const TAXONOMY_TYPES: { match: RegExp; type: string }[] = [
  { match: /^local/i, type: "Local" },
  { match: /^galp[oó]n/i, type: "Galpón" },
  { match: /^oficina/i, type: "Oficina" },
  { match: /^casa/i, type: "Casa" },
  { match: /^terreno/i, type: "Terreno" },
  { match: /^monoambiente/i, type: "Monoambiente" },
  { match: /^d[uú]plex/i, type: "Dúplex" },
  { match: /^dep(artamento|to)/i, type: "Departamento" },
  { match: /^ph$/i, type: "PH" },
  { match: /^cochera/i, type: "Cochera" },
];
const NON_TYPE_TERMS = /apta cr[eé]dito|patio|piscina|planta alta/i;

const NEIGHBORHOOD_FIXES: Record<string, string> = {
  capital: "", // no es un barrio: es "Santa Fe Capital"
  "puerto de de santa fe": "Puerto de Santa Fe",
  "sargento cabrel": "Sargento Cabral",
  "centro sur": "Centro Sur",
  "zona norte": "Zona Norte",
  "country el pinar": "Country El Pinar",
  "fomento y 9 de julio": "Fomento 9 de Julio",
};

const CITY_FIXES: Record<string, string> = {
  "el paso country club": "El Paso Country Club",
  "santo tome": "Santo Tomé",
  peatonal: "Santa Fe",
};

// ---------------- Imágenes ----------------

async function uploadImage(sourceUrl: string, folder: string): Promise<string | null> {
  try {
    const res = await fetch(sourceUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const webp = await sharp(Buffer.from(await res.arrayBuffer()))
      .rotate()
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const key = `${folder}/${randomUUID()}.webp`;
    await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: webp, ContentType: "image/webp" }));
    return `${PUBLIC_URL}/${key}`;
  } catch (err) {
    console.error(`  ! foto ${sourceUrl}: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

// ---------------- Main ----------------

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No hay Tenant: corré primero `npx prisma db seed`.");
  const existing = await prisma.estateProperty.count({ where: { tenantId: tenant.id } });
  if (existing > 0 && !DRY_RUN) {
    throw new Error(`Ya hay ${existing} propiedades cargadas: no se importa para no duplicarlas.`);
  }

  const [statuses, types, cities, areas, states, features] = await Promise.all([
    wpTerms("property_status"),
    wpTerms("property_type"),
    wpTerms("property_city"),
    wpTerms("property_area"),
    wpTerms("property_state"),
    wpTerms("property_feature"),
  ]);
  const properties = await wpGet<WpProperty[]>("properties?per_page=100&status=publish");
  // Las más viejas primero: el código UN-001 es la primera que se cargó.
  properties.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`${properties.length} propiedades en WordPress.`);

  const catalog = {
    types: new Set((await prisma.estatePropertyType.findMany({ where: { tenantId: tenant.id } })).map((t) => t.name)),
    cities: new Set((await prisma.estateCity.findMany({ where: { tenantId: tenant.id } })).map((c) => c.name)),
    neighborhoods: new Set((await prisma.estateNeighborhood.findMany({ where: { tenantId: tenant.id } })).map((n) => n.name)),
  };
  const stats = { created: 0, photos: 0, failedPhotos: 0, available: 0, reserved: 0, rented: 0, sold: 0, hidden: 0 };

  for (const [index, p] of properties.entries()) {
    const meta = (k: string) => p.property_meta[k]?.[0]?.trim() ?? "";
    const code = `UN-${String(index + 1).padStart(3, "0")}`;
    const title = decodeEntities(p.title.rendered).trim() || "(sin título)";

    // ---- Operación ----
    const statusNames = p.property_status.map((id) => statuses.get(id) ?? "");
    const isSale = statusNames.some((s) => /venta/i.test(s));
    const isTemporary = statusNames.some((s) => /temporari/i.test(s));
    const operationFromStatus = isSale ? "SALE" : "RENT";

    // ---- Precio y estado ----
    // El campo de precio a veces trae el estado ("Alquilado.", "Vendido.",
    // "VENTA SUSPENDIDA") en vez del monto; en ese caso el monto, si está,
    // suele venir en el precio secundario.
    const priceText = [meta("fave_property_price_prefix"), meta("fave_property_price"), meta("fave_property_price_postfix")].join(" ");
    const secText = meta("fave_property_sec_price");
    let listingStatus = "AVAILABLE";
    let published = p.property_type.length > 0 || p.property_status.length > 0; // sin categorías = borrador abandonado
    if (/alquilad/i.test(priceText)) listingStatus = "RENTED";
    else if (/vendid/i.test(priceText)) listingStatus = "SOLD";
    else if (/reservad/i.test(priceText)) listingStatus = "RESERVED";
    else if (/suspendid/i.test(priceText)) published = false;
    const price = parsePrice(meta("fave_property_price")) ?? parsePrice(secText);
    const currency = parseCurrency(`${priceText} ${price === parsePrice(secText) ? secText : ""}`, isSale ? "USD" : "ARS");
    const showPrice = price != null && !/consultar/i.test(priceText);
    // Alquiladas y vendidas quedan cargadas como historial, pero no en el sitio.
    if (listingStatus === "RENTED" || listingStatus === "SOLD") published = false;
    // Hay ventas cargadas como alquiler ("USD 95.000" con estado Alquiler).
    const operation = operationFromStatus === "RENT" && currency === "USD" && (price ?? 0) >= 20000 ? "SALE" : operationFromStatus;

    // ---- Tipo y características ----
    const typeNames = p.property_type.map((id) => types.get(id) ?? "");
    const propertyType =
      TITLE_TYPES.find((r) => r.match.test(title))?.type ??
      TAXONOMY_TYPES.find((r) => typeNames.some((t) => r.match.test(t.trim())))?.type ??
      "Departamento";
    const creditEligible = typeNames.some((t) => /apta cr[eé]dito/i.test(t)) || /apto cr[eé]dito/i.test(secText) || null;
    const characteristics = [
      ...typeNames.filter((t) => NON_TYPE_TERMS.test(t) && !/apta cr[eé]dito/i.test(t)),
      ...p.property_feature.map((id) => features.get(id) ?? ""),
    ]
      .map(cleanTerm)
      .filter(Boolean);
    const uniqueCharacteristics = [...new Map(characteristics.map((c) => [c.toLowerCase(), c])).values()];

    // ---- Ubicación ----
    const rawCity = cleanTerm(cities.get(p.property_city[0]) ?? "");
    const rawArea = cleanTerm(areas.get(p.property_area[0]) ?? "");
    let city = CITY_FIXES[rawCity.toLowerCase()] ?? rawCity;
    let neighborhood = NEIGHBORHOOD_FIXES[rawArea.toLowerCase()] ?? rawArea;
    if (city === "Pichincha") [city, neighborhood] = ["Rosario", neighborhood || "Pichincha"];
    if (!city) {
      const state = cleanTerm(states.get(p.property_state[0]) ?? "");
      city = /rosario/i.test(state) ? "Rosario" : /santo tom/i.test(state) ? "Santo Tomé" : "Santa Fe";
    }
    if (neighborhood.toLowerCase() === city.toLowerCase()) neighborhood = "";
    const mapAddress = meta("fave_property_map_address");
    // El mapa de Houzez guarda "2737, 25 de Mayo, Barrio, Ciudad, ..." → "25 de Mayo 2737".
    const [first = "", second = ""] = mapAddress.split(",").map((s) => s.trim());
    const address = meta("fave_property_address") || (/^\d+$/.test(first) && second ? `${second} ${first}` : first);
    const lat = parseFloat(meta("houzez_geolocation_lat") || meta("fave_property_location").split(",")[0]);
    const lng = parseFloat(meta("houzez_geolocation_long") || meta("fave_property_location").split(",")[1]);

    // ---- Superficies y ambientes ----
    let coveredArea = parseArea(meta("fave_property_size") || meta("fave_property_size_prefix"));
    let totalArea = parseArea(meta("fave_property_land"));
    // Un terreno no tiene superficie cubierta: el único número es el del lote.
    if (totalArea == null && propertyType === "Terreno") [totalArea, coveredArea] = [coveredArea, null];
    const garageText = meta("fave_property_garage");
    const notes: string[] = [];
    if (uniqueCharacteristics.length) notes.push(`Características: ${uniqueCharacteristics.join(", ")}.`);
    if (/opcional/i.test(garageText)) notes.push("Cochera opcional.");
    if (meta("fave_property_price_postfix") && /disponible/i.test(meta("fave_property_price_postfix"))) {
      notes.push(`${cleanTerm(meta("fave_property_price_postfix"))}.`);
    }
    const description = [htmlToText(p.content.rendered), notes.join("\n")].filter(Boolean).join("\n\n");

    // ---- Fotos: la portada de WordPress va primera ----
    const thumbId = Number(meta("_thumbnail_id")) || null;
    const imageIds = [
      ...new Set([thumbId, ...(p.property_meta.fave_property_images ?? []).map(Number)].filter((n): n is number => Boolean(n))),
    ];

    const rooms = parseCount(meta("fave_property_rooms"));
    const bedrooms = parseCount(meta("fave_property_bedrooms")) || (rooms > 1 ? rooms - 1 : 0);

    console.log(
      `[${code}] ${title} — ${operation}${isTemporary ? " temp" : ""} ${price ?? "s/precio"} ${currency}${showPrice ? "" : " (oculto)"} — ${listingStatus}${published ? "" : " · no publicada"}`,
    );
    console.log(
      `   ${propertyType} · ${city}${neighborhood ? ` / ${neighborhood}` : ""} · ${address || "(sin dirección)"} · cub=${coveredArea ?? "-"} tot=${totalArea ?? "-"} dorm=${bedrooms} baños=${parseCount(meta("fave_property_bathrooms"))} coch=${parseCount(garageText)} · ${imageIds.length} fotos`,
    );

    if (listingStatus === "RENTED") stats.rented++;
    else if (listingStatus === "SOLD") stats.sold++;
    else if (!published) stats.hidden++;
    else if (listingStatus === "RESERVED") stats.reserved++;
    else stats.available++;
    if (DRY_RUN) {
      stats.created++;
      stats.photos += imageIds.length;
      continue;
    }

    // ---- Catálogos ----
    if (!catalog.types.has(propertyType)) {
      await prisma.estatePropertyType.create({ data: { tenantId: tenant.id, name: propertyType, order: catalog.types.size } });
      catalog.types.add(propertyType);
    }
    if (!catalog.cities.has(city)) {
      await prisma.estateCity.create({ data: { tenantId: tenant.id, name: city, order: catalog.cities.size } });
      catalog.cities.add(city);
    }
    if (neighborhood && !catalog.neighborhoods.has(neighborhood)) {
      await prisma.estateNeighborhood.create({ data: { tenantId: tenant.id, name: neighborhood, order: catalog.neighborhoods.size } });
      catalog.neighborhoods.add(neighborhood);
    }

    // ---- Fotos a R2 ----
    const sources = await wpMedia(imageIds);
    const uploaded = await mapLimit(imageIds, IMAGE_CONCURRENCY, async (id) => {
      const src = sources.get(id);
      return src ? uploadImage(src, `${tenant.id}/properties`) : null;
    });
    const mediaUrls = uploaded.filter((u): u is string => Boolean(u));
    stats.photos += mediaUrls.length;
    stats.failedPhotos += imageIds.length - mediaUrls.length;

    // ---- Propiedad ----
    const property = await prisma.estateProperty.create({
      data: {
        tenantId: tenant.id,
        code,
        title,
        description,
        // Los Shorts van a su propio campo (se ven verticales).
        ...(/\/shorts\/([A-Za-z0-9_-]{11})/.test(meta("fave_video_url") || "")
          ? { shortUrl: `https://www.youtube.com/shorts/${/\/shorts\/([A-Za-z0-9_-]{11})/.exec(meta("fave_video_url"))![1]}` }
          : { videoUrl: meta("fave_video_url") || null }),
        creditEligible,
        propertyType,
        address,
        mapAddress: mapAddress || null,
        city,
        neighborhood,
        bedrooms,
        bathrooms: parseCount(meta("fave_property_bathrooms")),
        garages: parseCount(garageText),
        coveredArea,
        totalArea,
        latitude: Number.isFinite(lat) ? lat : null,
        longitude: Number.isFinite(lng) ? lng : null,
        published,
        featured: meta("fave_featured") === "1",
      },
    });
    await prisma.estateListing.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        operation,
        temporary: operation === "RENT" && isTemporary,
        currency,
        price,
        showPrice,
        status: listingStatus,
      },
    });
    if (mediaUrls.length) {
      await prisma.estateMedia.createMany({
        data: mediaUrls.map((url, position) => ({ tenantId: tenant.id, propertyId: property.id, url, position })),
      });
    }
    stats.created++;
    console.log(`   ✓ ${mediaUrls.length}/${imageIds.length} fotos subidas`);
  }

  console.log(
    `\n${DRY_RUN ? "[PRUEBA, no se escribió nada] " : ""}${stats.created} propiedades: ${stats.available} disponibles, ${stats.reserved} reservadas, ${stats.rented} alquiladas, ${stats.sold} vendidas, ${stats.hidden} sin publicar. Fotos: ${stats.photos}${stats.failedPhotos ? ` (${stats.failedPhotos} fallaron)` : ""}.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
