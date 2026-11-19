"use client";

import { useEffect } from "react";
import { googlePinIcon } from "./google-map-pin";
import { useGoogleMap } from "./use-google-map";
import { useMapPinUrl } from "@/lib/google-maps";

// Versión Google Maps del mapa de ubicación de una propiedad u obra.
export function GoogleLocationMap({
  apiKey,
  latitude,
  longitude,
  name,
  address,
}: {
  apiKey: string;
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}) {
  const pinUrl = useMapPinUrl();
  const { ref, map } = useGoogleMap(apiKey, { center: { lat: latitude, lng: longitude }, zoom: 15 });

  useEffect(() => {
    if (!map) return;
    const position = { lat: latitude, lng: longitude };
    map.setCenter(position);
    const marker = new google.maps.Marker({ map, position, icon: googlePinIcon(pinUrl), title: name });
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = name;
    content.append(title, document.createElement("br"), address);
    const info = new google.maps.InfoWindow({ content });
    marker.addListener("click", () => info.open({ map, anchor: marker }));
    return () => {
      info.close();
      marker.setMap(null);
    };
  }, [map, latitude, longitude, name, address, pinUrl]);

  return <div ref={ref} style={{ height: "100%", width: "100%" }} />;
}
