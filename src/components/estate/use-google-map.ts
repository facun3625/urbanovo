"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";
import { GOOGLE_MAP_OPTIONS } from "./google-map-pin";

// Crea un mapa de Google dentro del div de `ref` (una sola vez) y lo
// devuelve cuando ya está listo; mientras tanto devuelve null.
export function useGoogleMap(apiKey: string, options: google.maps.MapOptions) {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const initialOptions = useRef(options);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(async () => {
        const { Map } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        await google.maps.importLibrary("marker");
        if (cancelled || !ref.current) return;
        setMap(new Map(ref.current, { ...GOOGLE_MAP_OPTIONS, ...initialOptions.current }));
      })
      .catch(() => {
        // useMapProvider ya pasa a OpenStreetMap cuando falla la carga.
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return { ref, map };
}
