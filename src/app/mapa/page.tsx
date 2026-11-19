import { getStoreSettings } from "@/lib/settings";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MapPinOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { MapLoader } from "@/components/estate/map-loader";
import { PropertySearchForm } from "@/components/estate/property-search-form";
import { ViewToggle, toResultsQueryString } from "@/components/estate/view-toggle";
import { estatePropertyFilterOptions } from "@/lib/estate/data";
import { parseCatalogFilters, buildPublishedPropertyWhere, listingOperationWhere } from "@/lib/estate/catalog-filters";
import { getPublicCatalogFilters, getCatalogFilterLabels } from "@/lib/estate/catalog-filter-settings";

export const metadata = {
  title: "Propiedades en el mapa",
  description: "Buscá casas, departamentos y terrenos en venta y alquiler sobre el mapa.",
  alternates: { canonical: "/mapa" },
};

export default async function MapaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const search = await searchParams;

  const [enabledFilters, filterOptions, filterLabels, { publicStatuses: statuses }] = await Promise.all([
    getPublicCatalogFilters(tenant.id),
    estatePropertyFilterOptions(tenant.id, { publishedOnly: true }),
    getCatalogFilterLabels(tenant.id),
    getStoreSettings(tenant.id),
  ]);
  const filters = parseCatalogFilters(search, enabledFilters, {
    propertyTypes: filterOptions.propertyTypes,
    cities: filterOptions.cities,
    neighborhoods: filterOptions.neighborhoods,
  });

  // Chips de ciudades arriba del mapa: funcionan aunque "Ciudad" no esté
  // entre los filtros del buscador. Cuentan las propiedades con ubicación
  // que cumplen el resto de los filtros (sin el de ciudad).
  const selectedCity = filterOptions.cities.includes(search.city ?? "") ? search.city : undefined;
  const mapFilters = { ...filters, city: selectedCity };
  const cityRows = await prisma.estateProperty.findMany({
    where: {
      ...buildPublishedPropertyWhere(tenant.id, { ...filters, city: undefined }, statuses),
      latitude: { not: null },
      longitude: { not: null },
    },
    select: { city: true },
  });
  const cityCounts = [
    ...cityRows
      .reduce((acc, { city }) => (city ? acc.set(city, (acc.get(city) ?? 0) + 1) : acc), new Map<string, number>())
      .entries(),
  ].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
  const cityHref = (city?: string) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) if (value && key !== "city") params.set(key, value);
    if (city) params.set("city", city);
    const qs = params.toString();
    return qs ? `/mapa?${qs}` : "/mapa";
  };

  const properties = await prisma.estateProperty.findMany({
    where: buildPublishedPropertyWhere(tenant.id, mapFilters, statuses),
    select: {
      id: true,
      title: true,
      city: true,
      neighborhood: true,
      latitude: true,
      longitude: true,
      media: { orderBy: { position: "asc" }, take: 1 },
      listings: {
        where: { status: { in: statuses }, ...listingOperationWhere(filters.operation) },
      },
    },
    orderBy: [{ featured: "desc" }, { featuredOrder: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  const withCoords = properties
    .filter((p) => p.latitude !== null && p.longitude !== null)
    .map((p) => ({
      ...p,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      listings: p.listings.map((l) => ({
        ...l,
        price: l.price ? Number(l.price) : null,
      })),
    }));
  const withoutCoords = properties.length - withCoords.length;

  return (
    <div className="public-inner-page public-map-page flex flex-1 flex-col">
      <StoreHero />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col bg-background">
        <div className="public-page-intro mx-auto flex w-full max-w-5xl flex-col items-center gap-5 px-4 py-7 text-center sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Zona de cobertura
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              Propiedades en el mapa
            </h1>
          </div>

          <PropertySearchForm
            enabledKeys={enabledFilters}
            labels={filterLabels}
            values={{
              q: search.q ?? "",
              operation: search.operation ?? "",
              propertyType: search.propertyType ?? "",
              city: search.city ?? "",
              neighborhood: search.neighborhood ?? "",
              bedrooms: search.bedrooms ?? "",
              bathrooms: search.bathrooms ?? "",
              garages: search.garages ?? "",
              orientation: search.orientation ?? "",
              petsPolicy: search.petsPolicy ?? "",
              creditEligible: search.creditEligible ?? "",
            }}
            propertyTypes={filterOptions.propertyTypes}
            cities={filterOptions.cities}
            neighborhoods={filterOptions.neighborhoods}
          />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {withCoords.length === 0
                ? "Sin propiedades con ubicación cargada"
                : `${withCoords.length} propiedad${withCoords.length === 1 ? "" : "es"} en el mapa`}
              {withoutCoords > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
                  <MapPinOff className="size-3.5" />
                  {withoutCoords} sin coordenadas
                </span>
              )}
            </p>
            <ViewToggle active="map" query={toResultsQueryString(search)} />
          </div>

          {cityCounts.length > 1 && (
            <nav aria-label="Filtrar por ciudad" className="flex max-w-full flex-wrap justify-center gap-2">
              {[{ city: undefined, label: "Todas", count: cityRows.length }, ...cityCounts.map(([city, count]) => ({ city, label: city, count }))].map(
                (c) => {
                  const active = c.city === selectedCity;
                  return (
                    <Link
                      key={c.label}
                      href={cityHref(c.city)}
                      scroll={false}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                      )}
                    >
                      {c.city && <MapPin className="size-3.5" />}
                      {c.label}
                      <span className={cn("text-xs", active ? "opacity-80" : "text-muted-foreground")}>{c.count}</span>
                    </Link>
                  );
                },
              )}
            </nav>
          )}
        </div>

        <div className="h-[min(70dvh,760px)] min-h-[360px] w-full px-4 pb-8 sm:min-h-[440px] sm:px-6 lg:px-10">
          <div className="size-full overflow-hidden rounded-2xl border">
            <MapLoader properties={withCoords} />
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
