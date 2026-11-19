"use client";

import { useEffect, useRef } from "react";
import { googlePinIcon } from "./google-map-pin";
import { useGoogleMap } from "./use-google-map";

// Versión Google Maps del mapa del selector de ubicación del admin: clic en
// el mapa o arrastrar el pin para elegir el punto.
export function GooglePickerMap({
  apiKey,
  pinUrl,
  point,
  defaultCenter,
  onPick,
}: {
  apiKey: string;
  pinUrl: string;
  point: [number, number] | null;
  defaultCenter: [number, number];
  onPick: (lat: number, lng: number) => void;
}) {
  const start = point ?? defaultCenter;
  const { ref, map } = useGoogleMap(apiKey, {
    center: { lat: start[0], lng: start[1] },
    zoom: point ? 15 : 12,
    // En el admin el mapa se usa para ubicar el pin: zoom con la rueda directo.
    gestureHandling: "greedy",
  });
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  });

  useEffect(() => {
    if (!map) return;
    const marker = new google.maps.Marker({ map: null, icon: googlePinIcon(pinUrl), draggable: true });
    markerRef.current = marker;
    const dragListener = marker.addListener("dragend", () => {
      const position = marker.getPosition();
      if (position) onPickRef.current(position.lat(), position.lng());
    });
    const clickListener = map.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (event.latLng) onPickRef.current(event.latLng.lat(), event.latLng.lng());
    });
    return () => {
      dragListener.remove();
      clickListener.remove();
      marker.setMap(null);
      markerRef.current = null;
    };
  }, [map, pinUrl]);

  // Mover el pin (y el mapa) cuando cambia el punto: búsqueda, clic,
  // arrastre o coordenadas a mano.
  const lat = point?.[0];
  const lng = point?.[1];
  useEffect(() => {
    const marker = markerRef.current;
    if (!map || !marker) return;
    if (lat === undefined || lng === undefined) {
      marker.setMap(null);
      return;
    }
    marker.setPosition({ lat, lng });
    marker.setMap(map);
    map.panTo({ lat, lng });
    if ((map.getZoom() ?? 0) < 13) map.setZoom(15);
  }, [map, lat, lng, pinUrl]);

  return <div ref={ref} style={{ height: "100%", width: "100%" }} />;
}
