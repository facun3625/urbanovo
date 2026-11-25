import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Building2, MapPin, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import { PhotoBanner } from "@/components/catalog/photo-banner";
import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { WhatsAppIcon } from "@/components/catalog/social-icons";
import { AboutValueIcon } from "@/components/catalog/about-value-icon";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { toWhatsAppLink } from "@/lib/social-links";
import { CONSORCIO_PATH } from "@/lib/consorcio";

export const metadata = {
  title: "Administración de consorcios",
  description:
    "Administración de consorcios, edificios y barrios privados: liquidación de expensas, cobranza bancarizada y asesoramiento en propiedad horizontal.",
  alternates: { canonical: CONSORCIO_PATH },
};

export default async function ConsorciosPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const settings = await getStoreSettings(tenant.id);
  const page = settings.consorcio;
  if (!page.show) notFound();
  const { phone, whatsapp, address } = settings;

  const paragraphs = page.intro.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const count = page.items.length;
  const buildings = page.buildings.filter((b) => b.image || b.name);

  return (
    <div className="public-inner-page public-content-page flex flex-1 flex-col">
      <StoreHero />
      <PhotoBanner eyebrow={page.eyebrow} title={page.title} />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col bg-background">
        <div className="flex flex-col gap-14 px-4 py-12 sm:px-6 lg:gap-16 lg:px-8 lg:py-20">
          {paragraphs.length > 0 && (
            <div className="mx-auto flex max-w-3xl flex-col gap-4 text-center text-base leading-relaxed text-muted-foreground lg:text-lg">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          )}

          {count > 0 && (
            <div>
              {page.servicesTitle && (
                <h2 className="mb-10 text-center text-2xl font-semibold sm:text-3xl">{page.servicesTitle}</h2>
              )}
              <div
                className={cn(
                  "grid gap-5",
                  count === 1
                    ? "mx-auto w-full max-w-md"
                    : count === 2 || count === 4
                      ? "mx-auto w-full max-w-4xl sm:grid-cols-2"
                      : "sm:grid-cols-2 lg:grid-cols-3",
                )}
              >
                {page.items.map((item, i) => (
                  <div
                    key={`${i}-${item.title}`}
                    className="rounded-2xl border bg-muted/30 p-6 transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary/30 hover:bg-card hover:shadow-sm"
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <AboutValueIcon icon={item.icon} className="size-5" />
                    </span>
                    {item.title && <h3 className="mt-4 text-base font-semibold">{item.title}</h3>}
                    {item.text && <p className="mt-1.5 text-sm text-muted-foreground">{item.text}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {buildings.length > 0 && (
            <div>
              {page.buildingsTitle && (
                <h2 className="mb-10 text-center text-2xl font-semibold sm:text-3xl">{page.buildingsTitle}</h2>
              )}
              <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
                {buildings.map((b, i) => (
                  <div
                    key={`${i}-${b.name}`}
                    className="group overflow-hidden rounded-2xl border bg-card transition-shadow duration-200 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {b.image ? (
                        <Image
                          src={b.image}
                          alt={b.name || "Consorcio administrado"}
                          fill
                          sizes="(min-width: 1024px) 25vw, 50vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-muted-foreground">
                          <Building2 className="size-10" />
                        </span>
                      )}
                    </div>
                    {(b.name || b.address) && (
                      <div className="p-4">
                        {b.name && <h3 className="text-sm font-semibold sm:text-base">{b.name}</h3>}
                        {b.address && (
                          <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground sm:text-sm">
                            <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                            {b.address}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-3xl bg-primary/5 px-6 py-10 text-center">
            <div>
              {page.ctaEyebrow && (
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">{page.ctaEyebrow}</p>
              )}
              {page.ctaTitle && <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{page.ctaTitle}</h2>}
            </div>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  <Phone className="size-4" />
                  {phone}
                </a>
              )}
              {whatsapp && (
                <a
                  href={toWhatsAppLink(whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  <WhatsAppIcon className="size-4" />
                  WhatsApp
                </a>
              )}
              {!phone && !whatsapp && (
                <Link
                  href="#hablemos-hoy"
                  className="rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Contactanos
                </Link>
              )}
            </div>
            {address && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                {address}
              </p>
            )}
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
