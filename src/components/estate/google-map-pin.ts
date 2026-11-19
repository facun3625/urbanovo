import { PIN_HEIGHT, PIN_SVG, PIN_WIDTH } from "./map-pin-svg";

// El mismo pin de la marca, como ícono de marcador de Google Maps. Se arma
// recién al usarlo porque google.maps existe solo después de cargar el script.
export function googlePinIcon(): google.maps.Icon {
  return {
    // El filtro de sombra del SVG no lo dibuja Google en <img>, lo sacamos.
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(PIN_SVG.replace(/ style="[^"]*"/, ""))}`,
    scaledSize: new google.maps.Size(PIN_WIDTH, PIN_HEIGHT),
    anchor: new google.maps.Point(PIN_WIDTH / 2, PIN_HEIGHT - 1),
  };
}

export const GOOGLE_MAP_OPTIONS: google.maps.MapOptions = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  clickableIcons: false,
  // Con un dedo se scrollea la página; para mover el mapa, dos dedos o Ctrl.
  gestureHandling: "cooperative",
};
