"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_PIN_ICON } from "./map-pin";

import { MapPropertyCard, type MapProperty } from "./map-property-card";

export type { MapProperty };

function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(points, { padding: [48, 48], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);
  return null;
}

export function EstateMap({ properties }: { properties: MapProperty[] }) {
  const points: [number, number][] = properties.map((p) => [
    p.latitude,
    p.longitude,
  ]);
  const center: [number, number] = points[0] ?? [-31.4201, -64.1888];

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToMarkers points={points} />
      {properties.map((p) => {
        return (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={MAP_PIN_ICON}
          >
            <Popup minWidth={200} maxWidth={220}>
              <MapPropertyCard property={p} />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
