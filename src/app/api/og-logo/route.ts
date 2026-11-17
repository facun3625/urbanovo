import sharp from "sharp";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";

// Imagen al compartir el sitio (WhatsApp, Facebook...): el logo centrado
// sobre fondo blanco en 1200×630, el tamaño que piden las redes. Va en PNG
// porque no todas aceptan WebP. El logo entra con margen para que los
// recortes cuadrados de las vistas previas chicas no lo corten.
const WIDTH = 1200;
const HEIGHT = 630;

export async function GET() {
  const tenant = await getCurrentTenant();
  if (!tenant) return new Response("Not found", { status: 404 });
  const { logoUrl } = await getStoreSettings(tenant.id);
  if (!logoUrl) return new Response("Not found", { status: 404 });

  const upstream = await fetch(logoUrl);
  if (!upstream.ok) return new Response("Upstream error", { status: 502 });
  const logo = await sharp(Buffer.from(await upstream.arrayBuffer()), { density: 300 })
    .resize({ width: 960, height: 300, fit: "inside" })
    .png()
    .toBuffer();

  const png = await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: "#ffffff" },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
  });
}
