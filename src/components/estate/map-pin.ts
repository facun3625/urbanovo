import L from "leaflet";
import { PIN_HEIGHT, PIN_SVG, PIN_WIDTH } from "./map-pin-svg";

export { MAP_PIN_COLOR } from "./map-pin-svg";

export const MAP_PIN_ICON = L.divIcon({
  html: PIN_SVG,
  iconSize: [PIN_WIDTH, PIN_HEIGHT],
  iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT - 1],
  popupAnchor: [0, -42],
  className: "",
});
