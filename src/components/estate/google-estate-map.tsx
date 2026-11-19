"use client";

import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { googlePinIcon } from "./google-map-pin";
import { MapPropertyCard, type MapProperty } from "./map-property-card";
import { useGoogleMap } from "./use-google-map";
import { useMapPinUrl } from "@/lib/google-maps";

// Versión Google Maps del mapa de propiedades (página /mapa).
export function GoogleEstateMap({ apiKey, properties }: { apiKey: string; properties: MapProperty[] }) {
  const first = properties[0];
  const pinUrl = useMapPinUrl();
  const { ref, map } = useGoogleMap(apiKey, {
    center: first ? { lat: first.latitude, lng: first.longitude } : { lat: -31.4201, lng: -64.1888 },
    zoom: 13,
  });

  useEffect(() => {
    if (!map) return;
    const icon = googlePinIcon(pinUrl);
    const info = new google.maps.InfoWindow({ maxWidth: 240 });
    const cardHolder = document.createElement("div");
    cardHolder.style.width = "210px";
    const cardRoot = createRoot(cardHolder);

    const markers = properties.map((p) => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: p.latitude, lng: p.longitude },
        icon,
        title: p.title,
      });
      marker.addListener("click", () => {
        cardRoot.render(<MapPropertyCard property={p} />);
        info.setContent(cardHolder);
        info.open({ map, anchor: marker });
      });
      return marker;
    });

    if (properties.length === 1) {
      map.setCenter({ lat: properties[0].latitude, lng: properties[0].longitude });
      map.setZoom(14);
    } else if (properties.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      properties.forEach((p) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
      map.fitBounds(bounds, 48);
      // Igual que en OpenStreetMap: no acercar más que una vista de barrio.
      google.maps.event.addListenerOnce(map, "idle", () => {
        if ((map.getZoom() ?? 0) > 15) map.setZoom(15);
      });
    }

    return () => {
      info.close();
      markers.forEach((marker) => marker.setMap(null));
      // Desmontar en otro tick: React no deja desmontar un root durante un render.
      setTimeout(() => cardRoot.unmount());
    };
  }, [map, properties, pinUrl]);

  return <div ref={ref} style={{ height: "100%", width: "100%" }} />;
}
