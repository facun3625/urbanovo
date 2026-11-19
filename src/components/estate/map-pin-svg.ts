// Pin de los mapas (OpenStreetMap y Google Maps): globito con los colores de
// Configuración → Mapas y una imagen adentro (la elegida ahí o el favicon).
// La imagen final la arma /api/map-pin en el servidor, porque un SVG usado
// como imagen no puede cargar una foto de otro dominio.
export const DEFAULT_MAP_PIN_BORDER_COLOR = "#2a7186";
export const DEFAULT_MAP_PIN_BG_COLOR = "#ffffff";
export const PIN_WIDTH = 36;
export const PIN_HEIGHT = 46;
// Cabeza del globito: centro (18,18) y lado del cuadrado donde va la imagen.
export const PIN_HEAD_CENTER = 18;
export const PIN_IMAGE_SIZE = 26;

export const GLOBE_PATH =
  "M18 1.5C8.9 1.5 1.5 8.9 1.5 18c0 12.2 16.5 26.5 16.5 26.5S34.5 30.2 34.5 18C34.5 8.9 27.1 1.5 18 1.5z";
export const HOUSE_PATH = "M18 9.5 9.5 16.6h2.6v8.4h4.3v-5.2h3.2v5.2h4.3v-8.4h2.6z";

export type PinStyle = { borderColor: string; bgColor: string };

// Globito vacío; con `withHouse` lleva la casita (cuando no hay imagen).
export function pinSvg({ borderColor, bgColor }: PinStyle, withHouse: boolean) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_WIDTH}" height="${PIN_HEIGHT}" viewBox="0 0 ${PIN_WIDTH} ${PIN_HEIGHT}">
  <path d="${GLOBE_PATH}" fill="${bgColor}" stroke="${borderColor}" stroke-width="2.5"/>
  ${withHouse ? `<path d="${HOUSE_PATH}" fill="${borderColor}"/>` : ""}
</svg>`;
}

// URL del pin: cambia cuando cambian los colores o la imagen, así el
// navegador no se queda con el pin viejo en caché.
export function mapPinUrl(pin: PinStyle & { imageUrl: string | null }, faviconUrl: string | null) {
  const key = `${PIN_IMAGE_SIZE}|${pin.borderColor}|${pin.bgColor}|${pin.imageUrl ?? faviconUrl ?? ""}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return `/api/map-pin?v=${(hash >>> 0).toString(36)}`;
}
