import { money, labels } from "@/lib/estate/modules";

export type MapProperty = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  neighborhood: string;
  city: string;
  media: { url: string }[];
  listings: {
    id: string;
    operation: string;
    price: { toString(): string } | number | null;
    currency: string;
    showPrice: boolean;
  }[];
};

const OPERATION_COLOR: Record<string, string> = {
  SALE: "#1e658c",
  RENT: "#208ab1",
};

// Tarjetita de la propiedad que se abre al tocar un pin, igual en
// OpenStreetMap y en Google Maps. Con estilos en línea porque se dibuja
// dentro del popup de cada mapa, fuera del alcance de las clases del sitio.
export function MapPropertyCard({ property: p }: { property: MapProperty }) {
  const listing = p.listings[0];
  const color = listing ? (OPERATION_COLOR[listing.operation] ?? "#1e658c") : "#1e658c";
  return (
    <a
      href={`/propiedades/${p.id}`}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          position: "relative",
          height: 120,
          overflow: "hidden",
          borderRadius: 8,
          background: "#efefef",
        }}
      >
        {p.media[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.media[0].url}
            alt={p.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
        {listing && (
          <span
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              background: color,
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".04em",
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            {labels[listing.operation]}
          </span>
        )}
      </div>
      <div style={{ padding: "8px 2px 2px" }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
          {listing?.price && listing.showPrice
            ? money(listing.price, listing.currency)
            : "Consultar precio"}
        </p>
        <p
          style={{
            margin: "3px 0 0",
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {p.title}
        </p>
        <p
          style={{
            margin: "3px 0 0",
            fontSize: 11,
            color: "#757575",
          }}
        >
          {[p.neighborhood, p.city].filter(Boolean).join(", ")}
        </p>
      </div>
    </a>
  );
}
