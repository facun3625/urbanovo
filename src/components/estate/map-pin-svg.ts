// Pin de los mapas (OpenStreetMap y Google Maps): globito blanco con borde
// del color de la marca y el favicon del sitio adentro. La imagen la arma
// /api/map-pin (en el servidor, porque un SVG usado como imagen no puede
// cargar el favicon de otro dominio).
export const MAP_PIN_COLOR = "#2a7186";
export const PIN_WIDTH = 36;
export const PIN_HEIGHT = 46;

const GLOBE_PATH =
  "M18 1.5C8.9 1.5 1.5 8.9 1.5 18c0 12.2 16.5 26.5 16.5 26.5S34.5 30.2 34.5 18C34.5 8.9 27.1 1.5 18 1.5z";
const HOUSE_PATH = "M18 9.5 9.5 16.6h2.6v8.4h4.3v-5.2h3.2v5.2h4.3v-8.4h2.6z";

// Globito vacío; con `withHouse` lleva la casita (para sitios sin favicon).
export function pinSvg(withHouse: boolean) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_WIDTH}" height="${PIN_HEIGHT}" viewBox="0 0 ${PIN_WIDTH} ${PIN_HEIGHT}">
  <path d="${GLOBE_PATH}" fill="#fff" stroke="${MAP_PIN_COLOR}" stroke-width="2.5"/>
  ${withHouse ? `<path d="${HOUSE_PATH}" fill="${MAP_PIN_COLOR}"/>` : ""}
</svg>`;
}

// URL del pin: cambia cuando cambia el favicon, así el navegador no se
// queda con el pin viejo en caché.
export function mapPinUrl(faviconUrl: string | null) {
  const version = faviconUrl?.split("/").pop()?.split(".")[0] ?? "none";
  return `/api/map-pin?v=${version}`;
}
