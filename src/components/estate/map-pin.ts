import L from "leaflet";
import { PIN_HEIGHT, PIN_WIDTH } from "./map-pin-svg";

// Pin para los mapas de OpenStreetMap (ver mapPinUrl).
export function leafletPinIcon(url: string) {
  return L.icon({
    iconUrl: url,
    iconSize: [PIN_WIDTH, PIN_HEIGHT],
    iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT - 1],
    popupAnchor: [0, -42],
    className: "drop-shadow-md",
  });
}
