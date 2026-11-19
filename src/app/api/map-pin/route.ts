import sharp from "sharp";
import { getCurrentTenant } from "@/lib/tenant";
import { DEFAULT_MAP_PIN_BG_COLOR, DEFAULT_MAP_PIN_BORDER_COLOR, getStoreSettings } from "@/lib/settings";
import {
  PIN_HEAD_CENTER,
  PIN_HEIGHT,
  PIN_IMAGE_SIZE,
  PIN_WIDTH,
  pinSvg,
} from "@/components/estate/map-pin-svg";

// Pin de los mapas en PNG al doble de tamaño (se ve nítido en pantallas
// retina): el globito con los colores de Configuración → Mapas y la imagen
// elegida ahí (o el favicon) en la cabeza. Sin imagen, va la casita.
const SCALE = 2;
const IMAGE_SIZE = PIN_IMAGE_SIZE * SCALE;
const IMAGE_OFFSET = PIN_HEAD_CENTER * SCALE - IMAGE_SIZE / 2;

async function imageLayer(url: string | null) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await sharp(Buffer.from(await response.arrayBuffer()), { density: 300 })
      .resize(IMAGE_SIZE, IMAGE_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

export async function GET() {
  const tenant = await getCurrentTenant();
  const settings = tenant ? await getStoreSettings(tenant.id) : null;
  const style = settings?.mapPin ?? { borderColor: DEFAULT_MAP_PIN_BORDER_COLOR, bgColor: DEFAULT_MAP_PIN_BG_COLOR };
  const image = await imageLayer(settings?.mapPin.imageUrl ?? settings?.faviconUrl ?? null);

  let pin = sharp(Buffer.from(pinSvg(style, !image)), { density: 72 * SCALE }).resize(PIN_WIDTH * SCALE, PIN_HEIGHT * SCALE);
  if (image) {
    pin = sharp(await pin.png().toBuffer()).composite([{ input: image, left: IMAGE_OFFSET, top: IMAGE_OFFSET }]);
  }
  const png = await pin.png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
  });
}
