import { PIN_HEIGHT, PIN_WIDTH } from "./map-pin-svg";

// Pin para los mapas de Google (ver mapPinUrl). Se arma recién al usarlo
// porque google.maps existe solo después de cargar el script.
export function googlePinIcon(url: string): google.maps.Icon {
  return {
    url,
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
