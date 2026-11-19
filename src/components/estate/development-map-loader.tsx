"use client";

import dynamic from "next/dynamic";
import { useMapProvider } from "@/lib/google-maps";

function MapPlaceholder() {
  return <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">Cargando mapa…</div>;
}

const DevelopmentLocationMap = dynamic(
  () => import("./development-location-map").then((module) => module.DevelopmentLocationMap),
  { ssr: false, loading: MapPlaceholder },
);

const GoogleLocationMap = dynamic(() => import("./google-location-map").then((module) => module.GoogleLocationMap), {
  ssr: false,
  loading: MapPlaceholder,
});

type Props = { latitude: number; longitude: number; name: string; address: string };

// OpenStreetMap o Google Maps según Configuración → Mapas.
export function DevelopmentMapLoader(props: Props) {
  const map = useMapProvider();
  if (map.provider === "google") return <GoogleLocationMap apiKey={map.apiKey} {...props} />;
  return <DevelopmentLocationMap {...props} />;
}
