"use client";
import dynamic from "next/dynamic";
import { useMapProvider } from "@/lib/google-maps";
import type { MapProperty } from "./map-property-card";

function MapPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
      Cargando mapa…
    </div>
  );
}

const EstateMap = dynamic(() => import("./estate-map").then((m) => m.EstateMap), {
  ssr: false,
  loading: MapPlaceholder,
});

const GoogleEstateMap = dynamic(() => import("./google-estate-map").then((m) => m.GoogleEstateMap), {
  ssr: false,
  loading: MapPlaceholder,
});

// OpenStreetMap o Google Maps según Configuración → Mapas.
export function MapLoader({ properties }: { properties: MapProperty[] }) {
  const map = useMapProvider();
  if (map.provider === "google") return <GoogleEstateMap apiKey={map.apiKey} properties={properties} />;
  return <EstateMap properties={properties} />;
}
