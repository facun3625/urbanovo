import L from "leaflet";

// Azul de la marca (el mismo del menú y el pie del sitio).
export const MAP_PIN_COLOR = "#1c3054";

// Pin de mapa con una casita blanca en la cabeza.
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46" style="display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))">
  <path d="M18 1.5C8.9 1.5 1.5 8.9 1.5 18c0 12.2 16.5 26.5 16.5 26.5S34.5 30.2 34.5 18C34.5 8.9 27.1 1.5 18 1.5z" fill="${MAP_PIN_COLOR}" stroke="#fff" stroke-width="2.5"/>
  <path d="M18 9.5 9.5 16.6h2.6v8.4h4.3v-5.2h3.2v5.2h4.3v-8.4h2.6z" fill="#fff"/>
</svg>`;

export const MAP_PIN_ICON = L.divIcon({
  html: PIN_SVG,
  iconSize: [36, 46],
  iconAnchor: [18, 45],
  popupAnchor: [0, -42],
  className: "",
});
