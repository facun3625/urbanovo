"use client";

import { useSyncExternalStore } from "react";
import { useStoreSettings } from "@/lib/store-settings-context";

// Carga del script de Google Maps (una sola vez por página) y detección de
// clave inválida: Google llama a window.gm_authFailure cuando la clave no
// sirve (mal pegada, sin facturación o sin el dominio en las restricciones).
// En ese caso los mapas vuelven solos a OpenStreetMap, así el sitio nunca
// queda con el cartel gris de error de Google.

declare global {
  interface Window {
    gm_authFailure?: () => void;
    __urbanovoMapsReady?: () => void;
  }
}

let loading: Promise<void> | null = null;
let authFailed = false;
const listeners = new Set<() => void>();

function markFailed() {
  authFailed = true;
  listeners.forEach((listener) => listener());
}

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Sin navegador"));
  if (typeof window.google?.maps?.importLibrary === "function") return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    window.gm_authFailure = markFailed;
    window.__urbanovoMapsReady = () => resolve();
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      loading: "async",
      language: "es",
      region: "AR",
      callback: "__urbanovoMapsReady",
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      markFailed();
      reject(new Error("No se pudo cargar Google Maps"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Qué mapa mostrar: Google solo si está elegido, hay clave y Google no la
// rechazó en esta página.
export function useMapProvider(): { provider: "google"; apiKey: string } | { provider: "osm" } {
  const { mapProvider, googleMapsApiKey } = useStoreSettings();
  const failed = useSyncExternalStore(subscribe, () => authFailed, () => false);
  if (mapProvider === "google" && googleMapsApiKey && !failed) {
    return { provider: "google", apiKey: googleMapsApiKey };
  }
  return { provider: "osm" };
}
