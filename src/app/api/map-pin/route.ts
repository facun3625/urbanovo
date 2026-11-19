import sharp from "sharp";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { PIN_HEIGHT, PIN_WIDTH, pinSvg } from "@/components/estate/map-pin-svg";

// Pin de los mapas en PNG al doble de tamaño (se ve nítido en pantallas
// retina): el globito con el favicon del sitio en la cabeza. Sin favicon,
// o si no se puede leer, va la casita.
const SCALE = 2;
// Cuadrado donde va el favicon, centrado en la cabeza del globito (centro
// en 18,18 del pin de 36×46).
const ICON_SIZE = 20 * SCALE;
const ICON_OFFSET = 18 * SCALE - ICON_SIZE / 2;

async function faviconLayer(faviconUrl: string | null) {
  if (!faviconUrl) return null;
  try {
    const response = await fetch(faviconUrl);
    if (!response.ok) return null;
    return await sharp(Buffer.from(await response.arrayBuffer()), { density: 300 })
      .resize(ICON_SIZE, ICON_SIZE, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

export async function GET() {
  const tenant = await getCurrentTenant();
  const faviconUrl = tenant ? (await getStoreSettings(tenant.id)).faviconUrl : null;
  const icon = await faviconLayer(faviconUrl);

  let pin = sharp(Buffer.from(pinSvg(!icon)), { density: 72 * SCALE }).resize(PIN_WIDTH * SCALE, PIN_HEIGHT * SCALE);
  if (icon) {
    pin = sharp(await pin.png().toBuffer()).composite([{ input: icon, left: ICON_OFFSET, top: ICON_OFFSET }]);
  }
  const png = await pin.png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
  });
}
